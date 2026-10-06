from fastapi import APIRouter, HTTPException
from models.schema import ScanRequest, ScanResponse
from service.machineLearning import predict

router = APIRouter()

@router.post("/", response_model=ScanResponse)
async def analyze(request: ScanRequest):
    text = request.text.strip()

    if not text or len(text) < 5:
        raise HTTPException(status_code=400, detail="Text too short to analyze.")

    result = predict(text)

    if result is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not yet trained. Please train and export the model first."
        )

    raw_pred = str(result["prediction"]).lower().strip()
    prediction = "safe" if raw_pred in ["safe", "not scam", "not_scam"] else "scam"

    return ScanResponse(
        prediction  = prediction,
        confidence  = result["confidence"],
        risk_level  = get_risk_level(prediction, result["confidence"]),
        scam_type   = result.get("scam_type", "Scam Threat"),
        indicators  = result.get("indicators", {}),
        source      = "ml_model",
        explanation = build_explanation(prediction, result["confidence"]),
    )

def get_risk_level(prediction: str, confidence: int) -> str:
    if prediction == "safe":
        return "SAFE"
    if confidence >= 75:
        return "HIGH"
    elif confidence >= 50:
        return "MEDIUM"
    return "LOW"

def build_explanation(prediction: str, confidence: int) -> str:
    if prediction == "safe":
        return (
            f"Walang scam pattern ang natukoy ng aming ML model. "
            f"Ang mensaheng ito ay mukhang lehitimo ({confidence}% confidence)."
        )
    return (
        f"Ang aming ML model ay natukoy na ito ay isang SCAM "
        f"({confidence}% confidence). Huwag tumugon, mag-click ng links, "
        f"o magbahagi ng personal na impormasyon."
    )
# TruScan/BackEnd/routes/analyze.py
# POST /analyze — pure NLP+ML prediction

from fastapi import APIRouter, HTTPException
from models.schema import ScanRequest, ScanResponse
from service.machineLearning import predict

router = APIRouter()

@router.post("/", response_model=ScanResponse)
async def analyze(request: ScanRequest):
    text = request.text.strip()

    if not text or len(text) < 5:
        raise HTTPException(status_code=400, detail="Text too short to analyze.")

    # ── ML Model prediction only ──
    result = predict(text)

    if result is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not yet trained. Please train and export the model first."
        )

    return ScanResponse(
        prediction  = result["prediction"],
        confidence  = result["confidence"],
        risk_level  = get_risk_level(result["confidence"]),
        scam_type   = result.get("scam_type", ""),
        indicators  = result.get("indicators", {}),
        source      = "ml_model",
        explanation = build_explanation(result),
    )


def get_risk_level(confidence: int) -> str:
    if confidence >= 75:
        return "HIGH"
    elif confidence >= 45:
        return "MEDIUM"
    elif confidence >= 20:
        return "LOW"
    return "SAFE"


def build_explanation(result: dict) -> str:
    prediction = result["prediction"]
    confidence = result["confidence"]

    if prediction == "safe":
        return (
            f"Walang scam pattern ang natukoy ng aming ML model. "
            f"Ang mensaheng ito ay mukhang lehitimo ({confidence}% confidence). "
            f"Palaging mag-ingat — kapag may duda, makipag-ugnayan sa opisyal na channel."
        )
    elif prediction == "suspicious":
        return (
            f"Ang aming ML model ay nakakita ng ilang suspicious na pattern "
            f"({confidence}% confidence). Mag-ingat sa mensaheng ito at "
            f"huwag ibahagi ang personal na impormasyon."
        )
    else:
        return (
            f"Ang aming ML model ay natukoy na ito ay isang scam "
            f"({confidence}% confidence). Huwag tumugon, mag-click ng links, "
            f"o magbahagi ng personal na impormasyon."
        )
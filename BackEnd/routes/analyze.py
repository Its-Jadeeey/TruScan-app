from fastapi import APIRouter, HTTPException
from models.schema import ScanRequest, ScanResponse
from service.machineLearning import (
    predict,
    HIGH_RISK_THRESHOLD,
    LOW_RISK_THRESHOLD,
)

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

    scam_probability = result["scam_probability"]
    prediction, risk_level = get_tier(scam_probability)
    risk_score = round(scam_probability * 100)

    return ScanResponse(
        prediction  = prediction,
        confidence  = result["confidence"],
        risk_score  = risk_score,
        risk_level  = risk_level,
        scam_type   = result.get("scam_type", "Scam Threat"),
        indicators  = result.get("indicators", {}),
        source      = "ml_model",
        explanation = build_explanation(prediction, risk_score),
    )


def get_tier(scam_probability: float):
    """Map the model's scam probability (0-1) to (prediction, risk_level)."""
    if scam_probability >= HIGH_RISK_THRESHOLD:
        return "scam", "HIGH"
    if scam_probability >= LOW_RISK_THRESHOLD:
        return "suspicious", "MEDIUM"
    return "safe", "LOW"


def build_explanation(prediction: str, risk_score: int) -> str:
    if prediction == "safe":
        return (
            f"Walang malinaw na scam pattern ang natukoy ng aming ML model "
            f"({risk_score}% scam risk). Ang mensaheng ito ay mukhang lehitimo."
        )
    if prediction == "suspicious":
        return (
            f"Hindi tiyak ang resulta ng aming ML model ({risk_score}% scam risk). "
            f"Mag-ingat: huwag mag-click ng links o magbahagi ng personal na "
            f"impormasyon hangga't hindi mo na-verify ang nagpadala."
        )
    return (
        f"Ang aming ML model ay natukoy na ito ay isang SCAM "
        f"({risk_score}% scam risk). Huwag tumugon, mag-click ng links, "
        f"o magbahagi ng personal na impormasyon."
    )
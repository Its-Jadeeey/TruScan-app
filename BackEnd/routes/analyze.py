# TruScan/BackEnd/routes/analyze.py
# POST /analyze — main scan endpoint called by the mobile app

from fastapi import APIRouter
from models.schema import ScanRequest, ScanResponse
from service.machineLearning import predict
from service.ruleEngine import check_rules
from service.urlChecker import check_url
from service.emailChecker import check_email

router = APIRouter()

@router.post("/", response_model=ScanResponse)
async def analyze(request: ScanRequest):
    text = request.text.strip()

    # ── Step 1: Rule Engine (keyword + pattern check) ──
    rule_result = check_rules(text)

    # ── Step 2: ML Model prediction ──
    try:
        ml_result = predict(text)
    except Exception as e:
        ml_result = None

    # ── Step 3: URL check (if text contains a link) ──
    url_flags = check_url(text)

    # ── Step 4: Email check (if text contains an email) ──
    email_flags = check_email(text)

    # ── Step 5: Combine results ──
    # ML model takes priority if available, fallback to rule engine
    if ml_result:
        prediction = ml_result["prediction"]
        confidence = ml_result["confidence"]
        source     = "ml_model"
    else:
        prediction = rule_result["prediction"]
        confidence = rule_result["confidence"]
        source     = "rule_engine"

    # Escalate to scam if URL or email flags are triggered
    if url_flags["is_suspicious"] or email_flags["is_suspicious"]:
        prediction = "scam"
        confidence = max(confidence, 85)

    # ── Step 6: Build indicators ──
    indicators = {
        "keywords": rule_result.get("keywords", []),
        "urgency":  rule_result.get("urgency", []),
        "domains":  url_flags.get("flagged_domains", []),
        "emails":   email_flags.get("flagged_emails", []),
    }

    return ScanResponse(
        prediction  = prediction,
        confidence  = confidence,
        risk_level  = get_risk_level(confidence),
        scam_type   = rule_result.get("scam_type", ""),
        indicators  = indicators,
        source      = source,
        explanation = build_explanation(prediction, indicators),
    )


def get_risk_level(confidence: int) -> str:
    if confidence >= 75:
        return "HIGH"
    elif confidence >= 45:
        return "MEDIUM"
    elif confidence >= 20:
        return "LOW"
    return "SAFE"


def build_explanation(prediction: str, indicators: dict) -> str:
    if prediction == "safe":
        return "Walang suspicious na pattern ang nakita. Mukhang lehitimo ang mensaheng ito."
    if indicators["domains"]:
        return f"Phishing URL detected: '{indicators['domains'][0]}' ay hindi official na domain. Huwag i-click."
    if indicators["urgency"]:
        return f"Urgency tactic detected: '{indicators['urgency'][0]}' — dinisenyo para mapilitan kang kumilos nang mabilis."
    if indicators["keywords"]:
        return f"Suspicious keywords detected: {', '.join(indicators['keywords'][:3])}. Mag-ingat sa mensaheng ito."
    return "Multiple suspicious patterns detected. Huwag ibahagi ang personal o financial na impormasyon."
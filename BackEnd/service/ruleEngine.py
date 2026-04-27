# TruScan/BackEnd/service/ruleEngine.py
# Keyword-based rule engine — detects Filipino scam patterns

from core.scamPatterns import SCAM_PATTERNS

URGENCY_WORDS = [
    "urgent", "agad", "ngayon", "24 hours", "48 hours",
    "expire", "bilisan", "limited", "act now", "immediately",
    "2 hours", "asap", "huling pagkakataon", "mabilis",
]

def check_rules(text: str) -> dict:
    lower = text.lower()
    upper = text.upper()

    found_keywords = []
    found_urgency  = []
    detected_type  = ""
    score          = 0

    # ── Check urgency words ──
    for word in URGENCY_WORDS:
        if word in lower:
            found_urgency.append(word)
            score += 15

    # ── Check scam patterns ──
    for scam_type, patterns in SCAM_PATTERNS.items():
        type_score = 0

        for keyword in patterns.get("keywords", []):
            if keyword.lower() in lower:
                found_keywords.append(keyword)
                type_score += 10

        for phrase in patterns.get("phrases", []):
            if phrase.lower() in lower:
                found_keywords.append(phrase)
                type_score += 20

        if type_score > 0 and type_score > score:
            score        = type_score
            detected_type = scam_type

    # Add urgency score
    score += len(found_urgency) * 15
    score  = min(score, 100)

    # ── Determine prediction ──
    if score >= 45:
        prediction = "scam"
    elif score >= 20:
        prediction = "suspicious"
    else:
        prediction = "safe"

    return {
        "prediction": prediction,
        "confidence": score,
        "keywords":   list(set(found_keywords)),
        "urgency":    list(set(found_urgency)),
        "scam_type":  detected_type,
    }
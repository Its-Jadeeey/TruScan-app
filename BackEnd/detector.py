def detect_phishing(text: str):
    suspicious_words = ["urgent", "verify", "bank", "click", "password", "login"]

    score = 0
    for word in suspicious_words:
        if word in text.lower():
            score += 1

    if score >= 2:
        return {"result": "Phishing", "risk_score": score}
    
    return {"result": "Safe", "risk_score": score}
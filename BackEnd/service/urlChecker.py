# TruScan/BackEnd/service/urlChecker.py
# Detects suspicious URLs and phishing domains in text

import re

# Known phishing domain patterns for Filipino scams
SUSPICIOUS_DOMAINS = [
    "gcash-winner", "gcash-verify", "gcash-claim",
    "sss-update", "sss-verify", "sss-ph",
    "lbc-parcel", "jt-delivery", "jnt-ph",
    "bdo-verification", "bpi-verify",
    "pera-agad", "padala-now",
    "bit.ly", "tinyurl", "t.co", "rb.gy",
    "shopee-prize", "lazada-winner",
]

# Legitimate domains — whitelist
SAFE_DOMAINS = [
    "gcash.com", "maya.ph", "bdo.com.ph",
    "bpi.com.ph", "sss.gov.ph", "philhealth.gov.ph",
    "pagibig.gov.ph", "lbc.com.ph", "shopee.ph",
    "lazada.com.ph", "facebook.com", "google.com",
]

def extract_urls(text: str) -> list:
    pattern = r'https?://[^\s]+|www\.[^\s]+'
    return re.findall(pattern, text, re.IGNORECASE)

def check_url(text: str) -> dict:
    urls           = extract_urls(text)
    flagged        = []
    is_suspicious  = False

    for url in urls:
        url_lower = url.lower()

        # Check if it matches a safe domain
        is_safe = any(safe in url_lower for safe in SAFE_DOMAINS)
        if is_safe:
            continue

        # Check if it matches a suspicious domain
        is_bad = any(bad in url_lower for bad in SUSPICIOUS_DOMAINS)
        if is_bad:
            flagged.append(url)
            is_suspicious = True
            continue

        # Check for suspicious patterns in URL
        if any(word in url_lower for word in ["verify", "claim", "winner", "prize", "update", "confirm"]):
            flagged.append(url)
            is_suspicious = True

    return {
        "urls_found":       urls,
        "flagged_domains":  flagged,
        "is_suspicious":    is_suspicious,
    }
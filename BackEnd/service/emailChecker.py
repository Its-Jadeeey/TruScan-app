# TruScan/BackEnd/service/emailChecker.py
# Detects suspicious email addresses and domains

import re

SUSPICIOUS_EMAIL_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com",
    "outlook.com", "protonmail.com",
]

# Legitimate organizations should use official domains
# If SSS, GCash, BDO etc. sends from Gmail — it's a scam
OFFICIAL_SENDERS = {
    "gcash":      "gcash.com",
    "maya":       "maya.ph",
    "bdo":        "bdo.com.ph",
    "bpi":        "bpi.com.ph",
    "sss":        "sss.gov.ph",
    "philhealth": "philhealth.gov.ph",
    "pagibig":    "pagibig.gov.ph",
    "lbc":        "lbc.com.ph",
}

def extract_emails(text: str) -> list:
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return re.findall(pattern, text)

def check_email(text: str) -> dict:
    emails        = extract_emails(text)
    flagged       = []
    is_suspicious = False

    lower = text.lower()

    for email in emails:
        email_lower  = email.lower()
        email_domain = email_lower.split("@")[1]

        # Check if message mentions an official org but email is from Gmail etc.
        for org, official_domain in OFFICIAL_SENDERS.items():
            if org in lower and email_domain != official_domain:
                if email_domain in SUSPICIOUS_EMAIL_DOMAINS:
                    flagged.append(email)
                    is_suspicious = True

    return {
        "emails_found":   emails,
        "flagged_emails": flagged,
        "is_suspicious":  is_suspicious,
    }
# TruScan/BackEnd/core/scamPatterns.py

SCAM_PATTERNS = {
    "FINANCIAL_EWALLET": {
        "keywords": ["gcash", "paymaya", "maya", "wallet", "otp", "mpin",
                     "bank transfer", "account blocked", "unauthorized"],
        "phrases":  ["verify your account", "enter your otp",
                     "account suspended", "may unauthorized transaction"],
    },
    "GOVERNMENT_IMPERSONATION": {
        "keywords": ["sss", "bir", "philhealth", "pagibig", "penalty", "tax"],
        "phrases":  ["unpaid taxes", "legal action", "account investigation",
                     "claim your benefit"],
    },
    "LOTTERY_PRIZE": {
        "keywords": ["winner", "prize", "lottery", "nanalo", "congratulations",
                     "claim now", "panalo"],
        "phrases":  ["you have won", "claim your prize", "selected as winner"],
    },
    "DELIVERY_COURIER": {
        "keywords": ["lbc", "j&t", "jnt", "parcel", "package", "customs",
                     "delivery fee", "shopee", "lazada"],
        "phrases":  ["parcel on hold", "pay delivery fee", "failed delivery"],
    },
    "JOB_TASK": {
        "keywords": ["job offer", "part time", "earn money", "daily income",
                     "commission", "work from home"],
        "phrases":  ["earn 5000 daily", "no experience needed", "simple task only"],
    },
    "INVESTMENT": {
        "keywords": ["investment", "crypto", "trading", "profit", "roi"],
        "phrases":  ["guaranteed profit", "double your money", "no risk"],
    },
    "PHISHING_LINK": {
        "keywords": ["click here", "verify", "login", "update your details"],
        "phrases":  ["click here to verify", "login to your account"],
    },
    "ROMANCE": {
        "keywords": ["love", "miss you", "relationship", "send money", "emergency"],
        "phrases":  ["i need help financially", "send money for emergency"],
    },
    "ONLINE_LOAN": {
        "keywords": ["loan", "fast cash", "approved", "no requirements"],
        "phrases":  ["loan approved instantly", "no collateral", "pay processing fee"],
    },
    "SIM_SWAP": {
        "keywords": ["sim", "deactivated", "upgrade", "verify your number"],
        "phrases":  ["sim will be deactivated", "confirm sim upgrade"],
    },
}
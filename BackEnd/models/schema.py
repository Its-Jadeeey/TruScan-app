from typing import Literal, Optional
from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    text:    str
    user_id: Optional[str] = "anonymous"


class ReportRequest(BaseModel):
    text:         str = Field(min_length=5, max_length=5000)
    channel:      Literal["sms", "email", "link"] = "sms"
    type:         Optional[Literal["sms", "email", "url"]] = None
    scamCategory: Optional[Literal[
        "financial", "government", "delivery", "job", "lottery", "shopping",
        "investment", "phishing", "smishing", "romance", "impersonation",
        "loan", "travel", "simswap", "charity",
    ]] = None
    remark:       str = Field(default="", max_length=500)
    mode:         Literal["normal", "simple"] = "normal"
    source:       Literal["mobile_app", "scan_recommendation", "report_form"] = "mobile_app"


class ScanResponse(BaseModel):
    prediction:  str        # 'scam' | 'suspicious' | 'safe'
    confidence:  int        # 0-100, confidence in the model's top class
    risk_score:  int = 0    # 0-100, probability that the text is a scam
    risk_level:  str        # 'HIGH' | 'MEDIUM' | 'LOW'
    scam_type:   str        # e.g. 'FINANCIAL_EWALLET'
    indicators:  dict
    source:      str        # 'ml_model'
    explanation: str


class ReportResponse(BaseModel):
    success: bool
    id:      Optional[str] = None
    message: str
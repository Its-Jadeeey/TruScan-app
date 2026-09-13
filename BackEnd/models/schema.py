# TruScan/BackEnd/models/schema.py

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ScanRequest(BaseModel):
    text:    str
    user_id: Optional[str] = "anonymous"

class ReportRequest(BaseModel):
    text:          str
    category:      str
    channel:       Optional[str] = "sms"
    mode:          Optional[str] = "normal"
    source:        Optional[str] = "mobile_app"
    ml_prediction: Optional[Dict[str, Any]] = Field(default=None, alias="mlPrediction")

    class Config:
        populate_by_name = True

# ── Response Models ─────────────────────────────────────────

class ScanResponse(BaseModel):
    prediction:  str        # 'scam' | 'suspicious' | 'safe'
    confidence:  int        # 0-100
    risk_level:  str        # 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE'
    scam_type:   str        # e.g. 'FINANCIAL_EWALLET'
    indicators:  dict
    source:      str        # 'ml_model' | 'rule_engine'
    explanation: str

class ReportResponse(BaseModel):
    success: bool
    id:      Optional[str] = None
    message: str
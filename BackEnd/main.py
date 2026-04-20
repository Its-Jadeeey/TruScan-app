from fastapi import FastAPI
from pydantic import BaseModel
from BackEnd.detector import detect_phishing

app = FastAPI()

class InputData(BaseModel):
    text: str

@app.post("/predict")
def predict(data: InputData):
    result = detect_phishing(data.text)
    return {"result": result}   
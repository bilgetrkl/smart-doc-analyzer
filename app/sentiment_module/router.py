# app/sentiment_module/router.py

from fastapi import APIRouter
from pydantic import BaseModel
from app.sentiment_module.service import analyze_text_full

router = APIRouter(
    prefix="/sentiment",
    tags=["Sentiment Analysis"],
)


class SentimentRequest(BaseModel):
    text: str


@router.post("/analyze")
def analyze(req: SentimentRequest):
    
    return analyze_text_full(req.text)

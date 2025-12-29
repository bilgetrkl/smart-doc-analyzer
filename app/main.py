from fastapi import FastAPI
from app.qa_module.router import router as qa_module_router
from app.sentiment_module.router import router as sentiment_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Smart Document Analyzer",
    description="Question-Answering and Advanced Sentiment Analysis for PDF documents."
)

origins = [
    "http://127.0.0.1:5500",  
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
    "null",                 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],   
)

@app.get("/")
def root():
    return {"message": "Smart Document Analyzer is working"}

app.include_router(qa_module_router, prefix="/qa", tags=["Question Answering"])
app.include_router(sentiment_router)
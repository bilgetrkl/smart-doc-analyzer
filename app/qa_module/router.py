from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.core.pdf_parser import extract_text_from_pdf 
from . import services  

router = APIRouter()

@router.post("/ask-pdf")
async def ask_question_from_pdf(
    question: str = Form(...), 
    file: UploadFile = File(...)
):
    """
    Upload a PDF file and ask a question about its content.
    """
    
    try:
        context = await extract_text_from_pdf(file)
    except HTTPException as e:
        return {"error": e.detail}

    answer = services.find_answer_in_text(question=question, context=context)

    return {
        "filename": file.filename,
        "question": question,
        "answer": answer
    }
import io
import fitz 
from fastapi import UploadFile, HTTPException

async def extract_text_from_pdf(file: UploadFile):
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Hata: Sadece PDF dosyaları kabul edilmektedir.")

    try:
        pdf_bytes = await file.read()
        
        with io.BytesIO(pdf_bytes) as pdf_stream:
            with fitz.open(stream=pdf_stream, filetype="pdf") as doc:
                
                full_text = ""
                for page in doc:
                    full_text += page.get_text() + "\n"
                
                if not full_text:
                    raise HTTPException(status_code=400, detail="PDF'ten metin çıkarılamadı.")

                return full_text
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metin çıkarma hatası: {str(e)}")
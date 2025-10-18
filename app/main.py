from fastapi import FastAPI, UploadFile, File, HTTPException
import pdfplumber
import io

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Smart Doc Analyzer is running"}

@app.post("/upload-pdf-and-extract-text/")
async def upload_pdf_and_extract(file: UploadFile = File(...)):
    
    # Is the uploaded file a PDF?
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Hata: Sadece PDF dosyaları kabul edilmektedir.")

    try:
        # Read the uploaded file as bytes
        pdf_bytes = await file.read()
        
        # Transform bytes to a BytesIO stream for pdfplumber
        with io.BytesIO(pdf_bytes) as pdf_stream:
            # Open the PDF with pdfplumber
            with pdfplumber.open(pdf_stream) as pdf:
                
                full_text = ""
                # Extract text from each page
                for page in pdf.pages:
                    full_text += page.extract_text() + "\n" 
                
                # Return the extracted text
                return {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "extracted_text": full_text
                }
                
    except Exception as e:
        # Handle any exceptions that occur during PDF processing
        raise HTTPException(status_code=500, detail=f"Metin çıkarma hatası: {str(e)}")
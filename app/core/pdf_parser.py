import io
import fitz  
import re
from fastapi import UploadFile, HTTPException

async def extract_text_from_pdf(file: UploadFile):
    """
    Extract clean text from PDF by:
    1. Removing text from images and vector drawings (diagrams)
    2. Merging hyphenated line breaks
    3. Cleaning headers and footers
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Error: Only PDF files are accepted.")

    try:
        pdf_bytes = await file.read()
        
        with io.BytesIO(pdf_bytes) as pdf_stream:
            with fitz.open(stream=pdf_stream, filetype="pdf") as doc:
                
                full_text = []
                
                exclude_patterns = [
                    re.compile(r'arXiv:\d+\.\d+v\d+', re.IGNORECASE),
                    re.compile(r'^\d+$'),
                    re.compile(r'^(Figure|Fig\.|Table|Tab\.)\s*\d+', re.IGNORECASE) 
                ]

                print(f"Processing PDF: {len(doc)} pages")

                for page_num, page in enumerate(doc, start=1):
                    
                    exclusion_rects = []

                    for img in page.get_images():
                        exclusion_rects.extend(page.get_image_rects(img[0]))

                    drawings = page.get_drawings()
                    for draw in drawings:
                        rect = draw["rect"]
                        if rect.width > 50 and rect.height > 50:
                            exclusion_rects.append(rect)

                    blocks = page.get_text("blocks", sort=True)
                    page_clean_content = []
                    
                    for b in blocks:
                        b_rect = fitz.Rect(b[:4])
                        text_content = b[4]
                        
                        is_overlapping = False
                        for exclude_area in exclusion_rects:
                            if b_rect.intersects(exclude_area):
                                is_overlapping = True
                                break
                        
                        if is_overlapping:
                            continue

                        text_content = re.sub(r'-\s*\n\s*', '', text_content)
                        text_content = re.sub(r'([a-z])\s*\n\s*([a-z])', r'\1 \2', text_content)
                        text_content = re.sub(r'\s+', ' ', text_content).strip()

                        if any(p.search(text_content) for p in exclude_patterns):
                            continue

                        if len(text_content) < 3:
                            continue
                            
                        page_clean_content.append(text_content)
                    
                    if page_clean_content:
                        full_text.append(f"--- Page {page_num} ---")
                        full_text.append("\n\n".join(page_clean_content))
                
                final_text = "\n\n".join(full_text)
                return final_text

    except Exception as e:
        print(f"Error details: {e}")
        raise HTTPException(status_code=500, detail=f"Text extraction error: {str(e)}")
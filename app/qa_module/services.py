from transformers import pipeline

print("QA Modeli yükleniyor...")
qa_pipeline = pipeline(
    "question-answering", 
    model="distilbert-base-cased-distilled-squad"
)
print("QA Modeli yüklendi.")


def find_answer_in_text(question: str, context: str):
    """
    Given a question and context text, use the QA model to find the answer.
    """
    
    print(f"Soru alınıyor: {question}")
    print(f"Metin üzerinde cevap aranıyor...")
    
    try:
        result = qa_pipeline(question=question, context=context)
        return result['answer']
    except Exception as e:
        print(f"Model hatası: {e}")
        return "Hata: Model cevap üretirken bir sorunla karşılaştı."
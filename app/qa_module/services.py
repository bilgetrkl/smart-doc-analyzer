import torch
import time
from transformers import pipeline

# Safety limit for text length
MAX_CONTEXT_CHARS = 75000 

# Extractive Model: Locates the exact answer in the text.
EXTRACTIVE_MODEL_NAME = "deepset/deberta-v3-base-squad2" 

# Check device availability (GPU is preferred)
device = 0 if torch.cuda.is_available() else -1
device_name = 'GPU' if device == 0 else 'CPU'

print(f"--- System Initialization on {device_name} ---")

# --- LOAD MODEL ---
try:
    print(f"Loading Extractive QA Model ({EXTRACTIVE_MODEL_NAME})...")
    extractive_pipeline = pipeline(
        "question-answering", 
        model=EXTRACTIVE_MODEL_NAME,
        device=device,
        handle_impossible_answer=True 
    )
    print("Model loaded successfully.")
    
except Exception as e:
    print(f"CRITICAL ERROR: Could not load model. Details: {e}")
    exit()


# --- HELPER FUNCTIONS ---

def expand_to_sentence(text, start_index, end_index):
    """
    Expands the exact answer span to the full sentence for better readability.
    """
    punctuations = ['.', '!', '?']
    
    sent_start = 0
    text_before = text[:start_index]
    for p in punctuations:
        last_p = text_before.rfind(p)
        if last_p > sent_start:
            sent_start = last_p    
    if sent_start > 0: sent_start += 1
        
    sent_end = len(text)
    for p in punctuations:
        next_p = text.find(p, end_index)
        if next_p != -1 and next_p < sent_end:
            sent_end = next_p + 1 
            
    return text[sent_start:sent_end].strip()

# --- MAIN LOGIC ---

def find_answer_in_text(question: str, context: str):
    print(f"\n{'='*60}")
    print(f"PROCESSING QUESTION: '{question}'")
    print(f"{'='*60}")
    
    start_time = time.time()

    # If context is larger than MAX_CONTEXT_CHARS, process in overlapping chunks
    chunk_size = MAX_CONTEXT_CHARS
    overlap = int(chunk_size * 0.2)  # 20% overlap to avoid cutting answers

    if len(context) > chunk_size:
        print(f"INFO: Context ({len(context)} chars) exceeds {chunk_size} chars. Processing in chunks with {overlap} char overlap.")
        chunks = []
        start = 0
        while start < len(context):
            end = min(start + chunk_size, len(context))
            chunks.append((start, context[start:end]))
            if end == len(context):
                break
            start = end - overlap
    else:
        chunks = [(0, context)]

    try:
        all_candidates = []

        # Run the Extractive Pipeline on each chunk and collect candidates with global spans
        for chunk_start, chunk_text in chunks:
            preds = extractive_pipeline(
                question=question,
                context=chunk_text,
                top_k=3,
                max_answer_len=200,
                max_seq_len=512,
                doc_stride=256
            )

            if not isinstance(preds, list):
                preds = [preds]

            for p in preds:
                # defensive copy
                p_global = p.copy()
                if 'start' in p and 'end' in p:
                    p_global['start'] = p['start'] + chunk_start
                    p_global['end'] = p['end'] + chunk_start
                all_candidates.append(p_global)

        if not all_candidates:
            return "I couldn't find a confident answer in the document."

        # Sort all candidates by score and pick the best
        all_candidates.sort(key=lambda x: x.get('score', 0), reverse=True)
        best_answer = all_candidates[0]
        if best_answer.get('score', 0) < 0.01:
            return "I couldn't find a confident answer in the document."

        # Format the Output
        raw_answer = best_answer['answer']
        
        # Expand to full sentence for better context
        full_sentence = expand_to_sentence(context, best_answer['start'], best_answer['end'])
        
        elapsed = time.time() - start_time
        print(f"\n--- Done in {elapsed:.3f} seconds ---")
        
        return full_sentence if full_sentence else raw_answer

    except Exception as e:
        print(f"ERROR: {e}")
        return f"An error occurred: {str(e)}"

# --- TESTING BLOCK ---
if __name__ == "__main__":
    test_context = """
    Artificial intelligence is the simulation of human intelligence processes by machines, 
    especially computer systems. These processes include learning, reasoning, and self-correction.
    Machine learning is a subset of AI that enables systems to learn and improve from experience.
    """
    
    test_question = "What is artificial intelligence?"
    answer = find_answer_in_text(test_question, test_context)
    print(f"\nFINAL ANSWER: {answer}")

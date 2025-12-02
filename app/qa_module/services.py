import torch
import time
import re
from transformers import pipeline

# --- CONFIGURATION ---
# Safety limit for text length to prevent CPU freezing.
MAX_CONTEXT_CHARS = 20000 

# --- MODEL DEFINITIONS ---
# 1. Extractive Model (The Finder): Locates the exact answer in the text.
EXTRACTIVE_MODEL_NAME = "deepset/deberta-v3-base-squad2"

# 2. Generative Model (The Fixer): Rewrites the answer to be natural and clean.
# "google/flan-t5-base" is efficient. Use "google/flan-t5-large" if you want even better grammar.
GENERATIVE_MODEL_NAME = "google/flan-t5-base" 

# Check device availability
device = 0 if torch.cuda.is_available() else -1
device_name = 'GPU' if device == 0 else 'CPU'

print(f"--- System Initialization on {device_name} ---")

# --- LOAD MODELS ---
try:
    print("1. Loading Extractive QA Model (DeBERTa)...")
    extractive_pipeline = pipeline(
        "question-answering", 
        model=EXTRACTIVE_MODEL_NAME,
        device=device,
        handle_impossible_answer=True
    )
    
    print("2. Loading Generative Model (Flan-T5)...")
    # text2text-generation is ideal for rewriting tasks
    generative_pipeline = pipeline(
        "text2text-generation",
        model=GENERATIVE_MODEL_NAME,
        device=device
    )
    print("All models loaded successfully.")
    
except Exception as e:
    print(f"CRITICAL ERROR: Could not load models. Details: {e}")
    exit()


# --- HELPER FUNCTIONS ---

def expand_to_sentence(text, start_index, end_index):
    """
    Expands a found text span to the full containing sentence.
    This provides the necessary context for the Generative AI to rewrite it properly.
    """
    punctuations = ['.', '!', '?']
    
    # 1. Find the start of the sentence (Search backwards)
    text_before = text[:start_index]
    sent_start = 0
    for p in punctuations:
        last_p = text_before.rfind(p)
        if last_p > sent_start:
            sent_start = last_p     
    if sent_start > 0: sent_start += 1
        
    # 2. Find the end of the sentence (Search forward)
    sent_end = len(text)
    for p in punctuations:
        next_p = text.find(p, end_index)
        if next_p != -1 and next_p < sent_end:
            sent_end = next_p + 1 
            
    return text[sent_start:sent_end].strip()

# --- MAIN LOGIC ---

def find_answer_in_text(question: str, context: str):
    print(f"\n--- Processing Question: '{question}' ---")
    
    # 1. Safety Truncation
    if len(context) > MAX_CONTEXT_CHARS:
        print(f"WARNING: Context is too long. Truncating to {MAX_CONTEXT_CHARS} chars...")
        context = context[:MAX_CONTEXT_CHARS]
    
    start_time = time.time()
    
    try:
        # ---------------------------------------------------------
        # STEP 1: EXTRACTIVE SEARCH (Find the raw answer)
        # ---------------------------------------------------------
        print("Step 1: Locating answer in text (Extractive)...")
        
        result = extractive_pipeline(
            question=question, 
            context=context,
            max_answer_len=100,
            max_seq_len=512,
            doc_stride=128
        )
        
        # Confidence Check
        if result['score'] < 0.1:
            return "I couldn't find a confident answer in the provided document."
        
        raw_answer = result['answer'].strip()
        if not raw_answer:
            return "No answer found in the document."

        print(f"   Found raw segment: '{raw_answer}'")
        
        # Expand to full sentence to give the Generative AI enough context
        full_sentence_context = expand_to_sentence(context, result['start'], result['end'])
        print(f"   Context for GenAI: '{full_sentence_context}'")

        # ---------------------------------------------------------
        # STEP 2: GENERATIVE REFINEMENT (The "Fixer" Phase)
        # ---------------------------------------------------------
        print("Step 2: Fixing and rewriting answer (Generative)...")
        
        # We tell the model specifically to fix the grammar and remove artifacts
        prompt = (
            f"Fix the grammar and remove hyphenation artifacts from this text. "
            f"Make it a clear, complete sentence.\n\n"
            f"Text: {full_sentence_context}"
        )
        
        generated_output = generative_pipeline(
            prompt,
            max_length=128,
            min_length=5,
            do_sample=False, # Deterministic for consistency
            truncation=True
        )
        
        final_answer = generated_output[0]['generated_text']
        
        elapsed = time.time() - start_time
        print(f"--- Process Completed in {elapsed:.2f} seconds ---")
        
        return final_answer
        
    except Exception as e:
        print(f"ERROR: {e}")
        return f"An error occurred: {str(e)}"

# --- TESTING BLOCK ---
if __name__ == "__main__":
    # Example text with specific PDF artifacts (hyphenation and line breaks)
    # The Extractive model would return "synthe- sizing", but GenAI should fix it.
    test_context = """
    We propose Socrat-
    icAgent, a self-play multi-agent system capable of synthe-
    sizing RS-EoT reasoning traces from remote sensing VQA datasets. 
    The glance effect is a psycho-
    logical phenomenon where a person makes a reasoning based on a single, coarse percep-
    tion.
    """
    
    # Test 1
    q1 = "What is SocraticAgent?"
    print(f"\nTEST QUESTION: {q1}")
    output1 = find_answer_in_text(q1, test_context)
    print(f"FINAL RESULT: {output1}")

    # Test 2
    q2 = "What is glance effect?"
    print(f"\nTEST QUESTION: {q2}")
    output2 = find_answer_in_text(q2, test_context)
    print(f"FINAL RESULT: {output2}")
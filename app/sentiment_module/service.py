# app/sentiment_module/service.py
import sys
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import re

SENTIMENT_REPO = Path("C:/Users/User/Desktop/NLP Proje/SentimentAnalysis")

if str(SENTIMENT_REPO) not in sys.path:
    sys.path.insert(0, str(SENTIMENT_REPO))

_argv_backup = sys.argv
sys.argv = [sys.argv[0]]

from arguments import args           
from analyzer import Analyzer         

sys.argv = _argv_backup

# ---------------- POLARITY MODELİ (Positive / Negative) ---------------- #

print("Initializing Sentiment Analyzer (polarity, using local project)...")
sentiment_analyzer = Analyzer(will_train=False, args=args)
sentiment_analyzer.model.eval()


def analyze_polarity(text: str):
    """
    Positive / Negative modelini kullanır.
    """
    label, percentage = sentiment_analyzer.classify_sentiment(text)
    return {
        "label": label,                # "Positive" veya "Negative"
        "score": percentage / 100.0,   # 0–1 arası float
    }

HELPFUL_MODEL_DIR = SENTIMENT_REPO / "models" / "helpful_distil"
print("Initializing Helpfulness/Creativity model from:", HELPFUL_MODEL_DIR)

help_device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

help_tokenizer = AutoTokenizer.from_pretrained(str(HELPFUL_MODEL_DIR))
help_model = AutoModelForSequenceClassification.from_pretrained(
    str(HELPFUL_MODEL_DIR)
).to(help_device)
help_model.eval()

HELP_LABELS = [ "helpful", "creative", "unhelpful"]

CREATIVE_HINT_WORDS = [
    "story", "metaphor", "imagine", "visualize",
    "analogy", "creative", "narrative", "scenario",
    "lighthouse", "stormy sea", "picture", "painted a picture"
]

def looks_creative(text: str) -> bool:
  
    if not text:
        return False
    s = text.lower()
    tokens = re.findall(r"[a-zğüşöçıİĞÜŞÖÇ']+", s)
    if not tokens:
        return False

    uniq_ratio = len(set(tokens)) / max(1, len(tokens))
    long_enough = len(tokens) >= 15

    has_hint = any(w in s for w in CREATIVE_HINT_WORDS)
    has_examples = any(p in s for p in ["for example", "for instance", "e.g.", "such as", " like "])

    return has_hint or has_examples or (long_enough and uniq_ratio >= 0.45)

def analyze_helpfulness(text: str):
    inputs = help_tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=256,
    ).to(help_device)

    with torch.no_grad():
        outputs = help_model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)[0].cpu().tolist()

    best_index = int(max(range(len(probs)), key=lambda i: probs[i]))
    best_score = float(probs[best_index])

    HELP_LABELS = ["helpful", "creative", "unhelpful"]
    raw_label = HELP_LABELS[best_index]
    final_label = raw_label

    if raw_label == "creative" and best_score < 0.60:
        final_label = "helpful"

    polarity = analyze_polarity(text)          
    sentiment_label = polarity["label"]        # "Positive" / "Negative"
    sentiment_pct = polarity["score"] * 100.0  # 0–1 → yüzdeye çevirme

    is_clearly_positive = (
        sentiment_label.lower() == "positive" and sentiment_pct >= 70
    )

    if raw_label == "unhelpful" and is_clearly_positive and looks_creative(text):
        final_label = "creative"

    return {
        "label": final_label,
        "score": best_score,
    }


def analyze_text_full(text: str):
    
    return {
        "sentiment": analyze_polarity(text),
        "helpfulness": analyze_helpfulness(text),
    }

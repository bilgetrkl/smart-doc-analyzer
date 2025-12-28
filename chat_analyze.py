import argparse
from transformers import pipeline
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import json
import sys

def load_helpfulness_model(model_dir):
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    return tokenizer, model

def analyze_helpfulness(text, tokenizer, model):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    outputs = model(**inputs)
    probs = torch.softmax(outputs.logits, dim=-1)[0]
    probs = probs.detach().cpu().numpy().tolist()

    labels = ["helpful", "creative", "unhelpful"]
    idx = int(torch.argmax(outputs.logits, dim=-1).item())

    return {
        "label": labels[idx],
        "score": round(float(probs[idx]), 4),
        "probs": {labels[i]: round(float(probs[i]), 4) for i in range(3)}
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--helpful_model_dir", type=str, default=r"models\helpful_distil")
    args = ap.parse_args()

    print("Loading sentiment model...")
    sentiment = pipeline("sentiment-analysis")

    print(f"Loading helpfulness model from {args.helpful_model_dir}...")
    tok, helpful_model = load_helpfulness_model(args.helpful_model_dir)

    print("\nReady! Type a message to analyze.")
    print("Type 'quit' or 'exit' to stop.\n")

    while True:
        try:
            text = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting.")
            break

        if text.lower() in ["quit", "exit"]:
            print("Goodbye!")
            break

        if not text:
            continue

        # Sentiment
        sent_out = sentiment(text)[0]
        positivity = round(sent_out['score'] * 100, 2) if sent_out['label'] == "POSITIVE" else round((1 - sent_out['score']) * 100, 2)

        # Helpfulness
        hlp_out = analyze_helpfulness(text, tok, helpful_model)

        # Output
        result = {
            "input": text,
            "sentiment": {
                "label": sent_out['label'].lower(),
                "positivity_percent": positivity
            },
            "helpfulness": hlp_out
        }

        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()

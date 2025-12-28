import argparse, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

p = argparse.ArgumentParser()
p.add_argument("--model_name_or_path", required=True)
p.add_argument("--text", required=True)
args = p.parse_args()

tok = AutoTokenizer.from_pretrained(args.model_name_or_path)
model = AutoModelForSequenceClassification.from_pretrained(args.model_name_or_path)
model.eval()

enc = tok(args.text, return_tensors="pt", truncation=True, max_length=256)
with torch.no_grad():
    logits = model(**enc).logits
    probs = torch.softmax(logits, dim=-1).squeeze(0).tolist()

id2label = model.config.id2label
top = int(logits.argmax(dim=-1))
print({
    "label": id2label[top],
    "score": float(probs[top]),
    "probs": {id2label[i]: float(p) for i, p in enumerate(probs)}
})

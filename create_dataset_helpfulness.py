# create_dataset_helpfulness.py

import argparse
import random
import re
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

CREATIVE_HINT_WORDS = {
    "creative", "imaginative", "original", "novel", "innovative", "unique",
    "inventive", "fresh", "clever", "unusual", "surprising", "inspired", "insightful"
}

def clean(t: str) -> str:
    if not isinstance(t, str):
        return ""
    t = t.replace("\r", " ").replace("\n", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t

def vote_label(num, den, min_votes, hi_thr, lo_thr):
   
    try:
        num, den = int(num), int(den)
    except Exception:
        return None
    if den >= min_votes and den > 0:
        r = num / den
        if r >= hi_thr:
            return "helpful"
        if r <= lo_thr:
            return "unhelpful"
    return None

def looks_creative(text: str) -> bool:
    
    if not text:
        return False
    s = text.lower()
    tokens = re.findall(r"[a-z']+", s)
    if not tokens:
        return False

    uniq_ratio = len(set(tokens)) / max(1, len(tokens))
    long_enough = len(tokens) >= 20

    has_hint = any(w in s for w in CREATIVE_HINT_WORDS)
    has_examples = any(p in s for p in ["for example", "for instance", "e.g.", "such as", " like "])
    has_listy = any(p in s for p in ["1.", "2.", "• ", "- ", "steps", "tip", "tips"])

    return has_hint or has_examples or has_listy or (long_enough and uniq_ratio >= 0.50)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Path to Reviews.csv")
    ap.add_argument("--outdir", default="data/helpfulness", help="Where to write train/valid/test CSVs")
    ap.add_argument("--val_ratio", type=float, default=0.1)
    ap.add_argument("--test_ratio", type=float, default=0.0)
    ap.add_argument("--min_votes", type=int, default=5)
    ap.add_argument("--hi_thr", type=float, default=0.7)
    ap.add_argument("--lo_thr", type=float, default=0.3)
    ap.add_argument("--max_per_class", type=int, default=2000, help="Cap per label for balance/speed")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    random.seed(args.seed)

    out = Path(args.outdir)
    out.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.input, encoding="utf-8", engine="python")

    df["Summary"] = df["Summary"].astype(str).fillna("")
    df["Text"] = df["Text"].astype(str).fillna("")
    df["text"] = (df["Summary"].map(clean) + ". " + df["Text"].map(clean)).str.strip()

    df = df[df["text"].str.len() > 0]
    df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    df = df[df["text"].str.split().str.len() >= 5]

    labels = []
    for _, row in df.iterrows():
        lbl = vote_label(
            row.get("HelpfulnessNumerator", 0),
            row.get("HelpfulnessDenominator", 0),
            args.min_votes, args.hi_thr, args.lo_thr
        )
        if lbl is None:
            if looks_creative(row["text"]):
                lbl = "creative"
            else:
                lbl = "unhelpful" if len(row["text"].split()) < 12 else "creative"
        labels.append(lbl)

    df = pd.DataFrame({"text": df["text"], "label": labels})

    parts = []
    for name, grp in df.groupby("label", sort=False):
        if len(grp) == 0:
            continue
        parts.append(grp.sample(frac=1.0, random_state=args.seed).head(args.max_per_class))

    if not parts:
        raise RuntimeError("No data after labeling. Check thresholds or input file.")

    df_bal = pd.concat(parts).sample(frac=1.0, random_state=args.seed).reset_index(drop=True)

    if args.val_ratio + args.test_ratio > 0:
        temp_size = args.val_ratio + args.test_ratio
        train, temp = train_test_split(
            df_bal,
            test_size=temp_size,
            random_state=args.seed,
            stratify=df_bal["label"]
        )
        if args.test_ratio > 0:
            val_size = args.val_ratio / temp_size
            valid, test = train_test_split(
                temp,
                test_size=(1 - val_size),
                random_state=args.seed,
                stratify=temp["label"]
            )
        else:
            valid, test = temp, pd.DataFrame(columns=["text", "label"])
    else:
        train, valid, test = df_bal, pd.DataFrame(columns=["text", "label"]), pd.DataFrame(columns=["text", "label"])

    # --- Save ---
    (out / "train.csv").write_text(train.to_csv(index=False, encoding="utf-8"), encoding="utf-8")
    (out / "valid.csv").write_text(valid.to_csv(index=False, encoding="utf-8"), encoding="utf-8")
    if args.test_ratio > 0:
        (out / "test.csv").write_text(test.to_csv(index=False, encoding="utf-8"), encoding="utf-8")

    # --- Report ---
    print(f"Saved: {len(train)} train, {len(valid)} valid, {len(test)} test -> {out}")
    print("Class counts (balanced set):")
    print(df_bal["label"].value_counts())

if __name__ == "__main__":
    main()

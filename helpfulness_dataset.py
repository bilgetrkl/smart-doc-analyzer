# helpfulness_dataset.py
import pandas as pd
import torch
from torch.utils.data import Dataset

class HelpfulnessDataset(Dataset):
    def __init__(self, csv_path, tokenizer, label_list=None, max_length=256):
        df = pd.read_csv(csv_path)
        if "text" not in df or "label" not in df:
            raise ValueError("CSV must have 'text' and 'label' columns")

        self.texts = df["text"].astype(str).tolist()
        labels_str = df["label"].astype(str).tolist()

        self.label_list = label_list or ["helpful", "creative", "unhelpful"]
        self.label2id = {l: i for i, l in enumerate(self.label_list)}
        self.id2label = {i: l for l, i in self.label2id.items()}

        try:
            self.labels = [self.label2id[l] for l in labels_str]
        except KeyError as e:
            raise ValueError(f"Unknown label in file: {e}. Allowed: {self.label_list}")

        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        x = self.tokenizer(
            self.texts[idx],
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )
        item = {k: v.squeeze(0) for k, v in x.items()}
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item

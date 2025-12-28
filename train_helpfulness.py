# train_helpfulness.py
import argparse, os
from transformers import (AutoTokenizer, AutoConfig, AutoModelForSequenceClassification,
                          Trainer, TrainingArguments)
from helpfulness_dataset import HelpfulnessDataset

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model_name_or_path", default="distilbert-base-uncased")
    p.add_argument("--train_file", required=True)
    p.add_argument("--valid_file", required=True)
    p.add_argument("--output_dir", required=True)
    p.add_argument("--epochs", type=int, default=2)
    p.add_argument("--batch_size", type=int, default=16)
    p.add_argument("--lr", type=float, default=2e-5)
    return p.parse_args()

def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    tok = AutoTokenizer.from_pretrained(args.model_name_or_path)

    label_list = ["helpful", "creative", "unhelpful"]

    train_ds = HelpfulnessDataset(args.train_file, tok, label_list=label_list)
    valid_ds = HelpfulnessDataset(args.valid_file, tok, label_list=label_list)

    num_labels = len(label_list)
    label2id = {l:i for i,l in enumerate(label_list)}
    id2label = {i:l for l,i in label2id.items()}

    cfg = AutoConfig.from_pretrained(
        args.model_name_or_path,
        num_labels=num_labels,
        label2id=label2id,
        id2label=id2label
    )
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name_or_path,
        config=cfg
    )

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        report_to=[],
        logging_steps=50,
    )

    def compute_metrics(eval_pred):
        from sklearn.metrics import accuracy_score, f1_score
        logits, labels = eval_pred
        preds = logits.argmax(axis=-1)
        return {
            "accuracy": accuracy_score(labels, preds),
            "f1_macro": f1_score(labels, preds, average="macro"),
        }

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=valid_ds,
        tokenizer=tok,
        compute_metrics=compute_metrics,
    )
    trainer.train()
    trainer.save_model(args.output_dir)
    tok.save_pretrained(args.output_dir)
    print("Saved:", args.output_dir)
    print("Labels:", id2label)

if __name__ == "__main__":
    main()

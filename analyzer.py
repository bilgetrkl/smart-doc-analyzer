import torch
from transformers import AutoTokenizer, AutoConfig
from tqdm import tqdm

from modeling import (
    BertForSentimentClassification,
    AlbertForSentimentClassification,
    DistilBertForSentimentClassification,
)
from utils import get_accuracy_from_logits


class Analyzer:
    def __init__(self, will_train, args):

        if args.model_name_or_path is None:
            if will_train:
                args.model_name_or_path = "bert-base-uncased"
            else:
                args.model_name_or_path = "barissayil/bert-sentiment-analysis-sst"

        self.config = AutoConfig.from_pretrained(args.model_name_or_path)

        if self.config.model_type == "bert":
            self.model = BertForSentimentClassification.from_pretrained(
                args.model_name_or_path
            )
        elif self.config.model_type == "albert":
            self.model = AlbertForSentimentClassification.from_pretrained(
                args.model_name_or_path
            )
        elif self.config.model_type == "distilbert":
            self.model = DistilBertForSentimentClassification.from_pretrained(
                args.model_name_or_path
            )
        else:
            raise ValueError("This transformer model is not supported yet.")

        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

        self.model = self.model.to(self.device)

        self.model.eval()

        self.tokenizer = AutoTokenizer.from_pretrained(args.model_name_or_path)

        self.output_dir = args.output_dir

    # Evaluates analyzer.
    def evaluate(self, val_loader, criterion):
        self.model.eval()
        batch_accuracy_summation, loss, num_batches = 0, 0, 0
        with torch.no_grad():
            for input_ids, attention_mask, labels in tqdm(
                val_loader, desc="Evaluating"
            ):
                input_ids, attention_mask, labels = (
                    input_ids.to(self.device),
                    attention_mask.to(self.device),
                    labels.to(self.device),
                )
                logits = self.model(input_ids=input_ids, attention_mask=attention_mask)
                batch_accuracy_summation += get_accuracy_from_logits(logits, labels)
                loss += criterion(logits.squeeze(-1), labels.float()).item()
                num_batches += 1
        accuracy = batch_accuracy_summation / num_batches
        return accuracy.item(), loss

    # Trains analyzer for one epoch.
    def train(self, train_loader, optimizer, criterion):
        self.model.train()
        for input_ids, attention_mask, labels in tqdm(
            iterable=train_loader, desc="Training"
        ):
            optimizer.zero_grad()
            input_ids, attention_mask, labels = (
                input_ids.to(self.device),
                attention_mask.to(self.device),
                labels.to(self.device),
            )
            logits = self.model(input_ids=input_ids, attention_mask=attention_mask)
            loss = criterion(input=logits.squeeze(-1), target=labels.float())
            loss.backward()
            optimizer.step()

    # Saves analyzer.
    def save(self):
        self.model.save_pretrained(save_directory=f"models/{self.output_dir}/")
        self.config.save_pretrained(save_directory=f"models/{self.output_dir}/")
        self.tokenizer.save_pretrained(save_directory=f"models/{self.output_dir}/")

    # Classifies sentiment as positve or negative.
    def classify_sentiment(self, text):
        with torch.no_grad():
            tokens = ["[CLS]"] + self.tokenizer.tokenize(text) + ["[SEP]"]
            input_ids = (
                torch.tensor(self.tokenizer.convert_tokens_to_ids(tokens))
                .unsqueeze(0)
                .to(self.device)
            )
            attention_mask = (input_ids != 0).long()
            positive_logit = self.model(
                input_ids=input_ids, attention_mask=attention_mask
            )
            positive_probability = torch.sigmoid(positive_logit.unsqueeze(-1)).item()
            positive_percentage = positive_probability * 100
            is_positive = positive_probability > 0.5
            if is_positive:
                return "Positive", int(positive_percentage)
            else:
                return "Negative", int(100 - positive_percentage)

import torch.nn as nn
from transformers import (
    BertPreTrainedModel,
    BertModel,
    AlbertPreTrainedModel,
    AlbertModel,
    DistilBertPreTrainedModel,
    DistilBertModel,
)


class BertForSentimentClassification(BertPreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        self.bert = BertModel(config)
        self.cls_layer = nn.Linear(config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
      
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls_reps = outputs.last_hidden_state[:, 0]
        logits = self.cls_layer(cls_reps)
        return logits


class AlbertForSentimentClassification(AlbertPreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        self.albert = AlbertModel(config)
        self.cls_layer = nn.Linear(config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        outputs = self.albert(input_ids=input_ids, attention_mask=attention_mask)
        cls_reps = outputs.last_hidden_state[:, 0]
        logits = self.cls_layer(cls_reps)
        return logits


class DistilBertForSentimentClassification(DistilBertPreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        self.distilbert = DistilBertModel(config)
        self.cls_layer = nn.Linear(config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        outputs = self.distilbert(input_ids=input_ids, attention_mask=attention_mask)
        cls_reps = outputs.last_hidden_state[:, 0]
        logits = self.cls_layer(cls_reps)
        return logits

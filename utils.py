import torch


def get_accuracy_from_logits(logits, labels):
    probabilties = torch.sigmoid(logits.unsqueeze(-1))
    predictions = (probabilties > 0.5).long().squeeze()
    return (predictions == labels).float().mean()

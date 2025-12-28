import torch.nn as nn
from torch.utils.data import DataLoader

from dataset import SSTDataset
from arguments import args
from analyzer import Analyzer


if __name__ == "__main__":

    analyzer = Analyzer(will_train=False, args=args)

    criterion = nn.BCEWithLogitsLoss()

    val_set = SSTDataset(
        filename="data/dev.tsv", maxlen=args.maxlen_val, tokenizer=analyzer.tokenizer
    )
    val_loader = DataLoader(
        dataset=val_set, batch_size=args.batch_size, num_workers=args.num_threads
    )

    val_accuracy, val_loss = analyzer.evaluate(
        val_loader=val_loader, criterion=criterion
    )

    print(f"Validation Accuracy : {val_accuracy}, Validation Loss : {val_loss}")

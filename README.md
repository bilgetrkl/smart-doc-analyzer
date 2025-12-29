📊 Smart Doc Analyzer

Sentiment Analysis + Helpfulness Classification

This project analyzes user input text in two stages:

Sentiment Analysis → positivity / negativity score

Helpfulness Classification → helpful, creative, or unhelpful

The sentiment model is pre-trained, and the helpfulness model is custom-developed and fine-tuned by us using an Amazon Reviews–based dataset.

📦 Models (Important)

⚠️ Model files are NOT included in this repository to keep the project lightweight.

Both models are hosted on Hugging Face and must be downloaded before running the backend.

1️⃣ Download Models from Hugging Face
Step 1: Create models/ folder
mkdir models
cd models

Step 2: Download the Helpfulness Model
git lfs install
git clone https://huggingface.co/silakdan/sentiment-analysis-tr

After this, your structure should look like:

models/
 └── helpfulness-distilbert/
     ├── config.json
     ├── pytorch_model.bin
     ├── tokenizer.json
     ├── vocab.txt
     └── tokenizer_config.json


💡 The project loads the model from this local path, not directly from Hugging Face at runtime.

2️⃣ Backend Setup (FastAPI)
Step 1: Create Virtual Environment
python -m venv env


Activate it:

Windows

env\Scripts\activate


macOS / Linux

source env/bin/activate

Step 2: Install Dependencies
pip install -r requirements.txt

Step 3: Run Backend Server
uvicorn app.main:app --reload


Backend will run at:

http://127.0.0.1:8000

Backend Functionality

Receives user text

Calculates sentiment score

Classifies text as: helpful, creative, unhelpful

Returns combined JSON response

3️⃣ Frontend Setup (React + Vite)
Step 1: Go to frontend folder
cd frontend

Step 2: Install dependencies
npm install

Step 3: Run frontend
npm run dev


Frontend will run at:

http://localhost:5173

🔁 Full Pipeline (How the System Works)

User enters text in the frontend

Text is sent to the backend API

Backend:

Runs sentiment analysis

Runs helpfulness classification

Results are returned and displayed to the user

🧠 About the Helpfulness Model

Base model: DistilBERT

Dataset: Amazon Reviews

Labels: helpful, creative, unhelpful

Labeling logic:

Helpfulness ratio = HelpfulnessNumerator / HelpfulnessDenominator

Threshold-based labeling

Additional heuristic rules for creativity detection

Model was fine-tuned, not used as-is

📁 Project Structure (Simplified)
SentimentAnalysis/
├── app/
│   ├── main.py
│   ├── sentiment_module/
│   └── qa_module/
├── frontend/
├── models/              # downloaded manually
├── requirements.txt
├── README.md

❗ Notes

Do NOT commit models/, env/, or large datasets to GitHub

Models are expected to be present locally before running the backend

Hugging Face login is only needed if you want to upload/update models

✅ Ready to Run

Once models are downloaded and dependencies installed:

Start backend

Start frontend

Enter text

Get sentiment + helpfulness result 

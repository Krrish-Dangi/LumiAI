import os
from dotenv import load_dotenv
load_dotenv()
os.environ["HF_KEY"] = os.getenv("HF_KEY")

from langchain_huggingface import HuggingFaceEmbeddings

# Using a lightweight model because Railway's free tier only has 500MB RAM.
# Qwen-0.6B requires ~1.5GB of RAM and will instantly crash the server (OOM Kill).
model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def get_embedding_model():
    return model
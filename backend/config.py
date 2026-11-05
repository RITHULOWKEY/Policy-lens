import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
POLICIES_DIR = DATA_DIR / "policies"
EVALUATION_DATASET_PATH = DATA_DIR / "evaluation_dataset.json"

# Database path - in serverless environments like Vercel, use /tmp
if os.getenv("VERCEL"):
    DB_PATH = Path("/tmp/policylens.db")
else:
    DB_PATH = BASE_DIR / "backend" / "policylens.db"

# RAG Settings
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.22"))
TOP_K_RETRIEVAL = int(os.getenv("TOP_K_RETRIEVAL", "3"))

# Optional API Keys
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY", "")

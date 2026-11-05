import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import init_db
from backend.api.routes import router as api_router, load_and_index_policies

app = FastAPI(
    title="PolicyLens AI Backend API",
    description="Grounded Insurance Policy Q&A RAG Assistant API Server",
    version="1.0.0"
)

# Enable CORS for frontend UI interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    load_and_index_policies()

# Initialize immediately for serverless environments (cold start)
try:
    init_db()
    load_and_index_policies()
except Exception as e:
    pass

app.include_router(api_router, prefix="/api")

@app.get("/")
@app.get("/api")
def root():
    return {
        "status": "online",
        "name": "PolicyLens AI Insurance Assistant API",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

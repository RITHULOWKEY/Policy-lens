import sqlite3
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table for storing user feedback (thumbs up / thumbs down)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            source TEXT,
            rating TEXT NOT NULL, -- 'helpful' or 'not_helpful'
            timestamp TEXT NOT NULL
        )
    """)
    
    # Table for storing evaluation run history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evaluation_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            total_questions INTEGER NOT NULL,
            grounded_count INTEGER NOT NULL,
            declined_count INTEGER NOT NULL,
            accuracy_score REAL NOT NULL,
            results_json TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()

def save_feedback(question: str, answer: str, source: str, rating: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        INSERT INTO feedback (question, answer, source, rating, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (question, answer, source, rating, timestamp))
    conn.commit()
    feedback_id = cursor.lastrowid
    conn.close()
    return {
        "id": feedback_id,
        "question": question,
        "answer": answer,
        "source": source,
        "rating": rating,
        "timestamp": timestamp
    }

def get_all_feedback() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM feedback ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_feedback_count() -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM feedback")
    count = cursor.fetchone()[0]
    conn.close()
    return count

def save_evaluation_run(total: int, grounded: int, declined: int, accuracy: float, details: List[Dict[str, Any]]):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO evaluation_runs (timestamp, total_questions, grounded_count, declined_count, accuracy_score, results_json)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (timestamp, total, grounded, declined, accuracy, json.dumps(details)))
    conn.commit()
    conn.close()

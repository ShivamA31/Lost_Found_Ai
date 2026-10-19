from fastapi import FastAPI, HTTPException, BackgroundTasks
from app.schemas import EmbedRequest, UpsertRequest, RemoveRequest, SearchRequest, SearchResult
from app.embedder import load_model, embed_text
from app.vector_store import store
import mysql.connector
import os
import json
import numpy as np
from pathlib import Path

def load_backend_environment():
    env_path = Path(__file__).resolve().parents[2] / "backend" / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

load_backend_environment()

app = FastAPI(title="CampusFind AI Service")

# Setup DB connection for rebuild
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "lost_and_found_ai")
    )

@app.on_event("startup")
async def startup_event():
    load_model()
    try:
        count = rebuild_index_from_db()
        print(f"Restored {count} embeddings into the AI search index.")
    except Exception as err:
        print(f"Could not restore the AI index from MySQL: {err}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/embed")
def embed(req: EmbedRequest):
    vec = embed_text(req.text)
    return {"embedding": vec.tolist()}

@app.post("/index/upsert")
def upsert_index(req: UpsertRequest):
    vec = embed_text(req.text)
    store.upsert(req.item_id, req.type, vec)
    return {"status": "success", "item_id": req.item_id, "embedding": vec.tolist()}

@app.post("/index/remove")
def remove_index(req: RemoveRequest):
    store.remove(req.item_id, req.type)
    return {"status": "success"}

@app.post("/search")
def search_index(req: SearchRequest):
    vec = embed_text(req.text)
    results = store.search(req.type_to_search, vec, req.top_k)
    return results

@app.post("/index/rebuild")
def rebuild_index():
    count = rebuild_index_from_db()
    return {"status": "success", "count": count}

def rebuild_index_from_db():
    store.clear()
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT e.item_id, e.embedding, i.type FROM item_embeddings e JOIN items i ON e.item_id = i.id WHERE i.status = 'ACTIVE'")
        rows = cursor.fetchall()
        for row in rows:
            vec = np.frombuffer(row['embedding'], dtype=np.float32)
            store.upsert(row['item_id'], row['type'], vec)
        cursor.close()
        return len(rows)
    finally:
        conn.close()

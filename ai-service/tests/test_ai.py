import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200

def test_embed():
    response = client.post("/embed", json={"text": "hello world"})
    assert response.status_code == 200
    data = response.json()
    assert "embedding" in data
    assert len(data["embedding"]) == 384

def test_search():
    client.post("/index/upsert", json={"item_id": 1, "type": "LOST", "text": "black laptop bag"})
    client.post("/index/upsert", json={"item_id": 2, "type": "FOUND", "text": "dark computer backpack"})
    client.post("/index/upsert", json={"item_id": 3, "type": "FOUND", "text": "blue water bottle"})
    
    # Search FOUND index for something similar to item 1
    response = client.post("/search", json={"text": "black laptop bag", "type_to_search": "FOUND", "top_k": 5})
    assert response.status_code == 200
    results = response.json()
    
    assert len(results) == 2
    # The dark computer backpack should score higher than the blue water bottle
    assert results[0]["item_id"] == 2
    assert results[1]["item_id"] == 3
    assert results[0]["semantic_score"] > results[1]["semantic_score"]

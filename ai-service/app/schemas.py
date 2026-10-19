from pydantic import BaseModel
from typing import List, Optional

class EmbedRequest(BaseModel):
    text: str

class UpsertRequest(BaseModel):
    item_id: int
    type: str # "LOST" or "FOUND"
    text: str

class RemoveRequest(BaseModel):
    item_id: int
    type: str

class SearchRequest(BaseModel):
    text: str
    type_to_search: str # "LOST" or "FOUND"
    top_k: int = 10

class SearchResult(BaseModel):
    item_id: int
    semantic_score: float

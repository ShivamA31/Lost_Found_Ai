import faiss
import numpy as np

DIMENSION = 384

class VectorStore:
    def __init__(self):
        # We need mapping from faiss id to item_id. 
        # IndexIDMap allows passing custom IDs to FAISS.
        self.index_lost = faiss.IndexIDMap(faiss.IndexFlatIP(DIMENSION))
        self.index_found = faiss.IndexIDMap(faiss.IndexFlatIP(DIMENSION))
    
    def _get_index(self, item_type: str):
        if item_type == "LOST":
            return self.index_lost
        elif item_type == "FOUND":
            return self.index_found
        raise ValueError("Invalid type")

    def upsert(self, item_id: int, item_type: str, embedding: np.ndarray):
        index = self._get_index(item_type)
        # Remove if exists
        try:
            index.remove_ids(np.array([item_id], dtype=np.int64))
        except:
            pass
        
        # Add new
        index.add_with_ids(
            np.array([embedding], dtype=np.float32), 
            np.array([item_id], dtype=np.int64)
        )
        
    def remove(self, item_id: int, item_type: str):
        index = self._get_index(item_type)
        index.remove_ids(np.array([item_id], dtype=np.int64))
        
    def search(self, item_type: str, embedding: np.ndarray, top_k: int = 10):
        index = self._get_index(item_type)
        if index.ntotal == 0:
            return []
            
        distances, indices = index.search(np.array([embedding], dtype=np.float32), top_k)
        
        results = []
        for i in range(len(indices[0])):
            idx = int(indices[0][i])
            if idx != -1: # -1 means no result found
                score = float(distances[0][i])
                # Clamp score 0-1
                score = max(0.0, min(1.0, score))
                results.append({"item_id": idx, "semantic_score": score})
                
        return results
        
    def clear(self):
        self.index_lost.reset()
        self.index_found.reset()

store = VectorStore()

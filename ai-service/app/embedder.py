from sentence_transformers import SentenceTransformer
import numpy as np

# Load model once at startup
MODEL_NAME = 'all-MiniLM-L6-v2'
model = None

def load_model():
    global model
    if model is None:
        print(f"Loading embedding model: {MODEL_NAME}")
        model = SentenceTransformer(MODEL_NAME)
        print("Model loaded.")

def embed_text(text: str) -> np.ndarray:
    if model is None:
        load_model()
    # Clean text
    text = text.lower().strip()
    # Output shape: (384,)
    embedding = model.encode(text)
    # L2 normalize
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding.astype('float32')

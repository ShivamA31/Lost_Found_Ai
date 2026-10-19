# Matching Algorithm

The matching algorithm uses a hybrid approach to combine semantic text similarity with hard metadata rules.

### Process
1. A new item is embedded using `sentence-transformers` (`all-MiniLM-L6-v2`) in the AI Service.
2. We query the FAISS index (using inner product, which equals cosine similarity since vectors are normalized) for the top 10 candidates of the opposite type.
3. For each candidate, we compute a final score.

### Score Components
- **Semantic Similarity (60%)**: Directly from FAISS cosine similarity.
- **Category (15%)**: 1.0 if identical, otherwise 0.
- **Location (10%)**: Uses Haversine distance if coordinates exist (1.0 if ≤50m, decays to 0 at 1km). Falls back to exact ID match.
- **Date (10%)**: The found date must be on or after the lost date (1 day grace period). Uses an exponential decay `exp(-days / 7)`.
- **Color (5%)**: Extracted from text. 1.0 if identical, 0.5 if unknown, 0 if different.

### Threshold
Candidates with a final score ≥ 55% (`0.55`) are saved as "Potential Matches".

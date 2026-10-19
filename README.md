# AI-Powered Campus Lost & Found System

## 60-Second Explanation
Traditional systems rely on keyword filters, making it hard to find items if descriptions slightly differ (e.g., "laptop bag" vs. "computer backpack"). This system converts each description to an **embedding** (a mathematical vector representing meaning), searches opposite-type reports using **FAISS** (vector search), and re-ranks the results using a hybrid algorithm (category, location distance, date gap, and color). It shows the user *why* it matched and requires a verified claim (answering a private hint) before releasing the item.

## Setup Instructions

### 1. Database (MySQL)
Ensure MySQL is running, then configure `backend/.env` with your MySQL credentials if they differ from the defaults. From the `backend` directory, install dependencies and initialize the database:
```bash
cd backend
npm install
npm run db:seed
npm run db:demo-items
```
The backend defaults to MySQL at `localhost` as `root` with an empty password. The seed command creates the schema and demo accounts using the same credentials as the backend.

*Demo logins (all use `password123`):*
- Admin: `admin@campus.edu`
- Students: `alice@campus.edu`, `bob@campus.edu`, `charlie@campus.edu`, `diana@campus.edu`, `evan@campus.edu`

The first command creates the schema and demo accounts on a fresh database; the second adds 40 lost and 40 found example reports, creates their AI embeddings, and builds potential matches. The demo-item command reuses its existing reports when run again. The login page has one-click student and admin demo login buttons. Demo users are created by `database/seed.sql`; registration creates student accounts only.

### 2. Backend (Node.js / Express)
```bash
cd backend
npm install
npm run dev
```

### 3. AI Service (Python / FastAPI)
```bash
cd ai-service
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
*(The embedding model `all-MiniLM-L6-v2` will be downloaded automatically on first startup).*

### 4. Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## Interview Cheat-Sheet

**Q: What is an embedding?**
A: It's a numerical array (vector) that captures the semantic meaning of text. Words with similar meanings will have vectors closer together in multidimensional space.

**Q: Why cosine similarity?**
A: It measures the angle between two vectors, focusing on their direction rather than magnitude, which is highly effective for semantic text matching.

**Q: Why FAISS and why IndexFlatIP?**
A: FAISS is a library for efficient similarity search. `IndexFlatIP` calculates Inner Product. Because our vectors are L2-normalized, the inner product is mathematically identical to cosine similarity, giving us exact nearest neighbors very fast.

**Q: Why a separate Python service?**
A: Most robust Machine Learning libraries (like `sentence-transformers` and `faiss`) are Python-native. Express handles the web/DB logic, and Python acts as a microservice just for ML tasks.

**Q: Why hybrid scoring instead of only embeddings?**
A: Semantics aren't enough. "Lost a red umbrella today" and "Found a red umbrella last year" have identical semantics but are physically impossible to be the same item. Hard constraints (date, location) must be factored in.

**Q: How do you avoid false matches?**
A: We use a multi-factor threshold, exclude items already claimed, never match user's own items, and have a final human-in-the-loop claim step with a private verification hint.

**Q: How would it scale?**
A: 
- Change `IndexFlatIP` to an approximate nearest neighbor index like `IndexIVFFlat`.
- Move match generation to an asynchronous background worker queue (e.g. RabbitMQ/Redis).

**Q: Known limitations and future work?**
- Currently text-only embeddings. Future work: use CLIP (Contrastive Language-Image Pretraining) to embed the uploaded photos directly so we can match a photo to a description automatically.
- Implement real email/push notifications.

# Architecture

## Overview
- **Frontend**: React (Vite) + Tailwind CSS, interacting with Backend via Axios.
- **Backend**: Node.js + Express + MySQL handling CRUD and orchestrating matches.
- **AI Service**: Python + FastAPI hosting `all-MiniLM-L6-v2` with a FAISS vector index.

```mermaid
flowchart TD
    A[React Frontend] <-->|REST API| B[Express Backend]
    B <-->|MySQL driver| C[(MySQL DB)]
    B <-->|HTTP POST| D[FastAPI AI Service]
    D <--> E[FAISS Vector Store]
```

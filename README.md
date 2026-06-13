# Remember This.

A minimal full-stack personal memory logger. It stores your raw memories directly, embeds them using local embedding models, and enables instant semantic vector search with distance similarity thresholding.

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLModel, SQLite, ChromaDB, Ollama, Uvicorn
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, TanStack Query, React Router v6

---

## Features & Architecture

1. **Direct Memory Logging**:
   - Stores raw inputs exactly as written (no automated LLM summarization).
   - Core DB Schema (`Entry` model): `id`, `raw_input`, `created_at`.
2. **Semantic Search & Vector Storage**:
   - Generates 768-dimension embeddings for raw inputs via Ollama using the `nomic-embed-text` model.
   - Saves vector records in a local `chroma_db/` collection.
   - Filters search queries by vector similarity using an L2 distance cutoff threshold of `450.0` (scores $< 450.0$ are returned, while unrelated results are filtered out).
3. **Memories**: Grid layout showcasing raw memory text, live search results, and a confirmation modal for inline card deletion.

---

## Dev Setup

### 1. Prerequisites
Install **Ollama** from [ollama.com](https://ollama.com) and pull the embedding model:
```bash
ollama pull nomic-embed-text
```

### 2. Backend Setup
Navigate to the `backend` directory, install Python dependencies, configure the environment, and start the FastAPI dev server:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run the dev server
uvicorn main:app --reload
```
The API will run locally at [http://localhost:8000](http://localhost:8000).

### 3. Database Recovery & Syncing
If your SQLite database and vector store get out of sync, run the restore script to reconcile SQLite records with ChromaDB embeddings:
```bash
cd backend
python scripts/restore_db_and_sync.py
```

### 4. Frontend Setup
Navigate to the `frontend` directory, install packages, and spin up the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The client app will launch at [http://localhost:5173](http://localhost:5173).

---

## API Endpoints

Base path: `/api/v1`

- `POST /memories`: accepts `{ "message": "..." }` and returns `{ id, raw_input, created_at }`.
- `GET /memories`: returns all memories (or filters using `?search=...`).
- `DELETE /memories/{id}`: deletes the memory from both SQLite and ChromaDB.

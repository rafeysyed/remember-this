# Career Memory Logger

Career Memory Logger is a full-stack personal career logging app. It stores structured career memories today and leaves clean extension points for future AI/RAG features.

## Tech Stack

- Backend: Python, FastAPI, SQLModel, SQLite, python-dotenv, Ollama
- Frontend: React 18, Vite, Tailwind CSS, shadcn/ui-style primitives, React Router v6, TanStack Query

## Dev Setup

```bash
# Prerequisites - install Ollama from https://ollama.com then pull your models
ollama pull mistral
ollama pull nomic-embed-text

# Backend
cd backend
cp .env.example .env   # optionally change OLLAMA_MODEL or OLLAMA_EMBED_MODEL
pip install -r requirements.txt
uvicorn main:app --reload
```

```bash
# Run once to remove Phase 1/2 memories that were never embedded
cd backend
python scripts/clean_unembedded.py

# No other setup changes needed for this phase
```

```bash
# Frontend
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_API_URL` and falls back to `http://localhost:8000`.

## API

Base path: `/api/v1`

- `POST /memories` accepts `{ "message": "..." }` and returns `{ id, summary, created_at }`
- `GET /memories` returns memory summaries sorted newest first
- `DELETE /memories/{id}` deletes a memory

`GET /memories` accepts `search`, `type`, `skills`, `date_from`, and `date_to` for composable filtering.

## Semantic Search

New memories are embedded with `nomic-embed-text` through Ollama and stored in a local ChromaDB directory at `backend/chroma_db/`. ChromaDB creates this directory automatically on first run.

## Extension Points

- `backend/services/extractor.py` is the only file that calls Ollama for chat extraction.
- `backend/services/embedder.py` is the only file that calls ChromaDB or creates embeddings.
- Stored rows keep the full extracted record, while the UI only displays summary and creation time.

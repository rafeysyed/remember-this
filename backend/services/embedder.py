import os

# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
import ollama
from dotenv import load_dotenv


load_dotenv()
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="memories")


def embed_text(text: str) -> list[float]:
    response = ollama.embeddings(model=EMBED_MODEL, prompt=text)
    return response["embedding"]


def add_to_vector_store(memory_id: int, text: str) -> str:
    """Embed text and store in ChromaDB. Returns the ChromaDB document ID."""
    embedding = embed_text(text)
    chroma_id = str(memory_id)
    collection.add(ids=[chroma_id], embeddings=[embedding], documents=[text])
    return chroma_id


def search_vector_store(
    query: str,
    n_results: int | None = 10,
    distance_threshold: float = 800.0,
) -> list[str]:
    """Returns a list of ChromaDB IDs ranked by similarity and filtered by distance threshold."""
    total_documents = collection.count()
    if total_documents == 0:
        return []

    result_count = total_documents if n_results is None else min(n_results, total_documents)
    embedding = embed_text(query)
    results = collection.query(query_embeddings=[embedding], n_results=result_count)
    
    ids = results["ids"][0]
    distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(ids)
    
    filtered_ids = [id_ for id_, dist in zip(ids, distances) if dist <= distance_threshold]
    return filtered_ids



def delete_from_vector_store(memory_id: int) -> None:
    collection.delete(ids=[str(memory_id)])

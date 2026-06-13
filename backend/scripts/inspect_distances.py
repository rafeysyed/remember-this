import os
import chromadb
import ollama

def main():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chroma_path = os.path.join(backend_dir, "chroma_db")
    
    client = chromadb.PersistentClient(path=chroma_path)
    collection = client.get_or_create_collection(name="memories")
    
    # Add temporary test documents
    doc1 = "I just learned how to build FastAPI apps and connect them to SQLite."
    doc2 = "Today I walked in the park and watched the ducks."
    
    emb1 = ollama.embeddings(model="nomic-embed-text", prompt=doc1)["embedding"]
    emb2 = ollama.embeddings(model="nomic-embed-text", prompt=doc2)["embedding"]
    
    collection.add(ids=["temp_1", "temp_2"], embeddings=[emb1, emb2], documents=[doc1, doc2])
    
    queries = [
        "FastAPI", 
        "ducks", 
        "walked in park", 
        "unrelated nonsense words", 
        "nuclear reactor details"
    ]
    
    try:
        for q in queries:
            q_emb = ollama.embeddings(model="nomic-embed-text", prompt=q)["embedding"]
            res = collection.query(query_embeddings=[q_emb], n_results=2)
            print(f"\nQuery: '{q}'")
            for doc_id, doc, dist in zip(res["ids"][0], res["documents"][0], res["distances"][0]):
                print(f"  - Document: '{doc}' -> Distance: {dist:.4f}")
    finally:
        # Clean up
        collection.delete(ids=["temp_1", "temp_2"])

if __name__ == "__main__":
    main()

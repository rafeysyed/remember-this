import os
import shutil

def main():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Files/directories to remove
    db_paths = [
        os.path.join(backend_dir, "remember_this.db"),
        os.path.join(backend_dir, "career_memories.db"),
    ]
    chroma_dir = os.path.join(backend_dir, "chroma_db")
    
    print("Flushing old memories and databases...")
    
    for path in db_paths:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"Removed database file: {path}")
            except Exception as e:
                print(f"Error removing {path}: {e}")
                
    if os.path.exists(chroma_dir):
        try:
            shutil.rmtree(chroma_dir)
            print(f"Removed ChromaDB directory: {chroma_dir}")
        except Exception as e:
            print(f"Error removing ChromaDB directory: {e}")
            
    print("Database flush complete.")

if __name__ == "__main__":
    main()

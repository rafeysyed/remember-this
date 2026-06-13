import os
import shutil
from datetime import datetime

# Set PYTHONPATH environment programmatically to import local modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def restore():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. Delete existing database and chroma files FIRST, before any imports that open connection handles
    db_paths = [
        os.path.join(backend_dir, "remember_this.db"),
        os.path.join(backend_dir, "career_memories.db")
    ]
    chroma_dir = os.path.join(backend_dir, "chroma_db")
    
    print("Wiping old databases for clean sync...")
    for path in db_paths:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"Deleted SQLite: {path}")
            except Exception as e:
                print(f"Error deleting SQLite {path}: {e}")
    if os.path.exists(chroma_dir):
        try:
            shutil.rmtree(chroma_dir)
            print(f"Deleted ChromaDB: {chroma_dir}")
        except Exception as e:
            print(f"Error deleting ChromaDB: {e}")
        
    # 2. NOW import database and embedder modules so they establish fresh connections to the clean directory
    from database import engine, create_db_and_tables
    from models import Entry
    from services.embedder import add_to_vector_store
    from sqlmodel import Session
    
    print("\nRe-creating database tables...")
    create_db_and_tables()
    
    # 3. Add memories in sync
    memories = [
        "We finally moved into the new apartment today. Took weeks of packing but it feels like a fresh start.",
        "My sister got engaged today. The whole family found out together and it was a genuinely joyful moment.",
        "Had a health scare this week. Tests came back fine but it shook me more than I expected.",
        "Had a long phone call with my mom today. We don't talk enough and this reminded me why I should call more.",
        "Parents are getting older and I'm starting to feel that shift where I worry about them more than they worry about me.",
        "I bought my first ever gaming console (PS5) today.",
        "I gifted my dad a smartphone today. it was a samsung A17 for INR 22k."
    ]
    
    print("\nAdding memories in sync to SQLite & ChromaDB...")
    with Session(engine) as session:
        for text in memories:
            entry = Entry(
                created_at=datetime.utcnow(),
                raw_input=text,
                embedding_id=None
            )
            session.add(entry)
            session.commit()
            session.refresh(entry)
            
            # Embed and add to ChromaDB with matching ID
            chroma_id = add_to_vector_store(entry.id, entry.raw_input)
            entry.embedding_id = chroma_id
            session.add(entry)
            session.commit()
            print(f"Successfully added & synced ID {entry.id}: '{text[:40]}...'")
            
    print("\nDatabase restoration and sync complete!")

if __name__ == "__main__":
    restore()

from pathlib import Path
import sys

from sqlmodel import Session, select


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import engine  # noqa: E402
from models import MemoryEntry  # noqa: E402


def main() -> None:
    with Session(engine) as session:
        memories = session.exec(select(MemoryEntry).where(MemoryEntry.embedding_id.is_(None))).all()
        deleted_count = len(memories)

        for memory in memories:
            session.delete(memory)

        session.commit()

    print(f"Deleted {deleted_count} memories with null embedding_id.")


if __name__ == "__main__":
    main()

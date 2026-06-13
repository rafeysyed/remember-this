from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlmodel import Session, desc, select

from database import get_session
from models import Entry, MemoryCreateRequest, MemoryListResponse, MemorySummaryResponse
from services.embedder import add_to_vector_store, delete_from_vector_store, search_vector_store


router = APIRouter(prefix="/memories", tags=["memories"])


@router.post("", response_model=MemorySummaryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    payload: MemoryCreateRequest,
    session: Session = Depends(get_session),
) -> MemorySummaryResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is required.")

    entry = Entry(
        created_at=datetime.utcnow(),
        raw_input=message,
        embedding_id=None,
    )

    session.add(entry)
    session.commit()
    session.refresh(entry)

    chroma_id = add_to_vector_store(entry.id, entry.raw_input)
    entry.embedding_id = chroma_id
    session.add(entry)
    session.commit()
    session.refresh(entry)

    return MemorySummaryResponse(id=entry.id, raw_input=entry.raw_input, created_at=entry.created_at)


@router.get("", response_model=MemoryListResponse)
def list_memories(
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=50),
    session: Session = Depends(get_session),
) -> MemoryListResponse:
    offset = (page - 1) * page_size
    search_text = search.strip() if search else ""

    if search_text:
        chroma_ids = search_vector_store(search_text, n_results=None)
        memory_ids = [int(chroma_id) for chroma_id in chroma_ids if chroma_id.isdigit()]
        if not memory_ids:
            return MemoryListResponse(items=[], total=0, page=page, page_size=page_size, total_pages=0)

        query = select(Entry).where(Entry.id.in_(memory_ids))
        memories_by_id = {memory.id: memory for memory in session.exec(query).all()}
        ordered_memories = [memories_by_id[memory_id] for memory_id in memory_ids if memory_id in memories_by_id]
        total = len(ordered_memories)
        memories = ordered_memories[offset : offset + page_size]
    else:
        query = select(Entry)
        count_query = select(func.count(Entry.id))
        total = session.exec(count_query).one()
        memories = session.exec(query.order_by(desc(Entry.created_at)).offset(offset).limit(page_size)).all()

    total_pages = (total + page_size - 1) // page_size if total else 0
    return MemoryListResponse(
        items=[
            MemorySummaryResponse(id=memory.id, raw_input=memory.raw_input, created_at=memory.created_at)
            for memory in memories
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: int, session: Session = Depends(get_session)) -> None:
    memory = session.get(Entry, memory_id)
    if memory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found.")

    session.delete(memory)
    session.commit()
    delete_from_vector_store(memory_id)

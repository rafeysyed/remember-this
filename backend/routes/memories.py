from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlmodel import Session, desc, select

from database import get_session
from models import MemoryCreateRequest, MemoryDetailResponse, MemoryEntry, MemoryListResponse, MemorySummaryResponse
from services.embedder import add_to_vector_store, delete_from_vector_store, search_vector_store
from services.extractor import extract_memory


router = APIRouter(prefix="/memories", tags=["memories"])


def normalize_extracted_text(value: object, fallback: str = "") -> str:
    if value is None:
        return fallback
    return str(value).strip() or fallback


@router.post("", response_model=MemorySummaryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    payload: MemoryCreateRequest,
    session: Session = Depends(get_session),
) -> MemorySummaryResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is required.")

    try:
        extracted = extract_memory(message)
        entry = MemoryEntry(
            created_at=datetime.utcnow(),
            date_of_event=date.fromisoformat(extracted["date_of_event"]),
            type=normalize_extracted_text(extracted["type"], "other"),
            title=normalize_extracted_text(extracted["title"], "Untitled memory"),
            description=normalize_extracted_text(extracted["description"]),
            skills=normalize_extracted_text(extracted.get("skills")),
            impact=normalize_extracted_text(extracted.get("impact")) or None,
            organization=normalize_extracted_text(extracted.get("organization")) or None,
            raw_input=message,
            summary=normalize_extracted_text(extracted["summary"], message),
            embedding_id=None,
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not parse the memory extraction response.",
        ) from exc

    session.add(entry)
    session.commit()
    session.refresh(entry)

    embed_text = f"{entry.summary}. {entry.description}. Skills: {entry.skills}"
    chroma_id = add_to_vector_store(entry.id, embed_text)
    entry.embedding_id = chroma_id
    session.add(entry)
    session.commit()
    session.refresh(entry)

    return MemorySummaryResponse(id=entry.id, summary=entry.summary, created_at=entry.created_at)


@router.get("", response_model=MemoryListResponse)
def list_memories(
    search: str | None = Query(default=None),
    type: str | None = Query(default=None),
    skills: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=50),
    session: Session = Depends(get_session),
) -> MemoryListResponse:
    offset = (page - 1) * page_size
    search_text = search.strip() if search else ""
    skill_filters = [skill.strip() for skill in skills.split(",")] if skills else []
    skill_filters = [skill for skill in skill_filters if skill]

    if search_text:
        chroma_ids = search_vector_store(search_text, n_results=None)
        memory_ids = [int(chroma_id) for chroma_id in chroma_ids if chroma_id.isdigit()]
        if not memory_ids:
            return MemoryListResponse(items=[], total=0, page=page, page_size=page_size, total_pages=0)

        query = select(MemoryEntry).where(MemoryEntry.id.in_(memory_ids))
        if type:
            query = query.where(MemoryEntry.type == type)
        for skill in skill_filters:
            query = query.where(MemoryEntry.skills.like(f"%{skill}%"))
        if date_from:
            query = query.where(MemoryEntry.date_of_event >= date_from)
        if date_to:
            query = query.where(MemoryEntry.date_of_event <= date_to)

        memories_by_id = {memory.id: memory for memory in session.exec(query).all()}
        ordered_memories = [memories_by_id[memory_id] for memory_id in memory_ids if memory_id in memories_by_id]
        total = len(ordered_memories)
        memories = ordered_memories[offset : offset + page_size]
    else:
        query = select(MemoryEntry)
        count_query = select(func.count(MemoryEntry.id))
        if type:
            query = query.where(MemoryEntry.type == type)
            count_query = count_query.where(MemoryEntry.type == type)
        for skill in skill_filters:
            query = query.where(MemoryEntry.skills.like(f"%{skill}%"))
            count_query = count_query.where(MemoryEntry.skills.like(f"%{skill}%"))
        if date_from:
            query = query.where(MemoryEntry.date_of_event >= date_from)
            count_query = count_query.where(MemoryEntry.date_of_event >= date_from)
        if date_to:
            query = query.where(MemoryEntry.date_of_event <= date_to)
            count_query = count_query.where(MemoryEntry.date_of_event <= date_to)

        total = session.exec(count_query).one()
        memories = session.exec(query.order_by(desc(MemoryEntry.created_at)).offset(offset).limit(page_size)).all()

    total_pages = (total + page_size - 1) // page_size if total else 0
    return MemoryListResponse(
        items=[
            MemorySummaryResponse(id=memory.id, summary=memory.summary, created_at=memory.created_at)
            for memory in memories
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{memory_id}", response_model=MemoryDetailResponse)
def get_memory(memory_id: int, session: Session = Depends(get_session)) -> MemoryDetailResponse:
    memory = session.get(MemoryEntry, memory_id)
    if memory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found.")

    return MemoryDetailResponse(
        id=memory.id,
        summary=memory.summary,
        created_at=memory.created_at,
        date_of_event=memory.date_of_event,
        type=memory.type,
        title=memory.title,
        description=memory.description,
        skills=memory.skills,
        impact=memory.impact,
        organization=memory.organization,
        raw_input=memory.raw_input,
        embedding_id=memory.embedding_id,
    )


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: int, session: Session = Depends(get_session)) -> None:
    memory = session.get(MemoryEntry, memory_id)
    if memory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found.")

    session.delete(memory)
    session.commit()
    delete_from_vector_store(memory_id)

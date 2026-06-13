from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class MemoryEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime
    date_of_event: date
    type: str
    title: str
    description: str
    skills: str
    impact: Optional[str] = None
    organization: Optional[str] = None
    raw_input: str
    summary: str
    embedding_id: Optional[str] = None


class MemoryCreateRequest(SQLModel):
    message: str


class MemorySummaryResponse(SQLModel):
    id: int
    summary: str
    created_at: datetime


class MemoryListResponse(SQLModel):
    items: list[MemorySummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class MemoryDetailResponse(MemorySummaryResponse):
    date_of_event: date
    type: str
    title: str
    description: str
    skills: str
    impact: Optional[str] = None
    organization: Optional[str] = None
    raw_input: str
    embedding_id: Optional[str] = None

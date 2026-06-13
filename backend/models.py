from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Entry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime
    raw_input: str
    embedding_id: Optional[str] = None


class MemoryCreateRequest(SQLModel):
    message: str


class MemorySummaryResponse(SQLModel):
    id: int
    raw_input: str
    created_at: datetime


class MemoryListResponse(SQLModel):
    items: list[MemorySummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

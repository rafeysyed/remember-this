import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Search, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteMemory, getMemory } from "../api/memories";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const PAGE_SIZE = 8;
const TYPE_OPTIONS = [
  { label: "Project", value: "project" },
  { label: "Certification", value: "certification" },
  { label: "Promotion", value: "promotion" },
  { label: "Skill", value: "skill" },
  { label: "Problem Solved", value: "problem_solved" },
  { label: "Other", value: "other" },
];

async function fetchMemories({ search, activeType, page }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(PAGE_SIZE));
  if (search) params.set("search", search);
  if (activeType) params.set("type", activeType);

  const response = await fetch(`${API_BASE_URL}/api/v1/memories?${params.toString()}`);
  if (!response.ok) {
    let message = "Something went wrong.";
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the generic fallback for non-JSON error responses.
    }
    throw new Error(message);
  }

  return response.json();
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatType(value) {
  return value.replaceAll("_", " ");
}

function splitSkills(value = "") {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export default function MemoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedMemoryId, setSelectedMemoryId] = useState(null);
  const pageScrollRef = useRef(null);
  const shouldKeepPaginationVisibleRef = useRef(false);
  const touchStartYRef = useRef(0);
  const activeTypeLabel = TYPE_OPTIONS.find((option) => option.value === activeType)?.label;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeType]);

  const {
    data: memoryPage = { items: [], total: 0, page: 1, page_size: PAGE_SIZE, total_pages: 0 },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["memories", debouncedSearch, activeType, page],
    queryFn: () =>
      fetchMemories({
        search: debouncedSearch,
        activeType,
        page,
      }),
  });
  const memories = memoryPage.items;
  const canGoPrevious = page > 1;
  const canGoNext = page < memoryPage.total_pages;

  useEffect(() => {
    if (isLoading || !shouldKeepPaginationVisibleRef.current) return;

    shouldKeepPaginationVisibleRef.current = false;
    window.requestAnimationFrame(() => {
      const scrollContainer = pageScrollRef.current;
      if (!scrollContainer) return;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    });
  }, [isLoading, memoryPage.page]);

  const {
    data: selectedMemory,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
  } = useQuery({
    queryKey: ["memory", selectedMemoryId],
    queryFn: () => getMemory(selectedMemoryId),
    enabled: selectedMemoryId !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      setSelectedMemoryId(null);
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });

  useEffect(() => {
    if (selectedMemoryId === null) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [selectedMemoryId]);

  const isAtScrollBoundary = (element, deltaY) => {
    if (element.scrollHeight <= element.clientHeight) {
      return true;
    }

    const atTop = element.scrollTop <= 0;
    const atBottom = Math.ceil(element.scrollTop + element.clientHeight) >= element.scrollHeight;

    return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
  };

  const handleDetailWheel = (event) => {
    event.stopPropagation();
    if (isAtScrollBoundary(event.currentTarget, event.deltaY)) {
      event.preventDefault();
    }
  };

  const handleDetailTouchStart = (event) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? 0;
  };

  const handleDetailTouchMove = (event) => {
    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
    const deltaY = touchStartYRef.current - currentY;

    event.stopPropagation();
    if (isAtScrollBoundary(event.currentTarget, deltaY)) {
      event.preventDefault();
    }
  };

  const filterSummarySegments = [];
  if (debouncedSearch) filterSummarySegments.push(`Showing results for "${debouncedSearch}"`);
  if (activeTypeLabel) filterSummarySegments.push(`Type: ${activeTypeLabel}`);

  return (
    <main ref={pageScrollRef} className="h-full overflow-y-auto px-6 py-12 sm:px-10">
      <section className="mx-auto w-full max-w-[640px]">
        <div className="mb-6">
          <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search memories..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => {
              const isActive = activeType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveType(isActive ? null : option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {filterSummarySegments.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">{filterSummarySegments.join(" · ")}</p>
          ) : null}
        </div>

        {isLoading ? (
          <div className="columns-1 gap-4 sm:columns-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="mb-4 break-inside-avoid rounded-2xl border bg-white p-4">
                <Skeleton className="mb-4 h-5 w-11/12" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : null}

        {isError ? <p className="text-sm text-destructive">{error.message}</p> : null}

        {!isLoading && !isError && memories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No memories yet.{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/">
              Start by logging something.
            </Link>
          </p>
        ) : null}

        {!isLoading && !isError && memories.length > 0 ? (
          <div>
            <div className="columns-1 gap-4 sm:columns-2">
              {memories.map((memory) => (
                <button
                  key={memory.id}
                  type="button"
                  onClick={() => setSelectedMemoryId(memory.id)}
                  className="mb-4 block w-full break-inside-avoid rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div>
                    <p className="text-sm leading-6 text-foreground">{memory.summary}</p>
                    <time className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(memory.created_at)}
                    </time>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl px-0"
                onClick={() => {
                  shouldKeepPaginationVisibleRef.current = true;
                  setPage((currentPage) => Math.max(1, currentPage - 1));
                }}
                disabled={!canGoPrevious || isLoading}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                {memoryPage.page} / {memoryPage.total_pages}
              </p>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl px-0"
                onClick={() => {
                  shouldKeepPaginationVisibleRef.current = true;
                  setPage((currentPage) => currentPage + 1);
                }}
                disabled={!canGoNext || isLoading}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {selectedMemoryId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4 py-8 backdrop-blur-sm"
          onClick={() => setSelectedMemoryId(null)}
        >
          <article
            className="scrollbar-hidden overscroll-still max-h-[82vh] w-full max-w-xl overflow-y-auto rounded-3xl border bg-white p-5 shadow-2xl sm:p-6"
            style={{ animation: "memory-card-open 180ms ease-out" }}
            onClick={(event) => event.stopPropagation()}
            onWheel={handleDetailWheel}
            onTouchStart={handleDetailTouchStart}
            onTouchMove={handleDetailTouchMove}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Memory detail
                </p>
                {selectedMemory ? (
                  <h2 className="text-2xl font-semibold leading-tight">{selectedMemory.title}</h2>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemoryId(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close memory detail"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : null}

            {isDetailError ? <p className="text-sm text-destructive">{detailError.message}</p> : null}

            {selectedMemory ? (
              <div className="space-y-6">
                <p className="text-base leading-7">{selectedMemory.summary}</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Created" value={formatDate(selectedMemory.created_at)} />
                  <DetailItem label="Event date" value={formatDate(selectedMemory.date_of_event)} />
                  <DetailItem label="Type" value={formatType(selectedMemory.type)} />
                  <DetailItem label="Organization" value={selectedMemory.organization || "Not specified"} />
                </div>

                <DetailSection label="Description">{selectedMemory.description}</DetailSection>

                {splitSkills(selectedMemory.skills).length > 0 ? (
                  <div>
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {splitSkills(selectedMemory.skills).map((skill) => (
                        <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <DetailSection label="Impact">
                  {selectedMemory.impact || "No specific impact was captured."}
                </DetailSection>

                <DetailSection label="Original input">{selectedMemory.raw_input}</DetailSection>

                <div className="flex justify-end border-t pt-5">
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => deleteMutation.mutate(selectedMemory.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
    </main>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm capitalize">{value}</p>
    </div>
  );
}

function DetailSection({ label, children }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-6">{children}</p>
    </section>
  );
}

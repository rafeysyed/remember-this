import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteMemory, getMemories } from "../api/memories";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const PAGE_SIZE = 8;

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function MemoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [memoryToDelete, setMemoryToDelete] = useState(null);
  const pageScrollRef = useRef(null);
  const shouldKeepPaginationVisibleRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: memoryPage = { items: [], total: 0, page: 1, page_size: PAGE_SIZE, total_pages: 0 },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["memories", debouncedSearch, page],
    queryFn: () =>
      getMemories({
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
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

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      setMemoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });

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
                <div
                  key={memory.id}
                  className="group relative mb-4 block w-full break-inside-avoid rounded-2xl border bg-white p-4 shadow-sm transition hover:border-primary/20 hover:shadow-md"
                >
                  <p className="text-sm leading-6 text-foreground whitespace-pre-wrap">{memory.raw_input}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <time className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(memory.created_at)}
                    </time>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 rounded-xl p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-opacity"
                      onClick={() => setMemoryToDelete(memory)}
                      aria-label="Delete memory"
                      title="Delete memory"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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

      {memoryToDelete !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4 py-8 backdrop-blur-sm"
          onClick={() => setMemoryToDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border bg-white p-6 shadow-2xl"
            style={{ animation: "memory-card-open 180ms ease-out" }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold text-foreground font-serif">Delete Memory?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Are you sure you want to delete this memory? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                className="rounded-xl px-4"
                onClick={() => setMemoryToDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl px-4 flex items-center gap-2"
                onClick={() => {
                  deleteMutation.mutate(memoryToDelete.id);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

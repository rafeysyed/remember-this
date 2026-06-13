import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { createMemory } from "../api/memories";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

const HEADINGS = [
  "What happened today?",
  "What's on your mind?",
  "How are you?",
  "Log a memory.",
  "Something to remember.",
  "Write it down.",
  "Tell me something.",
  "Drop a memory here.",
  "Something worth saving.",
  "The day in a sentence.",
  "Tell me about your day.",
  "What made today yours?"
];

export default function LogPage({ message, setMessage }) {
  const [confirmation, setConfirmation] = useState("");
  const [heading] = useState(() => HEADINGS[Math.floor(Math.random() * HEADINGS.length)]);
  const textareaRef = useRef(null);

  const mutation = useMutation({
    mutationFn: createMemory,
    onSuccess: () => {
      setMessage("");
      setConfirmation("Memory saved");
    },
  });

  useEffect(() => {
    if (!confirmation) return undefined;
    const timeoutId = window.setTimeout(() => setConfirmation(""), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [confirmation]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const rect = textarea.getBoundingClientRect();
    // Fallback to a standard vertical position if the element is not laid out yet
    const topOffset = rect.top > 0 ? rect.top : 350;
    
    // 12px form bottom padding + 40px confirmation container + 48px section bottom padding
    const bottomReserved = 100;
    const availableHeight = window.innerHeight - topOffset - bottomReserved;
    // Dynamic max height capped at 280px, but always leaving at least 120px height
    const maxHeight = Math.max(120, Math.min(280, availableHeight));
    
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    adjustHeight();
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, [message]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || mutation.isPending) return;
    setConfirmation("");
    mutation.mutate(trimmed);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <main className="h-full overflow-hidden px-6 pt-4 sm:px-10">
      <section className="mx-auto flex h-full w-full max-w-[640px] flex-col items-center pt-[25vh] pb-12">
        <h2
          className="text-left font-display text-4xl font-medium leading-normal tracking-normal text-foreground sm:text-5xl truncate w-full px-1 mb-8 pb-2 shrink-0"
          title={heading}
        >
          {heading}
        </h2>

        <div className="w-full shrink-0">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 rounded-3xl border bg-white p-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe something you want to remember..."
                rows={1}
                className="max-h-[280px] overflow-auto border-0 bg-transparent px-2 py-2 shadow-none focus:ring-0 subtle-scrollbar pr-3"
                disabled={mutation.isPending}
              />
            </div>
            <Button
              type="submit"
              className="mb-0.5 h-10 w-10 shrink-0 rounded-2xl px-0"
              disabled={!message.trim() || mutation.isPending}
              aria-label="Send memory"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-4 flex min-h-6 justify-start text-left pl-3 text-sm">
            {/* Keep for future use if LLM summary is re-enabled:
            mutation.isPending ? (
              <p className="saving-pulse text-muted-foreground">Saving memory</p>
            ) : null
            */}
            {confirmation ? (
              <p className="saved-fade inline-flex items-center gap-2 font-medium text-primary">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs leading-none text-primary-foreground">
                  ✓
                </span>
                {confirmation}
              </p>
            ) : null}
            {mutation.isError ? <p className="text-destructive">{mutation.error.message}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

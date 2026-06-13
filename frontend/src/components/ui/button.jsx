import { cn } from "../../lib/utils";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
  destructive: "text-destructive hover:bg-destructive/10",
};

export function Button({ className, variant = "primary", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

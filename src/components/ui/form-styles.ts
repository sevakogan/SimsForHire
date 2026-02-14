export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-destructive/50 disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
  small:
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
} as const;

export const formStyles = {
  label: "block text-sm font-medium text-foreground mb-1.5",
  input:
    "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
  textarea:
    "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none",
  select:
    "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
  error: "mt-1 text-xs text-destructive",
  group: "space-y-1.5",
} as const;

export const cardStyles = {
  base: "rounded-xl border border-border bg-white p-6 shadow-sm",
  compact: "rounded-xl border border-border bg-white px-5 py-4 shadow-sm",
  hover:
    "rounded-xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20",
} as const;

export const tableStyles = {
  wrapper: "overflow-x-auto rounded-xl border border-border bg-white shadow-sm",
  table: "w-full text-sm",
  thead: "border-b border-border bg-muted/50",
  th: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
  tbody: "divide-y divide-border",
  td: "px-4 py-3 text-sm text-foreground",
  tdMuted: "px-4 py-3 text-sm text-muted-foreground",
  row: "transition-colors hover:bg-muted/50",
} as const;

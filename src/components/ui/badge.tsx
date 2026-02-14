const variants: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  quote: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  completed: "bg-purple-100 text-purple-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  admin: "bg-indigo-100 text-indigo-700",
  collaborator: "bg-cyan-100 text-cyan-700",
  client: "bg-slate-100 text-slate-700",
};

interface BadgeProps {
  variant: string;
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  const colorClass = variants[variant] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {children}
    </span>
  );
}

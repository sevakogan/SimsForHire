const variants: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  quote: "bg-blue-50 text-blue-600",
  submitted: "bg-indigo-50 text-indigo-600",
  accepted: "bg-green-50 text-green-600",
  paid: "bg-emerald-50 text-emerald-600",
  shipped: "bg-amber-50 text-amber-600",
  received: "bg-orange-50 text-orange-600",
  completed: "bg-purple-50 text-purple-600",
  pending: "bg-amber-100 text-amber-700",
  invite_pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  admin: "bg-indigo-100 text-indigo-700",
  collaborator: "bg-cyan-100 text-cyan-700",
  client: "bg-slate-100 text-slate-700",
  // Shipment statuses
  label_created: "bg-slate-100 text-slate-700",
  in_transit: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
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

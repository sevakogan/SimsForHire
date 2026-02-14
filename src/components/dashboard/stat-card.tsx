interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-muted-foreground sm:text-sm">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-1 text-lg font-bold text-foreground sm:mt-2 sm:text-2xl">{value}</p>
    </div>
  );
}

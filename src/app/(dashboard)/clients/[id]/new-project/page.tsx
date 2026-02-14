import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientById } from "@/lib/actions/clients";
import { ProjectForm } from "@/components/projects/project-form";
import { cardStyles } from "@/components/ui/form-styles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewProjectPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) notFound();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <span className="text-muted-foreground/40">›</span>
          <Link href={`/clients/${id}`} className="hover:text-foreground transition-colors">
            {client.name}
          </Link>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">New Project</h1>
      </div>
      <div className={cardStyles.base}>
        <ProjectForm clientId={id} />
      </div>
    </div>
  );
}

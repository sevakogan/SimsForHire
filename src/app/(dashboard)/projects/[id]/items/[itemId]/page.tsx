import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/lib/actions/projects";
import { getItemById } from "@/lib/actions/items";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ItemForm } from "@/components/items/item-form";
import { cardStyles } from "@/components/ui/form-styles";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

interface Props {
  params: Promise<{ id: string; itemId: string }>;
}

export default async function EditItemPage({ params }: Props) {
  const { id, itemId } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  const admin = isAdminRole(typedProfile.role);

  const project = await getProjectById(id);
  if (!project) notFound();

  const item = await getItemById(itemId);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {project.name}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Edit Item #{item.item_number}
        </h1>
      </div>
      <div className={cardStyles.base}>
        <ItemForm
          projectId={id}
          itemNumber={item.item_number}
          item={item}
          isAdmin={admin}
        />
      </div>
    </div>
  );
}

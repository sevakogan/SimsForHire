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
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          href={`/projects/${id}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← {project.name}
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          Product Page
        </h1>
      </div>
      {/* Client note banner */}
      {admin && item.client_note && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <svg className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-700">Client Note</p>
            <p className="text-sm text-blue-600 italic mt-0.5">
              &ldquo;{item.client_note}&rdquo;
            </p>
          </div>
        </div>
      )}

      <div className={cardStyles.compact}>
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

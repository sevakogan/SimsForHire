import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/actions/projects";
import { getShipmentsByProjectId } from "@/lib/actions/shipments";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ShipmentsSection } from "../shipments-section";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShipmentsPage({ params }: Props) {
  const { id } = await params;
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

  const admin = isAdminRole((profile as Profile).role);
  if (!admin) notFound();

  const project = await getProjectById(id);
  if (!project) notFound();

  const shipments = await getShipmentsByProjectId(id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        Shipments
      </h1>
      <ShipmentsSection projectId={id} shipments={shipments} />
    </div>
  );
}

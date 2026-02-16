import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CatalogEditPage({ params }: Props) {
  const { id } = await params;
  redirect(`/customizations/products/${id}`);
}

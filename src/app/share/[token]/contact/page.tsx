import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ContactPage({ params }: Props) {
  const { token } = await params;
  redirect(`/share/${token}/about`);
}

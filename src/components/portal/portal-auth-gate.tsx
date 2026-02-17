import { createSupabaseServer } from "@/lib/supabase-server";
import { PortalSignInPrompt } from "./portal-sign-in-prompt";

interface PortalAuthGateProps {
  token: string;
  children: React.ReactNode;
}

/**
 * Server component that gates portal sub-pages behind authentication.
 * Unauthenticated users see a sign-in prompt; authenticated users see the page content.
 */
export async function PortalAuthGate({ token, children }: PortalAuthGateProps) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PortalSignInPrompt token={token} />;
  }

  return <>{children}</>;
}

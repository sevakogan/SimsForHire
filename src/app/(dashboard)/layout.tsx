import { AuthProvider } from "@/components/auth/auth-provider";
import { TopNav } from "@/components/dashboard/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </AuthProvider>
  );
}

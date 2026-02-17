import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/confirm",
]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "" });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users can only access public auth routes
  if (!user && !PUBLIC_AUTH_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated users on login/signup → redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check profile status for authenticated users on protected routes
  if (user && !PUBLIC_AUTH_ROUTES.has(pathname) && pathname !== "/pending") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.status !== "approved") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }

    // Block non-admin/collaborator users from /admin routes
    if (pathname.startsWith("/admin") && !["admin", "collaborator"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/catalog/:path*",
    "/customizations/:path*",
    "/company",
    "/admin/:path*",
    "/admin",
    "/profile",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/confirm",
    "/pending",
  ],
};

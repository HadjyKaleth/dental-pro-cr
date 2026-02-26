import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Obtener usuario actual (refresca el token automáticamente)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/login";
  const isPublicPath = path.startsWith("/api/auth");

  // Si no tiene sesión y no está en una ruta pública → ir al login
  if (!user && !isLoginPage && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si tiene sesión y va al login → ir al dashboard
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/citas", request.url));
  }

  return supabaseResponse;
}

// Define en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

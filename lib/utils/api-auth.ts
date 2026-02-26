import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface StaffInfo {
  id: string;
  clinic_id: string;
  role: string;
  full_name: string;
}

/**
 * Envuelve un handler de API con verificación de autenticación.
 * Uso: export const GET = withAuth(async (req, user, staff) => { ... })
 */
export function withAuth(
  handler: (req: Request, user: any, staff: StaffInfo) => Promise<Response>,
) {
  return async (req: Request) => {
    const supabase = createServerSupabaseClient();

    // 1. Verificar JWT del usuario
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado. Inicia sesión primero." },
        { status: 401 },
      );
    }

    // 2. Obtener info del staff (verifica que pertenece a una clínica activa)
    const { data: staffInfo, error: staffError } = await supabase
      .from("staff")
      .select("id, role, clinic_id, full_name")
      .eq("auth_user_id", user.id)
      .eq("active", true)
      .single();

    if (staffError || !staffInfo) {
      return NextResponse.json(
        { error: "Tu usuario no está asociado a ninguna clínica activa." },
        { status: 403 },
      );
    }

    return handler(req, user, staffInfo as StaffInfo);
  };
}

// Verifica que el usuario tiene uno de los roles permitidos
export function requireRole(
  staff: StaffInfo,
  roles: string[],
): NextResponse | null {
  if (!roles.includes(staff.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para esta acción." },
      { status: 403 },
    );
  }
  return null;
}

// Rate limiting simple (para producción real, usar Upstash Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;
  record.count++;
  return true;
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withAuth, requireRole } from "@/lib/utils/api-auth";
import { z } from "zod";

const PatientSchema = z.object({
  full_name: z.string().min(2, "El nombre es requerido").max(150),
  id_number: z.string().max(20).optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["M", "F", "otro"]).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  emergency_name: z.string().max(150).optional(),
  emergency_phone: z.string().max(20).optional(),
  allergies: z.string().max(1000).optional(),
  medical_notes: z.string().max(2000).optional(),
});

// GET /api/patients?q=nombre
export const GET = withAuth(async (req, user, staff) => {
  const supabase = createServerSupabaseClient();
  const url = new URL(req.url);
  const search = url.searchParams.get("q");

  let query = supabase
    .from("patients")
    .select("id, full_name, id_number, phone, email, date_of_birth, created_at")
    .eq("clinic_id", staff.clinic_id)
    .eq("active", true)
    .order("full_name")
    .limit(100);

  if (search && search.length >= 2) {
    query = query.ilike("full_name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json(
      { error: "Error al obtener pacientes" },
      { status: 500 },
    );
  return NextResponse.json({ data });
});

// POST /api/patients — Crear nuevo paciente
export const POST = withAuth(async (req, user, staff) => {
  const supabase = createServerSupabaseClient();

  // Solo admin y recepcionistas pueden crear pacientes
  const roleError = requireRole(staff, ["admin", "receptionist"]);
  if (roleError) return roleError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = PatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      ...parsed.data,
      clinic_id: staff.clinic_id,
      created_by: staff.id,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json(
      { error: "Error al crear el paciente" },
      { status: 500 },
    );
  return NextResponse.json({ data }, { status: 201 });
});

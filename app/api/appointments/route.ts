import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/utils/api-auth";
import { z } from "zod";

// Definir qué datos se esperan al crear una cita
const CreateAppointmentSchema = z.object({
  patient_id: z.string().uuid("ID de paciente inválido"),
  dentist_id: z.string().uuid("ID de dentista inválido"),
  service_id: z.string().uuid().optional(),
  scheduled_at: z.string().datetime("Fecha inválida"),
  duration_min: z.number().int().min(15).max(480).default(60),
  reason: z.string().max(500).optional(),
});

// GET /api/appointments?date=2025-03-15
export const GET = withAuth(async (req, user, staff) => {
  const supabase = createServerSupabaseClient();
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      patient:patients(id, full_name, phone),
      dentist:staff!dentist_id(id, full_name),
      service:services(id, name, price, duration_min)
    `,
    )
    .eq("clinic_id", staff.clinic_id) // ← CLAVE: solo su clínica
    .order("scheduled_at");

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query = query
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString());
  }

  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error)
    return NextResponse.json(
      { error: "Error al obtener citas" },
      { status: 500 },
    );
  return NextResponse.json({ data });
});

// POST /api/appointments
export const POST = withAuth(async (req, user, staff) => {
  const supabase = createServerSupabaseClient();

  // Parsear el body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validar con Zod
  const parsed = CreateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  // Verificar que el paciente es de ESTA clínica (previene IDOR: acceso a datos ajenos)
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", parsed.data.patient_id)
    .eq("clinic_id", staff.clinic_id)
    .single();

  if (!patient)
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 },
    );

  // Verificar conflicto de horario
  const scheduledAt = new Date(parsed.data.scheduled_at);
  const endAt = new Date(
    scheduledAt.getTime() + parsed.data.duration_min * 60_000,
  );

  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("dentist_id", parsed.data.dentist_id)
    .eq("clinic_id", staff.clinic_id)
    .neq("status", "cancelled")
    .lt("scheduled_at", endAt.toISOString())
    .gte("scheduled_at", scheduledAt.toISOString());

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: "El dentista ya tiene una cita en ese horario" },
      { status: 409 },
    );
  }

  // Crear la cita
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      ...parsed.data,
      clinic_id: staff.clinic_id,
      created_by: staff.id,
      status: "scheduled",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json(
      { error: "Error al crear la cita" },
      { status: 500 },
    );

  return NextResponse.json({ data }, { status: 201 });
});

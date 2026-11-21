import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withAuth, requireRole, checkRateLimit } from "@/lib/utils/api-auth";
import { z } from "zod";

const PaymentSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  currency: z.enum(["CRC", "USD"]).default("CRC"),
  method: z.enum(["sinpe", "efectivo", "datafono"]),
  reference_number: z.string().max(50).optional(),
  notes: z.string().max(300).optional(),
});

// GET /api/payments
export const GET = withAuth(async (req, user, staff) => {
  const supabase = createServerSupabaseClient();
  const url = new URL(req.url);
  const method = url.searchParams.get("method");

  let query = supabase
    .from("payments")
    .select(
      `
      *,
      patient:patients(id, full_name),
      processed_by:staff(full_name)
    `,
    )
    .eq("clinic_id", staff.clinic_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (method) query = query.eq("method", method);

  const { data, error } = await query;
  if (error)
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 },
    );
  return NextResponse.json({ data });
});

// POST /api/payments — Registrar nuevo pago
export const POST = withAuth(async (req, user, staff) => {
  const supabase = createServerSupabaseClient();

  // Solo admin y recepcionistas pueden registrar pagos
  const roleError = requireRole(staff, ["admin", "receptionist"]);
  if (roleError) return roleError;

  // Rate limit: máximo 30 pagos por minuto
  if (!checkRateLimit(`payments:${staff.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = PaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  // Verificar que el paciente es de ESTA clínica
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

  const { data, error } = await supabase
    .from("payments")
    .insert({
      ...parsed.data,
      clinic_id: staff.clinic_id,
      processed_by: staff.id,
      status: "completed",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json(
      { error: "Error al registrar el pago" },
      { status: 500 },
    );

  // Si tiene appointment_id, actualizar el estado de la cita a completada
  if (parsed.data.appointment_id) {
    await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", parsed.data.appointment_id)
      .eq("clinic_id", staff.clinic_id);
  }

  return NextResponse.json({ data }, { status: 201 });
});

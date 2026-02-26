import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CalendarDays, Users, CreditCard, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

async function getDashboardData() {
  const supabase = createServerSupabaseClient();
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  ).toISOString();

  const [citasHoy, totalPacientes, ingresosHoy, citasPendientes] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", { count: "exact" })
        .gte("scheduled_at", startOfDay)
        .lte("scheduled_at", endOfDay)
        .neq("status", "cancelled"),

      supabase
        .from("patients")
        .select("id", { count: "exact" })
        .eq("active", true),

      supabase.from("payments").select("amount").gte("created_at", startOfDay),

      supabase
        .from("appointments")
        .select(
          `
        id, scheduled_at, status, reason,
        patient:patients(full_name, phone),
        dentist:staff!dentist_id(full_name),
        service:services(name)
      `,
        )
        .gte("scheduled_at", startOfDay)
        .lte("scheduled_at", endOfDay)
        .in("status", ["scheduled", "confirmed"])
        .order("scheduled_at")
        .limit(5),
    ]);

  const totalIngresos =
    ingresosHoy.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    citasHoy: citasHoy.count || 0,
    totalPacientes: totalPacientes.count || 0,
    totalIngresos,
    proximasCitas: citasPendientes.data || [],
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const hoy = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  const kpis = [
    {
      label: "Citas hoy",
      value: data.citasHoy,
      icon: CalendarDays,
      color: "teal",
    },
    {
      label: "Pacientes activos",
      value: data.totalPacientes,
      icon: Users,
      color: "blue",
    },
    {
      label: "Ingresos hoy",
      value: `₡${data.totalIngresos.toLocaleString("es-CR")}`,
      icon: CreditCard,
      color: "green",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 capitalize">{hoy}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">
                {kpi.label}
              </span>
              <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
                <kpi.icon size={18} className="text-teal-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Próximas citas del día */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Citas pendientes hoy
        </h2>

        {data.proximasCitas.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">
            No hay más citas pendientes para hoy 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {data.proximasCitas.map((cita: any) => (
              <div
                key={cita.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="text-center min-w-[56px]">
                  <div className="text-xs text-slate-400">Hora</div>
                  <div className="font-bold text-slate-800 text-sm">
                    {format(new Date(cita.scheduled_at), "HH:mm")}
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex-1">
                  <div className="font-medium text-slate-800 text-sm">
                    {cita.patient?.full_name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {cita.service?.name || "Consulta general"} · Dr.{" "}
                    {cita.dentist?.full_name}
                  </div>
                </div>
                <span
                  className={`
                  text-xs font-medium px-2.5 py-1 rounded-full
                  ${
                    cita.status === "confirmed"
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }
                `}
                >
                  {cita.status === "confirmed" ? "Confirmada" : "Programada"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

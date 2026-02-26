"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "Programada",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  in_progress: {
    label: "En curso",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  completed: {
    label: "Completada",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-50 text-red-600 border border-red-200",
  },
  no_show: {
    label: "No asistió",
    className: "bg-red-50 text-red-600 border border-red-200",
  },
};

export default function CitasPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClientSupabase();

  const loadAppointments = useCallback(async () => {
    setLoading(true);

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("appointments")
      .select(
        `
        *, 
        patient:patients(id, full_name, phone),
        dentist:staff!dentist_id(id, full_name),
        service:services(id, name, price)
      `,
      )
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at");

    setAppointments(data || []);
    setLoading(false);
  }, [selectedDate, supabase]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    loadAppointments();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citas</h1>
          <p className="text-slate-500 text-sm">Gestión de citas dentales</p>
        </div>

        <Link
          href="/citas/nueva"
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white
                     font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nueva cita
        </Link>
      </div>

      {/* Selector fecha */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex items-center gap-4">
        <button
          onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex gap-2">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const date = addDays(selectedDate, offset);
            const isSelected = offset === 0;

            return (
              <button
                key={offset}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-2 rounded-lg text-xs transition-all
                  ${
                    isSelected
                      ? "bg-teal-600 text-white"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
              >
                <span className="uppercase">
                  {format(date, "EEE", { locale: es })}
                </span>
                <div className="font-bold text-base">{format(date, "d")}</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
        >
          <ChevronRight size={18} />
        </button>

        <div className="text-sm font-medium text-slate-700 capitalize border-l border-slate-200 pl-4">
          {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Cargando citas...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-slate-500 text-sm">No hay citas para este día</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((cita) => {
              const status =
                STATUS_CONFIG[cita.status] || STATUS_CONFIG.scheduled;

              return (
                <div key={cita.id} className="p-5 hover:bg-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="min-w-[60px] text-center">
                      <div className="font-bold">
                        {format(new Date(cita.scheduled_at), "HH:mm")}
                      </div>
                      <div className="text-xs text-slate-400">
                        {cita.duration_min}min
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {cita.patient?.full_name}
                        </span>

                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="text-sm text-slate-500">
                        {cita.service?.name || "Consulta"} · Dr.{" "}
                        {cita.dentist?.full_name}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(cita.id, "cancelled")}
                        className="text-xs bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

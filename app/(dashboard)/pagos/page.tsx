"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

const METHOD_CONFIG: Record<string, { label: string; icon: string }> = {
  sinpe: { label: "SINPE Móvil", icon: "📱" },
  efectivo: { label: "Efectivo", icon: "💵" },
  datafono: { label: "Datafono", icon: "💳" },
};

export default function PagosPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const supabase = createClientSupabase();

  const loadPayments = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("payments")
      .select(
        `
        *,
        patient:patients(full_name),
        processed_by:staff(full_name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("method", filter);
    }

    const { data } = await query;

    setPayments(data || []);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const total = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="text-slate-500 text-sm">Historial de pagos y cobros</p>
        </div>

        <Link
          href="/pagos/nuevo"
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white
                     font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Registrar pago
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total registrado",
            value: `₡${total.toLocaleString("es-CR")}`,
          },
          {
            label: "SINPE Móvil",
            value: payments.filter((p) => p.method === "sinpe").length,
          },
          {
            label: "Efectivo",
            value: payments.filter((p) => p.method === "efectivo").length,
          },
          {
            label: "Datafono",
            value: payments.filter((p) => p.method === "datafono").length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
            <div className="text-xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[
          { value: "all", label: "Todos" },
          { value: "sinpe", label: "📱 SINPE" },
          { value: "efectivo", label: "💵 Efectivo" },
          { value: "datafono", label: "💳 Datafono" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
              ${
                filter === f.value
                  ? "bg-teal-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {[
                "Fecha",
                "Paciente",
                "Método",
                "Referencia",
                "Monto",
                "Registrado por",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-slate-400 text-sm"
                >
                  Cargando...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-slate-400 text-sm"
                >
                  No hay pagos registrados
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const method = METHOD_CONFIG[p.method] || {
                  label: p.method,
                  icon: "💰",
                };

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {format(new Date(p.created_at), "d MMM yyyy HH:mm", {
                        locale: es,
                      })}
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-800 text-sm">
                      {p.patient?.full_name}
                    </td>

                    <td className="px-5 py-3.5 text-sm">
                      {method.icon} {method.label}
                    </td>

                    <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">
                      {p.reference_number || "—"}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {p.currency === "USD" ? "$" : "₡"}
                      {parseFloat(p.amount || 0).toLocaleString("es-CR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {p.processed_by?.full_name}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

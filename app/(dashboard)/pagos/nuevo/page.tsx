"use client";
import { useState, useEffect } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NuevoPagoPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    amount: "",
    currency: "CRC",
    method: "efectivo",
    reference_number: "",
    notes: "",
  });
  const router = useRouter();

  useEffect(() => {
    const supabase = createClientSupabase();
    supabase
      .from("patients")
      .select("id, full_name")
      .eq("active", true)
      .then(({ data }) => setPatients(data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      router.push("/pagos");
    } else {
      const data = await res.json();
      alert(data.error || "Error al registrar el pago");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Registrar Pago</h1>
        <p className="text-slate-500 text-sm">
          Registrar un nuevo pago recibido
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Paciente *
            </label>
            <select
              required
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Monto *
              </label>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="15000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Moneda
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="CRC">₡ Colones (CRC)</option>
                <option value="USD">$ Dólares (USD)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Método de pago *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "efectivo", label: "💵 Efectivo" },
                { value: "sinpe", label: "📱 SINPE" },
                { value: "datafono", label: "💳 Datafono" },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm({ ...form, method: m.value })}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors
                    ${
                      form.method === m.value
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {(form.method === "sinpe" || form.method === "datafono") && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {form.method === "sinpe"
                  ? "Número de confirmación SINPE"
                  : "Número de autorización"}
              </label>
              <input
                type="text"
                value={form.reference_number}
                onChange={(e) =>
                  setForm({ ...form, reference_number: e.target.value })
                }
                placeholder={
                  form.method === "sinpe" ? "Ej: 123456" : "Ej: 789012"
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Observaciones sobre el pago..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-slate-200 text-slate-600 font-medium text-sm py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Guardando..." : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

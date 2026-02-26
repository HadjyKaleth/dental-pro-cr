"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoPacientePage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    id_number: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    address: "",
    emergency_name: "",
    emergency_phone: "",
    allergies: "",
    medical_notes: "",
  });
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/pacientes");
    } else {
      const data = await res.json();
      alert(data.error || "Error al crear el paciente");
      setLoading(false);
    }
  }

  const field = (
    label: string,
    key: string,
    type = "text",
    required = false,
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && " *"}
      </label>
      <input
        type={type}
        required={required}
        value={(form as any)[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Nuevo Paciente</h1>
        <p className="text-slate-500 text-sm">
          Registrar un nuevo paciente en el sistema
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Datos personales
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {field("Nombre completo", "full_name", "text", true)}
            {field("Cédula", "id_number")}
            {field("Teléfono", "phone", "tel")}
            {field("Email", "email", "email")}
            {field("Fecha de nacimiento", "date_of_birth", "date")}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Género
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="mt-4">{field("Dirección", "address")}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Contacto de emergencia
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {field("Nombre", "emergency_name")}
            {field("Teléfono", "emergency_phone", "tel")}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Información médica
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Alergias
              </label>
              <textarea
                value={form.allergies}
                onChange={(e) =>
                  setForm({ ...form, allergies: e.target.value })
                }
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notas médicas
              </label>
              <textarea
                value={form.medical_notes}
                onChange={(e) =>
                  setForm({ ...form, medical_notes: e.target.value })
                }
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
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
            {loading ? "Guardando..." : "Registrar paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}

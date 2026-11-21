"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { Search, Plus, Phone } from "lucide-react";
import Link from "next/link";

export default function PacientesPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createClientSupabase();

  const loadPatients = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("patients")
      .select("id, full_name, phone, email, id_number, created_at")
      .eq("active", true)
      .order("full_name");

    if (search.length >= 2) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const { data } = await query.limit(50);

    setPatients(data || []);
    setLoading(false);
  }, [search, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadPatients]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-slate-500">
            {patients.length} pacientes registrados
          </p>
        </div>

        <Link
          href="/pacientes/nuevo"
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={16} />
          Nuevo paciente
        </Link>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left px-5 py-3 text-xs">Nombre</th>
              <th className="text-left px-5 py-3 text-xs">Teléfono</th>
              <th className="text-left px-5 py-3 text-xs">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-6 text-sm text-slate-400"
                >
                  Cargando...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-6 text-sm text-slate-400"
                >
                  No hay pacientes
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-5 py-3 text-sm font-medium">
                    {p.full_name}
                  </td>

                  <td className="px-5 py-3 text-sm">
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="flex items-center gap-1"
                      >
                        <Phone size={13} />
                        {p.phone}
                      </a>
                    )}
                  </td>

                  <td className="px-5 py-3 text-sm">
                    <Link
                      href={`/pacientes/${p.id}`}
                      className="text-teal-600 hover:underline"
                    >
                      Ver perfil
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

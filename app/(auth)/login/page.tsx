"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientSupabase();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Mensaje genérico para no revelar si el email existe o no
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/citas");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 w-full max-w-md p-8">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🦷</div>
          <h1 className="text-2xl font-bold text-slate-900">DentalPro CR</h1>
          <p className="text-slate-500 text-sm mt-1">
            Sistema de gestión dental
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         placeholder:text-slate-400"
              placeholder="correo@clinica.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={8}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60
                       text-white font-semibold rounded-lg py-2.5 text-sm
                       transition-colors duration-150"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Problemas para ingresar? Contacta al administrador.
        </p>
      </div>
    </div>
  );
}

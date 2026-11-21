export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bienvenido a DentalFlow CR</p>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 mb-1">Citas hoy</div>
          <div className="text-3xl font-bold text-slate-900">0</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 mb-1">Pacientes activos</div>
          <div className="text-3xl font-bold text-slate-900">0</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500 mb-1">Ingresos hoy</div>
          <div className="text-3xl font-bold text-slate-900">₡0</div>
        </div>
      </div>
    </div>
  );
}

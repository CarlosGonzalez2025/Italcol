
import React, { useEffect, useState } from 'react';
import { User, Permit, PermitStatus } from '../types';
import { dbService } from '../services/dbService';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Play,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await dbService.getPermits(user.role, user.id);
      setPermits(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-400 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p>Sincronizando datos...</p>
      </div>
    </div>
  );

  const stats = {
    total: permits.length,
    pending: permits.filter(p => p.status === PermitStatus.PENDING_REVISION).length,
    approved: permits.filter(p => p.status === PermitStatus.APPROVED).length,
    active: permits.filter(p => p.status === PermitStatus.IN_PROGRESS).length,
  };

  const chartData = [
    { name: 'Pendientes', value: stats.pending, color: '#f59e0b' },
    { name: 'Aprobados', value: stats.approved, color: '#10b981' },
    { name: 'En Ejecución', value: stats.active, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Resumen operativo y estado de permisos en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Sistema Operativo
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Permisos" 
            value={stats.total} 
            icon={<FileText className="text-white" size={24} />} 
            gradient="from-slate-700 to-slate-900" 
        />
        <StatCard 
            title="Pendientes" 
            value={stats.pending} 
            icon={<Clock className="text-white" size={24} />} 
            gradient="from-amber-400 to-amber-600" 
        />
        <StatCard 
            title="Aprobados" 
            value={stats.approved} 
            icon={<CheckCircle className="text-white" size={24} />} 
            gradient="from-emerald-400 to-emerald-600" 
        />
        <StatCard 
            title="En Ejecución" 
            value={stats.active} 
            icon={<Play className="text-white" size={24} />} 
            gradient="from-blue-500 to-blue-700" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Permits List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800">Actividad Reciente</h3>
            <Link to="/permits" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              Ver todo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID Permiso</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4">Solicitante</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permits.slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium">
                      <Link to={`/permits/${p.id}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400 group-hover:text-blue-500" />
                        {p.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.area} <span className="text-slate-400 text-xs">({p.plant})</span></td>
                    <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {p.requesterName.charAt(0)}
                            </div>
                            {p.requesterName}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
                {permits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                      <div className="bg-slate-100 p-3 rounded-full"><FileText size={24} /></div>
                      No hay permisos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-slate-400" />
                Métricas
            </h3>
          </div>
          <div className="p-6 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                    cursor={{fill: '#f1f5f9', radius: 4}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, gradient }: { title: string, value: number, icon: React.ReactNode, gradient: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <div className="relative z-10 mt-2">
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      <p className="text-4xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  </div>
);

export const StatusBadge = ({ status }: { status: PermitStatus }) => {
  const configs = {
    [PermitStatus.PENDING_REVISION]: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
    [PermitStatus.APPROVED]: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
    [PermitStatus.IN_PROGRESS]: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Play },
    [PermitStatus.CLOSED]: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: CheckCircle },
    [PermitStatus.REJECTED]: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
  };
  
  const labels = {
    [PermitStatus.PENDING_REVISION]: "Pendiente",
    [PermitStatus.APPROVED]: "Aprobado",
    [PermitStatus.IN_PROGRESS]: "En Ejecución",
    [PermitStatus.CLOSED]: "Cerrado",
    [PermitStatus.REJECTED]: "Rechazado",
  };

  const Config = configs[status];
  const Icon = Config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${Config.bg} ${Config.text} ${Config.border}`}>
      <Icon size={12} />
      {labels[status]}
    </span>
  );
};

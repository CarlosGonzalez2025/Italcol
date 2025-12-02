import React, { useEffect, useState } from 'react';
import { Permit, User, UserRole, PermitStatus } from '../types';
import { dbService } from '../services/dbService';
import { StatusBadge } from './Dashboard';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';

export const PermitList: React.FC<{ user: User }> = ({ user }) => {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dbService.getPermits(user.role, user.id).then(setPermits);
  }, [user]);

  const filteredPermits = permits.filter(p => {
    const matchesSearch = p.number.toLowerCase().includes(search.toLowerCase()) || 
                          p.location.toLowerCase().includes(search.toLowerCase()) ||
                          p.requesterName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Permisos</h1>
        {(user.role === UserRole.SOLICITANTE || user.role === UserRole.ADMIN) && (
            <Link to="/permits/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <Plus size={18} />
                Nuevo Permiso
            </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por #, ubicación o solicitante..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-500" />
                <select 
                    className="border border-slate-300 rounded-lg py-2 px-3 outline-none"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                >
                    <option value="all">Todos los estados</option>
                    <option value={PermitStatus.PENDING_REVISION}>Pendientes</option>
                    <option value={PermitStatus.APPROVED}>Aprobados</option>
                    <option value={PermitStatus.IN_PROGRESS}>En Ejecución</option>
                    <option value={PermitStatus.CLOSED}>Cerrados</option>
                </select>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">Número</th>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Solicitante</th>
                        <th className="px-6 py-3">Ubicación</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredPermits.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{p.number}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-slate-600">{p.requesterName}</td>
                            <td className="px-6 py-4 text-slate-600">{p.location}</td>
                            <td className="px-6 py-4">
                                <StatusBadge status={p.status} />
                            </td>
                            <td className="px-6 py-4">
                                <Link to={`/permits/${p.id}`} className="text-blue-600 font-medium hover:underline">
                                    Ver Detalle
                                </Link>
                            </td>
                        </tr>
                    ))}
                    {filteredPermits.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                No se encontraron permisos.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
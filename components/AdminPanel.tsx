
import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/dbService';
import { Users, Settings, Database, Plus, RefreshCw, Trash2, Save, X, AlertCircle, Lock } from 'lucide-react';

export const AdminPanel: React.FC<{ user: User }> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.SOLICITANTE
  });

  const fetchUsers = async () => {
    setLoading(true);
    const data = await dbService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name || !newUser.password) return alert("Todos los campos son obligatorios.");
    if (newUser.password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
    
    setCreating(true);
    try {
      // Uses the new service that handles both Auth and Firestore
      await dbService.registerUser(
        { 
          name: newUser.name, 
          email: newUser.email, 
          role: newUser.role 
        }, 
        newUser.password
      );
      
      setShowForm(false);
      setNewUser({ name: '', email: '', password: '', role: UserRole.SOLICITANTE });
      alert("Usuario creado exitosamente");
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      // Simplify firebase error messages
      let msg = "Error al crear usuario";
      if (error.code === 'auth/email-already-in-use') msg = "El correo ya está registrado.";
      if (error.code === 'auth/weak-password') msg = "La contraseña es muy debil.";
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("¿Estás seguro de eliminar este perfil de la base de datos? \n\nNota: Esto NO elimina la cuenta de acceso (Authentication), solo el perfil visual.")) {
      await dbService.deleteUser(userId);
      fetchUsers();
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
            <button onClick={fetchUsers} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <Users />
                        <h3 className="font-bold">Usuarios</h3>
                    </div>
                    <p className="text-slate-500 text-sm mb-4">Perfiles activos en la colección 'users'.</p>
                    <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-purple-600">
                    <Settings />
                    <h3 className="font-bold">Configuración</h3>
                </div>
                <p className="text-slate-500 text-sm mb-4">Listas maestras (Áreas, Plantas).</p>
                <button className="text-sm font-medium text-purple-600 hover:underline">Gestionar Listas</button>
            </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Database size={18} className="text-slate-400" />
                    Gestión de Usuarios (Auth + BD)
                </h3>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                    {showForm ? <X size={16}/> : <Plus size={16}/>}
                    {showForm ? 'Cancelar' : 'Nuevo Usuario'}
                </button>
            </div>

            {/* Create User Form */}
            {showForm && (
                <div className="p-6 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold text-blue-800 mb-1">Nombre</label>
                            <input 
                                type="text" 
                                placeholder="Nombre Completo"
                                className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.name}
                                onChange={e => setNewUser({...newUser, name: e.target.value})}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold text-blue-800 mb-1">Email (Acceso)</label>
                            <input 
                                type="email" 
                                placeholder="correo@ejemplo.com"
                                className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.email}
                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold text-blue-800 mb-1">Contraseña</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Mínimo 6 carácteres"
                                    className="w-full p-2 pl-8 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                />
                                <Lock size={14} className="absolute left-2.5 top-2.5 text-blue-400" />
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold text-blue-800 mb-1">Rol</label>
                            <select 
                                className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.role}
                                onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-1">
                            <button 
                                type="submit" 
                                disabled={creating}
                                className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {creating ? 'Creando...' : <><Save size={16} /> Crear</>}
                            </button>
                        </div>
                    </form>
                    <div className="flex items-center gap-2 mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                        <AlertCircle size={14} />
                        Nota: Esto creará automáticamente la cuenta de acceso y el perfil en la base de datos.
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Email / UID</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium flex items-center gap-3">
                                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                                    {u.name}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    <div className="font-medium text-slate-700">{u.email}</div>
                                    <div className="text-xs font-mono text-slate-400 mt-0.5">{u.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold border ${
                                        u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        u.role === UserRole.AUTORIZANTE ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                        title="Eliminar Perfil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                    No hay usuarios registrados en Firestore.
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

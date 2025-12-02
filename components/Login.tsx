
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { AlertCircle, ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { MOCK_USERS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const user = await authService.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for demo purposes to quickly fill form
  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123'); // Assuming a default password for demo users if created
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Column: Brand */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
             <ShieldCheck className="text-orange-500" size={32} />
             SGTC Móvil
          </div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 leading-tight">Gestión de Tareas Críticas <span className="text-blue-400">Inteligente y Segura</span>.</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Digitalice sus permisos de trabajo, optimice las aprobaciones y garantice la seguridad de su equipo con nuestra plataforma de última generación.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
           © 2024 SGTC System. Powered by Italcol Safety.
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start lg:hidden mb-6">
               <ShieldCheck className="text-orange-600" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Iniciar Sesión</h2>
            <p className="text-slate-500 mt-2">Ingrese sus credenciales para acceder al sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 text-sm border border-red-200">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Autenticando...' : 'Ingresar al Sistema'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Quick Login for Demo Purposes */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-center text-slate-400 uppercase tracking-wider font-semibold mb-4">Usuarios Demo (Click para rellenar)</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {MOCK_USERS.map(u => (
                <button 
                  key={u.id}
                  onClick={() => fillDemo(u.email)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-full transition-colors border border-slate-200"
                >
                  {u.name} ({u.role})
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">Nota: Asegúrese de haber creado estos usuarios en Firebase Auth con clave "password123".</p>
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Users, 
  LogOut, 
  Menu,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: Object.values(UserRole) },
    { name: 'Mis Permisos', href: '/permits', icon: FileText, roles: Object.values(UserRole) },
    { name: 'Crear Permiso', href: '/permits/create', icon: PlusCircle, roles: [UserRole.SOLICITANTE, UserRole.ADMIN] },
    { name: 'Administración', href: '/admin', icon: Users, roles: [UserRole.ADMIN] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight leading-none">SGTC Móvil</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider mt-1">SAFETY FIRST</p>
              </div>
            </div>
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-slate-700 shadow-sm" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mt-0.5 truncate">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3 w-full">
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
                    <span>{item.name}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="text-orange-500" />
            SGTC
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="text-slate-500 p-2 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

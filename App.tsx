import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User } from './types';
import { authService } from './services/authService';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PermitList } from './components/PermitList';
import { PermitDetail } from './components/PermitDetail';
import { CreatePermitWizard } from './components/CreatePermitWizard';
import { AdminPanel } from './components/AdminPanel';

function RequireAuth({ children }: { children?: React.ReactNode }) {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">Cargando SGTC...</div>;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        <Route path="/" element={
          <RequireAuth>
            <Layout user={user!} onLogout={handleLogout} />
          </RequireAuth>
        }>
          <Route index element={<Dashboard user={user!} />} />
          <Route path="permits" element={<PermitList user={user!} />} />
          <Route path="permits/create" element={<CreatePermitWizard user={user!} />} />
          <Route path="permits/:id" element={<PermitDetail user={user!} />} />
          <Route path="admin" element={<AdminPanel user={user!} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
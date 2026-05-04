import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import PacientesPage from './pages/Pacientes';
import OdontologosPage from './pages/Odontologos';
import SecretariasPage from './pages/Secretarias';
import TurnosPage from './pages/Turnos';
import UsuariosPage from './pages/Usuarios';
import HorariosPage from './pages/Horarios';
import LoginPage from './pages/Login';
import NotificacionesPage from './pages/Notificaciones';

// Protege que solo usuarios logueados entren
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Protege que solo ciertos roles entren (ej: solo ADMIN)
const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // Si el usuario no tiene el rol permitido, lo mandamos al dashboard
  if (user && !allowedRoles.includes(user.rol)) {
    console.warn(`Acceso denegado: Se requiere rol ${allowedRoles.join(' o ')}`);
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas para todos los usuarios logueados (Dashboard, Pacientes, Turnos) */}
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pacientes" element={<PacientesPage />} />
            <Route path="turnos" element={<TurnosPage />} />
            <Route path="notificaciones" element={<NotificacionesPage />} />
            
            {/* Rutas solo para ADMIN (Gestión de Staff y Usuarios) */}
            <Route path="odontologos" element={<RoleRoute allowedRoles={['ADMIN']}><OdontologosPage /></RoleRoute>} />
            <Route path="secretarias" element={<RoleRoute allowedRoles={['ADMIN']}><SecretariasPage /></RoleRoute>} />
            <Route path="usuarios" element={<RoleRoute allowedRoles={['ADMIN']}><UsuariosPage /></RoleRoute>} />
            <Route path="horarios" element={<RoleRoute allowedRoles={['ADMIN']}><HorariosPage /></RoleRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

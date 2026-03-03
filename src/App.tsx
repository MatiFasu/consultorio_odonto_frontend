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

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pacientes" element={<PacientesPage />} />
            <Route path="odontologos" element={<OdontologosPage />} />
            <Route path="secretarias" element={<SecretariasPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="horarios" element={<HorariosPage />} />
            <Route path="turnos" element={<TurnosPage />} />
            <Route path="config" element={<div className="p-20 text-center font-bold text-slate-400">Configuración en desarrollo...</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

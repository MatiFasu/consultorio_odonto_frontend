import { LayoutDashboard, Users, Calendar, Settings, LogOut, Bell, User, Stethoscope, Shield, Clock, Briefcase } from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const SidebarItem = ({ icon: Icon, label, to }: SidebarItemProps) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
      active 
        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 translate-x-1' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}>
      <Icon size={20} className={active ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
      <span className="font-semibold">{label}</span>
    </Link>
  );
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.rol === 'ADMIN';
  const isSecretaria = user?.rol === 'SECRETARIA';
  const isOdontologo = user?.rol === 'ODONTOLOGO';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Panel de Control';
      case '/pacientes': return 'Gestión de Pacientes';
      case '/turnos': return isAdmin || isSecretaria ? 'Agenda Global' : 'Mis Turnos';
      case '/odontologos': return 'Staff Médico';
      case '/horarios': return 'Agenda de Atención';
      case '/usuarios': return 'Cuentas de Acceso';
      default: return 'OdontoSys';
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Calendar className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">OdontoSys</h1>
            <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Medical Center</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
          
          <SidebarItem 
            icon={Calendar} 
            label={isAdmin || isSecretaria ? "Agenda Global" : "Mis Turnos"} 
            to="/turnos" 
          />
          
          {(isAdmin || isSecretaria) && (
            <>
              <SidebarItem icon={Users} label="Pacientes" to="/pacientes" />
              <SidebarItem icon={Stethoscope} label="Staff Médico" to="/odontologos" />
            </>
          )}

          {isAdmin && (
            <>
              <SidebarItem icon={Briefcase} label="Gestión Secretarias" to="/secretarias" />
              <SidebarItem icon={Clock} label="Bloques Horarios" to="/horarios" />
              <SidebarItem icon={Shield} label="Accesos Usuarios" to="/usuarios" />
            </>
          )}
          
          <SidebarItem icon={Settings} label="Configuración" to="/config" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl mb-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Sesión Activa</p>
            <p className="text-sm font-bold text-slate-800 truncate mb-1">{user?.usuario}</p>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
              isAdmin ? 'bg-indigo-100 text-indigo-600' : 
              isSecretaria ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {user?.rol}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full text-left font-semibold"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{getPageTitle()}</h2>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 cursor-pointer relative">
               <Bell size={20} />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.usuario}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{user?.rol}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <User className="text-slate-400" size={24} />
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

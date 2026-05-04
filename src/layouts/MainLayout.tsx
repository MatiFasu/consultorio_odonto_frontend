import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ShieldCheck,
  Stethoscope,
  Briefcase,
  Clock
} from 'lucide-react';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Definición de menú con restricciones de ROL
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SECRETARIA', 'ODONTOLOGO'] },
    { name: 'Pacientes', href: '/pacientes', icon: Users, roles: ['ADMIN', 'SECRETARIA', 'ODONTOLOGO'] },
    { name: 'Agenda', href: '/turnos', icon: Calendar, roles: ['ADMIN', 'SECRETARIA', 'ODONTOLOGO'] },
    { name: 'Odontólogos', href: '/odontologos', icon: Stethoscope, roles: ['ADMIN'] },
    { name: 'Secretarias', href: '/secretarias', icon: Briefcase, roles: ['ADMIN'] },
    { name: 'Usuarios', href: '/usuarios', icon: ShieldCheck, roles: ['ADMIN'] },
    { name: 'Horarios', href: '/horarios', icon: Clock, roles: ['ADMIN'] },
    { name: 'Notificaciones', href: '/notificaciones', icon: Bell, roles: ['ADMIN', 'SECRETARIA'] },
  ];

  // Filtramos el menú según el rol del usuario logueado
  const filteredNavigation = navigation.filter(item => user && item.roles.includes(user.rol));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-4 border-b border-slate-50 shrink-0">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0">
            <Calendar size={24} />
          </div>
          {isSidebarOpen && <span className="font-black text-xl text-slate-800 tracking-tight">OdontoSys</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar pt-8">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group
                ${isActive 
                  ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}
              `}
            >
              <item.icon size={22} className={isSidebarOpen ? '' : 'mx-auto'} />
              {isSidebarOpen && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50 space-y-4">
          {isSidebarOpen && (
            <div className="px-4 py-3 bg-slate-50 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 font-bold shadow-sm">
                {user?.usuario?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{user?.usuario}</p>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{user?.rol}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-all group"
          >
            <LogOut size={22} className={isSidebarOpen ? '' : 'mx-auto'} />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 flex justify-between items-center z-40">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
           <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">2</div>
                 <Bell size={24} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="h-10 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-3">
                 <div className="text-right">
                    <p className="text-sm font-black text-slate-800 leading-none mb-1">{user?.usuario}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: En Línea</p>
                 </div>
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm overflow-hidden">
                    <UserRound size={24} />
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Stethoscope, 
  Calendar, 
  Plus, 
  Settings, 
  ArrowRight,
  Command as CommandIcon
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'Navegación' | 'Acciones' | 'Búsqueda';
  roles: string[]; // Roles permitidos
  action: () => void;
}

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const commands: CommandItem[] = [
    {
      id: 'go-dashboard',
      title: 'Ir al Panel de Control',
      description: 'Ver resumen general y estadísticas',
      icon: <Settings size={18} />,
      category: 'Navegación',
      roles: ['ADMIN', 'SECRETARIA', 'ODONTOLOGO'],
      action: () => navigate('/'),
    },
    {
      id: 'go-pacientes',
      title: 'Ver Pacientes',
      description: 'Listado completo y registros médicos',
      icon: <User size={18} />,
      category: 'Navegación',
      roles: ['ADMIN', 'SECRETARIA'],
      action: () => navigate('/pacientes'),
    },
    {
      id: 'go-odontologos',
      title: 'Ver Odontólogos',
      description: 'Nómina de especialistas',
      icon: <Stethoscope size={18} />,
      category: 'Navegación',
      roles: ['ADMIN', 'SECRETARIA'],
      action: () => navigate('/odontologos'),
    },
    {
      id: 'go-turnos',
      title: 'Ver Agenda de Turnos',
      description: 'Calendario y citas diarias',
      icon: <Calendar size={18} />,
      category: 'Navegación',
      roles: ['ADMIN', 'SECRETARIA', 'ODONTOLOGO'],
      action: () => navigate('/turnos'),
    },
    {
      id: 'new-paciente',
      title: 'Registrar Nuevo Paciente',
      description: 'Dar de alta a un paciente en el sistema',
      icon: <Plus size={18} />,
      category: 'Acciones',
      roles: ['ADMIN', 'SECRETARIA'],
      action: () => navigate('/pacientes'),
    },
    {
      id: 'new-turno',
      title: 'Agendar Cita',
      description: 'Crear un nuevo turno en la agenda',
      icon: <Plus size={18} />,
      category: 'Acciones',
      roles: ['ADMIN', 'SECRETARIA'],
      action: () => navigate('/turnos'),
    },
  ];

  // Filtrar primero por rol y luego por búsqueda
  const filteredCommands = commands.filter(cmd => {
    const hasRole = cmd.roles.includes(user?.rol || '');
    const matchesQuery = cmd.title.toLowerCase().includes(query.toLowerCase()) ||
                         cmd.category.toLowerCase().includes(query.toLowerCase());
    return hasRole && matchesQuery;
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Search Input */}
        <div className="relative p-6 border-b border-slate-100 flex items-center gap-4">
          <Search className="text-primary-500" size={24} />
          <input 
            autoFocus
            type="text" 
            placeholder="¿Qué necesitas hacer? (Ej: 'Ver pacientes', 'Agendar')" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
          />
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-[10px] font-black text-slate-400">ESC</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {filteredCommands.length > 0 ? (
            <div className="space-y-6">
              {['Acciones', 'Navegación'].map(category => {
                const catCmds = filteredCommands.filter(c => c.category === category);
                if (catCmds.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{category}</h3>
                    <div className="space-y-1">
                      {catCmds.map(cmd => (
                        <button
                          key={cmd.id}
                          onClick={() => { cmd.action(); setIsOpen(false); }}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary-50 group transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-white group-hover:text-primary-500 shadow-sm transition-all">
                              {cmd.icon}
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 group-hover:text-primary-700">{cmd.title}</p>
                              <p className="text-xs text-slate-400 group-hover:text-primary-600/70">{cmd.description}</p>
                            </div>
                          </div>
                          <ArrowRight size={18} className="text-slate-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold italic">No encontramos lo que buscas... prueba con otras palabras.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><CommandIcon size={10} /> + K para abrir</span>
            <span className="flex items-center gap-1">↑↓ Navegar</span>
            <span className="flex items-center gap-1">Enter Ejecutar</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-primary-500/50">
            DENTAL-OS IA v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

import { useEffect, useState } from 'react';
import { TurnoService } from '../api/turnoService';
import type { Turno } from '../api/turnoService';
import { PacienteService } from '../api/pacienteService';
import { OdontologoService } from '../api/odontologoService';
import { useAuth } from '../store/AuthContext';
import { Calendar, Plus, Clock, User, Stethoscope, Trash2, X, Check, Search, AlertCircle, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const TurnosPage = () => {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [odontologos, setOdontologos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const today = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(today);

  // Nuevo estado para buscar en la agenda
  const [searchAgenda, setSearchAgenda] = useState('');

  // Funciones para navegar entre días
  const handlePrevDay = () => {
    setSearchAgenda(''); // Limpiar buscador al cambiar fecha
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    setSearchAgenda(''); // Limpiar buscador al cambiar fecha
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleDateChange = (newDate: string) => {
    setSearchAgenda(''); // Limpiar buscador al cambiar fecha manualmente
    setSelectedDate(newDate);
  };

  // Función para ir al día específico del turno al hacer clic en búsqueda global
  const handleTurnoClick = (fecha: string) => {
    if (searchAgenda) {
      setSelectedDate(fecha);
      setSearchAgenda('');
    }
  };

  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<any | null>(null);

  // Permisos: Admin y Secretaria pueden CREAR y BORRAR
  const canManage = user?.rol === 'ADMIN' || user?.rol === 'SECRETARIA';

  const [formData, setFormData] = useState({
    fecha_turno: today,
    hora_turno: '',
    afeccion: '',
    odontologoId: ''
  });

  // Lógica de filtrado en tiempo real de odontólogos disponibles
  const odontologosDisponibles = odontologos.filter(o => {
    if (!formData.hora_turno) return true; // Si no hay hora, mostramos todos inicialmente

    // 1. Validar si trabaja a esa hora
    if (o.unHorario) {
      if (formData.hora_turno < o.unHorario.horario_inicio || formData.hora_turno >= o.unHorario.horario_final) {
        return false;
      }
    } else {
      return false; // Si no tiene horario configurado, no está disponible
    }

    // 2. Validar si ya tiene un turno a esa misma hora y fecha
    const ocupado = turnos.some(t => 
      String(t.odonto?.id || t.odonto?.id_persona) === String(o.id || o.id_persona) &&
      t.fecha_turno === formData.fecha_turno &&
      t.hora_turno === formData.hora_turno
    );

    return !ocupado;
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      let tData: Turno[] = [];
      const [pData, oData] = await Promise.all([
        PacienteService.getAll().catch(() => []),
        OdontologoService.getAll().catch(() => [])
      ]);

      if (user?.rol === 'ODONTOLOGO') {
        const odonto = await OdontologoService.getByUserId(user.id_usuario);
        if (odonto) {
          tData = await TurnoService.getByOdontologo(odonto.id_persona || (odonto as any).id);
        } else {
          tData = [];
        }
      } else {
        tData = await TurnoService.getAll().catch(() => []);
      }

      setTurnos(tData);
      setPacientes(pData);
      setOdontologos(oData);
    } catch (error) {
      console.error("Error cargando agenda", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const odontologo = odontologos.find(o => 
      String(o.id_persona || o.id) === String(formData.odontologoId)
    );

    if (!selectedPaciente || !odontologo) {
      alert("Error: Por favor selecciona un paciente y un odontólogo de las sugerencias.");
      return;
    }

    try {
      // VALIDACIÓN FRONTEND DE HORARIO
      if (odontologo.unHorario) {
        const hTurno = formData.hora_turno;
        const hInicio = odontologo.unHorario.horario_inicio;
        const hFin = odontologo.unHorario.horario_final;
        
        if (hTurno < hInicio || hTurno >= hFin) {
          alert(`El Dr. ${odontologo.nombre} ${odontologo.apellido} atiende únicamente de ${hInicio} a ${hFin}. Por favor elige otro horario.`);
          return;
        }
      }

      await TurnoService.create({
        fecha_turno: formData.fecha_turno,
        hora_turno: formData.hora_turno,
        afeccion: formData.afeccion,
        paciente: selectedPaciente,
        odontologo: odontologo
      });
      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Error al guardar en el servidor. Verifica que el backend esté corriendo.");
    }
  };

  const resetForm = () => {
    setFormData({ ...formData, hora_turno: '', afeccion: '', odontologoId: '' });
    setSelectedPaciente(null);
    setPacienteSearch('');
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Confirmas la cancelación del turno?")) {
      await TurnoService.delete(id);
      await loadData();
    }
  };

  const turnosVisualizados = (turnos || [])
    .filter(t => {
      if (!searchAgenda) {
        // Modo Agenda: Solo hoy
        return t.fecha_turno === selectedDate;
      }
      // Modo Búsqueda Global: Ignorar fecha, buscar por texto
      const search = searchAgenda.toLowerCase();
      const pName = `${t.pacien?.nombre} ${t.pacien?.apellido}`.toLowerCase();
      const oName = `${t.odonto?.nombre} ${t.odonto?.apellido}`.toLowerCase();
      return pName.includes(search) || oName.includes(search);
    })
    .sort((a, b) => {
      // Ordenar por fecha y luego por hora para que los resultados de búsqueda tengan sentido
      const dateCompare = a.fecha_turno.localeCompare(b.fecha_turno);
      if (dateCompare !== 0) return dateCompare;
      return a.hora_turno.localeCompare(b.hora_turno);
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shrink-0"><Calendar size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Agenda {canManage ? 'Global' : 'Personal'}</h2>
            <p className="text-slate-500 text-sm">Gestionando citas para el día {selectedDate}.</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Barra de búsqueda en agenda */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar paciente/doctor..." 
              value={searchAgenda}
              onChange={(e) => setSearchAgenda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
            />
            <p className="absolute -bottom-5 left-1 text-[10px] text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap">
              <Info size={10} className="text-primary-400" /> Buscador global de todos los turnos del sistema
            </p>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={handlePrevDay}
              className="p-2.5 hover:bg-white text-slate-400 hover:text-primary-500 transition-colors border-r border-slate-200"
              title="Día Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => handleDateChange(e.target.value)} 
              className="px-4 py-2.5 bg-transparent outline-none font-bold text-slate-700 cursor-pointer text-center" 
            />
            <button 
              onClick={handleNextDay}
              className="p-2.5 hover:bg-white text-slate-400 hover:text-primary-500 transition-colors border-l border-slate-200"
              title="Día Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {canManage && (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all">
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Sincronizando...</div>
        ) : turnosVisualizados.length === 0 ? (
          <div className="p-20 text-center text-slate-400 font-medium">No hay turnos programados.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {turnosVisualizados.map((t) => (
              <div 
                key={t.id_turno} 
                onClick={() => handleTurnoClick(t.fecha_turno)}
                className={`p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-slate-50/50 transition-colors group border-l-4 border-transparent hover:border-primary-500 ${searchAgenda ? 'cursor-pointer' : ''}`}
              >
                <div className="flex flex-col items-center w-24 shrink-0">
                  <div className="text-2xl font-black text-slate-800 group-hover:text-primary-600 transition-colors leading-none">{t.hora_turno}</div>
                  {searchAgenda && (
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">
                      {t.fecha_turno}
                    </div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">{(t.pacien?.nombre || '?').charAt(0)}</div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Paciente</p>
                      <p className="font-bold text-slate-800">{t.pacien?.nombre} {t.pacien?.apellido}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">{(t.odonto?.nombre || '?').charAt(0)}</div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Doctor</p>
                      <p className="font-bold text-slate-800">Dr. {t.odonto?.nombre} {t.odonto?.apellido}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Motivo</p>
                    <p className="text-sm text-slate-600 italic">"{t.afeccion}"</p>
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => handleDelete(t.id_turno)} className="p-3 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Agendar Cita</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={formData.fecha_turno} onChange={e => setFormData({...formData, fecha_turno: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold" />
                <input type="time" required value={formData.hora_turno} onChange={e => setFormData({...formData, hora_turno: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold" />
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Buscar Paciente</label>
                {!selectedPaciente ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" value={pacienteSearch} onChange={e => setPacienteSearch(e.target.value)} placeholder="DNI o Apellido..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    {pacienteSearch.length > 1 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {pacientes.filter(p => p.dni.includes(pacienteSearch) || `${p.nombre} ${p.apellido}`.toLowerCase().includes(pacienteSearch.toLowerCase())).map(p => (
                          <div key={p.id_persona || p.id} onClick={() => { setSelectedPaciente(p); setPacienteSearch(''); }} className="p-4 hover:bg-primary-50 cursor-pointer border-b border-slate-50 last:border-0 text-left">
                            <p className="font-bold text-slate-800">{p.nombre} {p.apellido}</p>
                            <p className="text-xs text-slate-500">DNI: {p.dni}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl flex justify-between items-center animate-in zoom-in-95 duration-200">
                    <p className="font-bold text-primary-700">{selectedPaciente.nombre} {selectedPaciente.apellido}</p>
                    <button type="button" onClick={() => setSelectedPaciente(null)} className="text-primary-400 hover:text-rose-500"><X size={20} /></button>
                  </div>
                )}
              </div>

              <div className="text-left">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Especialista Disponible</label>
                <select 
                  required 
                  value={formData.odontologoId} 
                  onChange={e => setFormData({...formData, odontologoId: e.target.value})} 
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium ${odontologosDisponibles.length === 0 && formData.hora_turno ? 'border-rose-300 ring-2 ring-rose-100' : ''}`}
                >
                  <option value="">
                    {formData.hora_turno 
                      ? (odontologosDisponibles.length > 0 ? '-- Selecciona un profesional disponible --' : '-- No hay odontólogos disponibles a esta hora --')
                      : '-- Ingresa una hora para ver disponibles --'
                    }
                  </option>
                  {odontologosDisponibles.map(o => (
                    <option key={o.id || (o as any).id_persona} value={String(o.id || (o as any).id_persona)}>
                      Dr. {o.nombre} {o.apellido} ({o.unHorario.horario_inicio} - {o.unHorario.horario_final})
                    </option>
                  ))}
                </select>
                
                {formData.hora_turno && odontologosDisponibles.length === 0 && (
                  <p className="mt-2 text-[10px] text-rose-500 font-bold uppercase flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} /> No se encontraron profesionales libres para el horario de las {formData.hora_turno}
                  </p>
                )}

                {formData.odontologoId && (
                  <p className="mt-2 text-[10px] text-primary-600 font-bold uppercase tracking-tight flex items-center gap-1">
                    <Clock size={12} /> Jornada: {odontologos.find(o => String(o.id || (o as any).id_persona) === formData.odontologoId)?.unHorario.horario_inicio} a {odontologos.find(o => String(o.id || (o as any).id_persona) === formData.odontologoId)?.unHorario.horario_final}
                  </p>
                )}
              </div>

              <textarea rows={2} required value={formData.afeccion} onChange={e => setFormData({...formData, afeccion: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" placeholder="Motivo..."></textarea>
              <button type="submit" className="w-full py-4 bg-primary-500 text-white rounded-2xl font-bold hover:bg-primary-600 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"><Check size={20} /> Agendar Turno</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnosPage;

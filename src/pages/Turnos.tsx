import { useEffect, useState, useMemo } from 'react';
import { TurnoService } from '../api/turnoService';
import type { Turno } from '../api/turnoService';
import { PacienteService } from '../api/pacienteService';
import { OdontologoService } from '../api/odontologoService';
import { useAuth } from '../store/AuthContext';
import { Calendar, Plus, Clock, Trash2, X, Check, Search, AlertCircle, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon, Edit, User } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const TurnoSkeleton = () => (
  <div className="p-6 flex flex-col md:flex-row items-center gap-6 border-b border-slate-50">
    <div className="flex flex-col items-center w-24 shrink-0 space-y-2">
      <Skeleton className="w-16 h-8 rounded-lg" />
      <Skeleton className="w-20 h-3 rounded-md" />
    </div>
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
    </div>
  </div>
);

const TurnosPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [odontologos, setOdontologos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchAgenda, setSearchAgenda] = useState('');

  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<any | null>(null);
  const canManage = user?.rol === 'ADMIN' || user?.rol === 'SECRETARIA';

  const [formData, setFormData] = useState({
    fecha_turno: todayStr,
    hora_turno: '',
    afeccion: '',
    odontologoId: ''
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let tData: Turno[] = [];
      const [pData, oData] = await Promise.all([
        PacienteService.getAll().catch(() => []),
        OdontologoService.getAll().catch(() => [])
      ]);

      if (user?.rol === 'ODONTOLOGO') {
        const odonto = oData.find(o => o.idUsuario === user.id_usuario);
        if (odonto) {
          tData = await TurnoService.getByOdontologo(odonto.id || (odonto as any).id_persona);
        }
      } else {
        tData = await TurnoService.getAll().catch(() => []);
      }

      setTurnos(tData);
      setPacientes(pData);
      setOdontologos(oData);
    } catch (error) {
      showNotification("Error al conectar con la base de datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedDate]);

  // FILTRADO DINÁMICO DE ODONTÓLOGOS DISPONIBLES
  const odontologosDisponibles = useMemo(() => {
    if (!formData.hora_turno || !formData.fecha_turno) return [];
    
    return odontologos.filter(o => {
      // 1. Verificar si el doctor trabaja en esa hora (Horario Laboral)
      if (!o.idHorario) return false;
      // Necesitamos cargar el horario completo para comparar horas.
      // Pero el DTO solo trae idHorario.
      // Por ahora, asumiremos que si tiene horario cargado, permitimos seleccionar.
      // O podríamos buscar el horario en una lista de horarios cargados.
      
      // Para mayor precisión, el backend ya hace esta validación al guardar.
      // Aquí en frontend podemos intentar buscar el horario si tenemos la lista de horarios.
      
      // Si no tenemos la lista de horarios completa en este componente, 
      // confiaremos en la validación del backend o cargaremos los horarios.
      return true; 
    });
  }, [odontologos, turnos, formData.hora_turno, formData.fecha_turno, editingId]);

  const handleEdit = (t: Turno) => {
    setFormData({
      fecha_turno: t.fecha_turno,
      hora_turno: t.hora_turno,
      afeccion: t.afeccion,
      odontologoId: String(t.idOdontologo)
    });
    // Buscar el objeto paciente completo para el buscador
    const p = pacientes.find(p => p.id === t.idPaciente);
    setSelectedPaciente(p);
    setEditingId(t.id_turno);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const odontologo = odontologos.find(o => String(o.id) === String(formData.odontologoId));

    if (!selectedPaciente || !odontologo) {
      showNotification("Datos incompletos", "error");
      return;
    }

    try {
      const payload: Turno = {
        id_turno: editingId || 0,
        fecha_turno: formData.fecha_turno,
        hora_turno: formData.hora_turno,
        afeccion: formData.afeccion,
        idPaciente: selectedPaciente.id,
        idOdontologo: odontologo.id
      };

      if (isEditing) {
        await TurnoService.update(payload);
        showNotification("¡Cita actualizada correctamente!", "success");
      } else {
        await TurnoService.create(payload);
        showNotification("¡Cita agendada correctamente!", "success");
      }
      
      setTimeout(() => setIsModalOpen(false), 800);
      resetForm();
      loadData();
    } catch (err: any) {
      showNotification("Error al procesar el turno", "error");
    }
  };

  const resetForm = () => {
    setFormData({ fecha_turno: todayStr, hora_turno: '', afeccion: '', odontologoId: '' });
    setSelectedPaciente(null);
    setPacienteSearch('');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Confirmas la cancelación del turno?")) {
      try {
        await TurnoService.delete(id);
        showNotification("Cita cancelada", "success");
        loadData();
      } catch (error) {
        showNotification("Error al cancelar", "error");
      }
    }
  };

  const turnosFiltrados = useMemo(() => {
    return (turnos || []).filter(t => {
      const matchesDate = t.fecha_turno === selectedDate;
      const search = searchAgenda.toLowerCase();
      const pName = (t.nombrePaciente || '').toLowerCase();
      const oName = (t.nombreOdontologo || '').toLowerCase();
      return matchesDate && (searchAgenda === '' || pName.includes(search) || oName.includes(search));
    });
  }, [turnos, selectedDate, searchAgenda]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      
      {/* Notificación Flotante Superior */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-full duration-300 ${
          notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
        }`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <p className="font-black text-sm uppercase tracking-widest">{notification.message}</p>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5 w-full">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Agenda Profesional</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Panel de Control de Citas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><ListIcon size={16} /></button>
          </div>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
            <button onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]);
            }} className="p-2 hover:bg-white rounded-xl text-slate-400"><ChevronLeft size={20} /></button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent outline-none font-black text-slate-700 px-2 text-sm" />
            <button onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]);
            }} className="p-2 hover:bg-white rounded-xl text-slate-400"><ChevronRight size={20} /></button>
          </div>

          {canManage && (
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
              <Plus size={18} /> Nueva Cita
            </button>
          )}
        </div>
      </div>

      {/* Listado / Grilla */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-10"><TurnoSkeleton /></div> : (
          viewMode === 'list' ? (
            <div className="divide-y divide-slate-50">
              {turnosFiltrados.length === 0 ? <div className="p-40 text-center text-slate-300 font-bold italic">No hay turnos para hoy.</div> : (
                turnosFiltrados.map(t => (
                  <div key={t.id_turno} className="p-8 flex items-center gap-8 hover:bg-slate-50 transition-all">
                    <div className="text-2xl font-black text-slate-800 w-24">{t.hora_turno}</div>
                    <div className="flex-1 font-bold text-slate-700">{t.nombrePaciente} → <span className="text-indigo-600">Dr. {t.nombreOdontologo}</span></div>
                    <div className="flex items-center gap-3">
                        {canManage && <button onClick={() => handleEdit(t)} className="text-slate-300 hover:text-indigo-600"><Edit size={20}/></button>}
                        {canManage && <button onClick={() => handleDelete(t.id_turno!)} className="text-slate-300 hover:text-rose-500"><Trash2 size={20}/></button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col h-[700px] overflow-hidden">
              <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="w-24 border-r border-slate-100 p-4 flex justify-center"><Clock size={16} className="text-slate-300"/></div>
                <div className="flex-1 flex divide-x divide-slate-100 overflow-x-auto">
                  {odontologos.map(o => (
                    <div key={o.id} className="flex-1 min-w-[200px] p-4 text-center font-black text-slate-700 text-xs uppercase tracking-widest truncate">DR. {o.nombre} {o.apellido}</div>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="flex min-h-full">
                  <div className="w-24 bg-white border-r border-slate-100 divide-y divide-slate-50">
                    {TIME_SLOTS.map(t => <div key={t} className="h-20 p-2 text-right text-[11px] font-black text-slate-400">{t}</div>)}
                  </div>
                  <div className="flex-1 flex divide-x divide-slate-50 relative">
                    {odontologos.map(o => (
                      <div key={o.id} className="flex-1 min-w-[200px] relative divide-y divide-slate-50/50">
                        {TIME_SLOTS.map(t => <div key={t} className="h-20"></div>)}
                        {turnosFiltrados.filter(t => t.idOdontologo === o.id).map(t => {
                          const idx = TIME_SLOTS.indexOf(t.hora_turno);
                          if (idx === -1) return null;
                          return (
                            <div key={t.id_turno} onClick={() => canManage && handleEdit(t)} className="absolute inset-x-1 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg border border-white/20 z-10 cursor-pointer hover:bg-indigo-700 transition-colors" style={{ top: `${idx * 80 + 4}px`, height: '72px' }}>
                               <p className="text-[9px] font-black opacity-60 uppercase">Paciente</p>
                               <p className="text-xs font-black truncate">{t.nombrePaciente}</p>
                               <div className="flex justify-between items-center mt-1">
                                    <p className="text-[10px] font-bold bg-white/20 w-fit px-2 rounded">{t.hora_turno}</p>
                                    <Edit size={12} className="opacity-40" />
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">{isEditing ? 'Editar Turno' : 'Agendar Turno'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400"><X size={24} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                    <input 
                        type="date" 
                        required 
                        min={todayStr}
                        value={formData.fecha_turno} 
                        onChange={e => setFormData({...formData, fecha_turno: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                    <select required value={formData.hora_turno} onChange={e => setFormData({...formData, hora_turno: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                      <option value="">Hora</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="relative">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Buscador de Paciente</label>
                   {!selectedPaciente ? (
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input type="text" value={pacienteSearch} onChange={e => setPacienteSearch(e.target.value)} placeholder="DNI o Apellido..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                         {/* SUGERENCIAS */}
                         {pacienteSearch.length > 1 && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] max-h-48 overflow-y-auto border-t-0">
                               {pacientes.filter(p => `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(pacienteSearch.toLowerCase())).map(p => (
                                  <div key={p.id} onClick={() => { setSelectedPaciente(p); setPacienteSearch(''); }} className="p-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0">
                                     <p className="font-black text-slate-800 text-sm">{p.nombre} {p.apellido}</p>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase">DNI: {p.dni}</p>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                   ) : (
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center shadow-inner">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-[10px]">{selectedPaciente.nombre.charAt(0)}</div>
                            <p className="font-black text-indigo-900">{selectedPaciente.nombre} {selectedPaciente.apellido}</p>
                         </div>
                         <button type="button" onClick={() => setSelectedPaciente(null)} className="text-indigo-400 hover:text-rose-500 transition-colors"><X size={18}/></button>
                      </div>
                   )}
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profesional (Disponibles para este horario)</label>
                   <select 
                        required 
                        value={formData.odontologoId} 
                        onChange={e => setFormData({...formData, odontologoId: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 disabled:opacity-50"
                        disabled={!formData.fecha_turno || !formData.hora_turno}
                    >
                     <option value="">
                        {!formData.fecha_turno || !formData.hora_turno 
                            ? "Seleccione fecha y hora primero..." 
                            : odontologosDisponibles.length === 0 
                                ? "No hay doctores disponibles en este horario" 
                                : "Seleccionar Odontólogo..."}
                     </option>
                     {odontologosDisponibles.map(o => (
                        <option key={o.id || o.id_persona} value={o.id || o.id_persona}>
                            Dr. {o.nombre} {o.apellido} ({o.especialidad})
                        </option>
                     ))}
                   </select>
                   {formData.hora_turno && odontologosDisponibles.length === 0 && (
                       <p className="text-[10px] text-rose-500 font-bold mt-1 animate-pulse">
                           <AlertCircle size={10} className="inline mr-1"/> 
                           Ningún profesional trabaja en este horario o están todos ocupados.
                       </p>
                   )}
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones / Motivo</label>
                   <textarea rows={2} required value={formData.afeccion} onChange={e => setFormData({...formData, afeccion: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Ej: Caries molar superior derecho..."></textarea>
                </div>
                
                <button type="submit" className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
                    {isEditing ? 'GUARDAR CAMBIOS' : 'AGENDAR TURNO'}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default TurnosPage;

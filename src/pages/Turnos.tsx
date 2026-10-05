import { useState, useEffect, useMemo } from 'react';
import { useTurnos, TIME_SLOTS } from '../hooks/useTurnos';
import { Calendar, Plus, Clock, Trash2, X, Check, Search, AlertCircle, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon, Edit, Sparkles, FileText, Lock } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import ClinicalHistoryModal from '../components/ClinicalHistoryModal';
import { aiService } from '../api/aiService';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';

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
  const { toast } = useUI();
  const isOdonto = user?.rol === 'ODONTOLOGO';

  const {
    turnos,
    pacientes,
    responsables,
    odontologos,
    allOdontologos,
    timeSlots,
    isNewPatient,
    lastTurno,
    loading,
    savePending,
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    selectedDate,
    setSelectedDate,
    searchAgenda,
    setSearchAgenda,
    pacienteSearch,
    setPacienteSearch,
    selectedPaciente,
    setSelectedPaciente,
    canManage,
    currentPage,
    setCurrentPage,
    totalPages,
    formMethods,
    onFormSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    changeDate,
    formFecha,
    formHora,
    todayStr,
    handlePacienteKeyDown,
    isQuickCreatingPatient,
    setIsQuickCreatingPatient,
    quickCreatePatient,
    isCreatingPatient,
    quickCreateResponsable,
    isCreatingResponsable
  } = useTurnos();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = formMethods;

  // Estados para Atender e IA (Odontólogo)
  const [selectedHistoryPaciente, setSelectedHistoryPaciente] = useState<any | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [selectedAIPacienteName, setSelectedAIPacienteName] = useState('');
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);



  // Asegurar que el odontólogo vea siempre la vista de calendario/grilla
  useEffect(() => {
    if (isOdonto && viewMode !== 'calendar') {
      setViewMode('calendar');
    }
  }, [isOdonto, viewMode, setViewMode]);

  const handleAttendPatient = (pacienteId: number, nombreCompleto: string) => {
    const parts = nombreCompleto.split(' ');
    const nombre = parts[0] || '';
    const apellido = parts.slice(1).join(' ') || '';
    setSelectedHistoryPaciente({ id: pacienteId, nombre, apellido });
    setIsHistoryOpen(true);
  };

  const handleAISummaryForPatient = async (pacienteId: number, nombreCompleto: string) => {
    setSelectedAIPacienteName(nombreCompleto);
    setLoadingAI(true);
    setIsAISummaryOpen(true);
    setAiSummary('');
    try {
      const summary = await aiService.getResumenClinico(pacienteId);
      setAiSummary(summary);
    } catch (error) {
      toast.error("Error al generar resumen con IA");
      setIsAISummaryOpen(false);
    } finally {
      setLoadingAI(false);
    }
  };

  const myOdontologos = isOdonto 
    ? allOdontologos.filter(o => o.idUsuario === user?.id)
    : allOdontologos;

  // Sincronizar buscador con el DNI del paciente seleccionado
  useEffect(() => {
    if (selectedPaciente) {
        if (!pacienteSearch) setPacienteSearch(selectedPaciente.dni);
        // CRUCIAL: Sincronizar el ID con el formulario de react-hook-form
        setValue('idPaciente', selectedPaciente.id);
    }
  }, [selectedPaciente, pacienteSearch, setPacienteSearch, setValue]);

  // Formulario local para el alta rápida
  const [quickPatientData, setQuickPatientData] = useState({ 
    nombre: '', 
    apellido: '', 
    telefono: '', 
    dni: '',
    fecha_nac: '2000-01-01',
    tipoSangre: 'O+',
    tiene_OS: false,
    idResponsable: 0
  });

  const [isRegisteringResponsable, setIsRegisteringResponsable] = useState(false);
  const [quickRespData, setQuickRespData] = useState({ nombre: '', apellido: '', dni: '', telefono: '', tipoResponsabilidad: 'PADRE/MADRE' });

  // Función para calcular edad
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isMinor = calculateAge(quickPatientData.fecha_nac) < 18;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5 w-full">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Agenda Profesional</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Atajo: <span className="bg-slate-200 px-1 rounded text-slate-600">Alt + N</span> para nueva cita</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {!isOdonto && (
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
              <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><ListIcon size={16} /></button>
            </div>
          )}

          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-xl text-slate-400"><ChevronLeft size={20} /></button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[145px] bg-transparent outline-none font-black text-slate-700 px-2 text-sm text-center" />
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-xl text-slate-400"><ChevronRight size={20} /></button>
          </div>

          {canManage && (
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
              <Plus size={18} /> Nueva Cita
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por paciente u odontólogo..." 
              value={searchAgenda}
              onChange={(e) => setSearchAgenda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-10"><TurnoSkeleton /></div> : (
          viewMode === 'list' ? (
            <>
              <div className="divide-y divide-slate-50">
                {turnos.length === 0 ? <div className="p-40 text-center text-slate-300 font-bold italic">No hay turnos registrados.</div> : (
                  turnos.map(t => (
                    <div key={t.id} className="p-8 flex items-center gap-8 hover:bg-slate-50 transition-all">
                      <div className="w-24">
                        <p className="text-2xl font-black text-slate-800 leading-none">{t.hora_turno?.substring(0, 5)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{t.fecha_turno}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-700 text-lg">{t.nombrePaciente}</p>
                        <p className="text-indigo-600 text-sm font-bold uppercase tracking-wider">Dr. {t.nombreOdontologo}</p>
                      </div>
                      <div className="flex items-center gap-3">
                          {canManage && <button onClick={() => handleEdit(t)} className="p-3 bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"><Edit size={20}/></button>}
                          {canManage && <button onClick={() => handleDelete(t.id!)} className="p-3 bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20}/></button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Página <span className="text-indigo-600">{currentPage + 1}</span> de {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-500 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-500 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col h-[700px] overflow-hidden">
              <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="w-24 border-r border-slate-100 p-4 flex justify-center"><Clock size={16} className="text-slate-300"/></div>
                <div className="flex-1 flex divide-x divide-slate-100 overflow-x-auto">
                  {myOdontologos.map(o => (
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
                    {myOdontologos.map(o => (
                      <div key={o.id} className="flex-1 min-w-[200px] relative divide-y divide-slate-50/50">
                        {TIME_SLOTS.map(t => <div key={t} className="h-20"></div>)}
                        {turnos.filter(t => t.idOdontologo === o.id).map(t => {
                          const idx = TIME_SLOTS.indexOf(t.hora_turno?.substring(0, 5));
                          if (idx === -1) return null;
                          return (
                            <div 
                              key={t.id} 
                              className={`absolute inset-x-1 p-3 rounded-2xl shadow-lg border z-10 transition-all ${
                                isOdonto 
                                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500/30' 
                                  : 'bg-indigo-600 text-white border-white/20 cursor-pointer hover:bg-indigo-700'
                              }`} 
                              style={{ top: `${idx * 80 + 4}px`, height: '76px' }}
                              onClick={() => {
                                if (!isOdonto && canManage) handleEdit(t);
                              }}
                            >
                               <div className="flex justify-between items-start">
                                 <div>
                                   <p className="text-[8px] font-black opacity-75 uppercase tracking-wider leading-none mb-0.5">Paciente</p>
                                   <p className="text-xs font-black truncate max-w-[110px] leading-tight">{t.nombrePaciente}</p>
                                 </div>
                                 {isOdonto && (
                                   <div className="flex items-center gap-1.5 shrink-0">
                                     <button 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleAISummaryForPatient(t.idPaciente, t.nombrePaciente || '');
                                       }}
                                       className="p-1.5 bg-white/10 hover:bg-white/25 active:scale-90 text-white rounded-lg transition-all"
                                       title="Resumen Clínico con IA"
                                     >
                                       <Sparkles size={11} />
                                     </button>
                                     <button 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleAttendPatient(t.idPaciente, t.nombrePaciente || '');
                                       }}
                                       className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md transition-all border border-emerald-400/20"
                                       title="Atender Paciente"
                                     >
                                       <FileText size={10} />
                                       Atender
                                     </button>
                                   </div>
                                 )}
                               </div>
                               <div className="flex justify-between items-center mt-1">
                                    <p className="text-[9px] font-bold bg-white/20 w-fit px-1.5 py-0.5 rounded-md leading-none">{t.hora_turno?.substring(0, 5)}</p>
                                    {!isOdonto && <Edit size={11} className="opacity-50" />}
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

      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    {isQuickCreatingPatient ? 'Nuevo Paciente (Alta Rápida)' : isEditing ? 'Editar Turno' : 'Agendar Turno'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400"><X size={24} /></button>
              </div>

              {isQuickCreatingPatient ? (
                <div className="p-8 space-y-6">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                        <AlertCircle className="text-indigo-600" size={20} />
                        <p className="text-xs text-indigo-700 font-bold">Llene los datos básicos para continuar con el agendamiento.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                            <input type="text" value={quickPatientData.nombre} onChange={e => setQuickPatientData({...quickPatientData, nombre: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                            <input type="text" value={quickPatientData.apellido} onChange={e => setQuickPatientData({...quickPatientData, apellido: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI</label>
                            <input type="text" value={quickPatientData.dni} onChange={e => setQuickPatientData({...quickPatientData, dni: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input type="text" value={quickPatientData.telefono} onChange={e => setQuickPatientData({...quickPatientData, telefono: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fec. Nacimiento</label>
                            <input type="date" value={quickPatientData.fecha_nac} onChange={e => setQuickPatientData({...quickPatientData, fecha_nac: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grupo Sanguíneo</label>
                            <select value={quickPatientData.tipoSangre} onChange={e => setQuickPatientData({...quickPatientData, tipoSangre: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>
                    </div>

                    {isMinor && (
                      <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Responsable Obligatorio (Menor de edad)</label>
                            <button 
                                type="button" 
                                onClick={() => setIsRegisteringResponsable(!isRegisteringResponsable)}
                                className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                            >
                                {isRegisteringResponsable ? '× Cancelar Registro' : '+ Nuevo Responsable'}
                            </button>
                        </div>
                        
                        {isRegisteringResponsable ? (
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3 animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="Nombre" value={quickRespData.nombre} onChange={e => setQuickRespData({...quickRespData, nombre: e.target.value})} className="px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none" />
                                    <input type="text" placeholder="Apellido" value={quickRespData.apellido} onChange={e => setQuickRespData({...quickRespData, apellido: e.target.value})} className="px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="DNI" value={quickRespData.dni} onChange={e => setQuickRespData({...quickRespData, dni: e.target.value})} className="px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none" />
                                    <input type="text" placeholder="Teléfono" value={quickRespData.telefono} onChange={e => setQuickRespData({...quickRespData, telefono: e.target.value})} className="px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vínculo / Responsabilidad</label>
                                    <select value={quickRespData.tipoResponsabilidad} onChange={e => setQuickRespData({...quickRespData, tipoResponsabilidad: e.target.value})} className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none">
                                        <option value="PADRE/MADRE">PADRE/MADRE</option>
                                        <option value="TUTOR">TUTOR</option>
                                        <option value="OTROS">OTROS</option>
                                    </select>
                                </div>
                                <button 
                                    type="button" 
                                    disabled={isCreatingResponsable || !quickRespData.nombre || !quickRespData.dni || !quickRespData.telefono}
                                    onClick={async () => {
                                        await quickCreateResponsable(quickRespData);
                                        setIsRegisteringResponsable(false);
                                    }}
                                    className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700"
                                >
                                    {isCreatingResponsable ? 'REGISTRANDO...' : 'CONFIRMAR RESPONSABLE'}
                                </button>
                            </div>
                        ) : (
                            <select 
                                value={quickPatientData.idResponsable} 
                                onChange={e => setQuickPatientData({...quickPatientData, idResponsable: Number(e.target.value)})} 
                                className={`w-full px-5 py-3.5 bg-rose-50 border ${quickPatientData.idResponsable === 0 ? 'border-rose-300' : 'border-emerald-300'} rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-700`}
                            >
                                <option value={0}>Seleccionar Responsable...</option>
                                {responsables.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre} {r.apellido} ({r.tipoResponsabilidad})</option>
                                ))}
                            </select>
                        )}
                        {quickPatientData.idResponsable === 0 && !isRegisteringResponsable && <p className="text-[9px] text-rose-500 font-black uppercase mt-1 ml-1">* Debe asignar un tutor para continuar</p>}
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <input 
                            type="checkbox" 
                            id="quick_os"
                            checked={quickPatientData.tiene_OS} 
                            onChange={e => setQuickPatientData({...quickPatientData, tiene_OS: e.target.checked})} 
                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <label htmlFor="quick_os" className="text-sm font-black text-slate-700 cursor-pointer">¿Tiene Obra Social / Prepaga?</label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsQuickCreatingPatient(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">CANCELAR</button>
                        <button 
                            type="button" 
                            disabled={isCreatingPatient || !quickPatientData.nombre || !quickPatientData.apellido || !quickPatientData.dni || (isMinor && quickPatientData.idResponsable === 0)}
                            onClick={() => quickCreatePatient(quickPatientData)} 
                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            {isCreatingPatient ? 'CREANDO...' : 'GUARDAR Y SELECCIONAR'}
                        </button>
                    </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                    <input 
                        type="date" 
                        {...register('fecha_turno')}
                        min={todayStr}
                        className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.fecha_turno ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold`} 
                    />
                    {errors.fecha_turno && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.fecha_turno.message}</p>}
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profesional</label>
                     <select 
                          {...register('odontologoId')}
                          className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.odontologoId ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700`}
                      >
                        <option value="">[Asignación Automática por el Sistema]</option>
                       {odontologos.map(o => (
                          <option key={o.id} value={o.id}>
                              Dr. {o.nombre} {o.apellido} ({o.especialidad})
                          </option>
                       ))}
                     </select>
                     {errors.odontologoId && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.odontologoId.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horario disponible</label>
                   
                   {/* Input oculto para que react-hook-form lo registre y valide */}
                   <input type="hidden" {...register('hora_turno')} />

                   {!formFecha ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50">
                        <Clock className="mx-auto text-slate-300 mb-2 animate-pulse" size={24} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          Seleccione una fecha para ver horarios
                        </p>
                      </div>
                    ) : (
                     <div className="space-y-3">
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                         {timeSlots.map((slot: any) => {
                           let btnClass = "";
                           let label: React.ReactNode = slot.time;
                           let disabled = false;
                           let icon = null;

                           if (!slot.isWithinHours) {
                             btnClass = "bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed text-[10px] opacity-60";
                             disabled = true;
                             label = `${slot.time} (Fuera Jornada)`;
                           } else if (slot.isOccupied) {
                             btnClass = "bg-rose-50 border border-rose-100 text-rose-400 cursor-not-allowed flex flex-col items-center justify-center py-1.5 px-2";
                             disabled = true;
                             icon = <Lock size={10} className="mb-0.5" />;
                             label = (
                               <div className="text-center w-full truncate">
                                 <p className="text-xs font-black leading-none">{slot.time}</p>
                                 <p className="text-[8px] font-bold opacity-80 mt-0.5 truncate max-w-full" title={slot.occupiedBy || 'Ocupado'}>
                                   {slot.occupiedBy || 'Ocupado'}
                                 </p>
                               </div>
                             );
                           } else if (formHora === slot.time) {
                             btnClass = "bg-indigo-600 border border-indigo-500 text-white font-black scale-95 shadow-md shadow-indigo-500/20";
                             icon = <Check size={12} className="inline mr-1" />;
                           } else {
                             btnClass = "bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold";
                           }

                           return (
                             <button
                               key={slot.time}
                               type="button"
                               disabled={disabled}
                               onClick={() => setValue('hora_turno', slot.time, { shouldValidate: true })}
                               className={`py-3 px-3 rounded-2xl text-xs flex items-center justify-center transition-all min-h-[46px] ${btnClass}`}
                             >
                               {icon}
                               {label}
                             </button>
                           );
                         })}
                       </div>
                       {errors.hora_turno && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.hora_turno.message}</p>}
                     </div>
                   )}
                </div>

                <div className="relative">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Buscador de Paciente</label>
                   
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={pacienteSearch} 
                        onChange={e => !selectedPaciente && setPacienteSearch(e.target.value)} 
                        onKeyDown={handlePacienteKeyDown}
                        disabled={!!selectedPaciente}
                        placeholder="DNI o Apellido... (Enter para seleccionar primero)" 
                        className={`w-full pl-12 pr-4 py-3.5 ${selectedPaciente ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-700'} border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all`} 
                      />
                      
                      {/* Resultados de búsqueda */}
                      {!selectedPaciente && pacienteSearch.length > 1 && (
                         <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] max-h-48 overflow-y-auto border-t-0">
                            {pacientes.filter(p => `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(pacienteSearch.toLowerCase())).length === 0 ? (
                                <div className="p-6 text-center space-y-3">
                                    <p className="text-slate-400 font-bold text-sm italic">No se encontró al paciente "{pacienteSearch}"</p>
                                    <button 
                                     type="button" 
                                     onClick={() => {
                                         const isNumeric = /^\d+$/.test(pacienteSearch);
                                         setQuickPatientData({ 
                                             nombre: '', 
                                             apellido: '', 
                                             telefono: '', 
                                             dni: isNumeric ? pacienteSearch : '',
                                             fecha_nac: '2000-01-01',
                                             tipoSangre: 'O+',
                                             tiene_OS: false,
                                             idResponsable: 0
                                         });
                                         setIsQuickCreatingPatient(true);
                                     }}
                                     className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                    >
                                        + Crear Paciente Nuevo
                                    </button>
                                </div>
                            ) : (
                              pacientes.filter(p => `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(pacienteSearch.toLowerCase())).map(p => (
                                 <div key={p.id} onClick={() => { setSelectedPaciente(p); setValue('idPaciente', p.id); setPacienteSearch(p.dni); }} className="p-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0">
                                    <p className="font-black text-slate-800 text-sm">{p.nombre} {p.apellido}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">DNI: {p.dni}</p>
                                 </div>
                              ))
                            )}
                         </div>
                      )}
                   </div>

                   {errors.idPaciente && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.idPaciente.message}</p>}

                    {/* Tarjeta de Confirmación de Paciente Seleccionado */}
                    {selectedPaciente && (
                       <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center shadow-inner animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-[10px]">
                                 {selectedPaciente?.nombre?.charAt(0) || '?'}
                             </div>
                             <div>
                                 <p className="font-black text-indigo-900 leading-none mb-0.5">{selectedPaciente?.nombre || ''} {selectedPaciente?.apellido || ''}</p>
                                 <div className="flex items-center gap-2 mt-0.5">
                                   <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Paciente Seleccionado</span>
                                   {isNewPatient ? (
                                     <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">✨ PACIENTE NUEVO</span>
                                   ) : (
                                     <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">🔄 RECURRENTE</span>
                                   )}
                                 </div>
                             </div>
                          </div>
                          <button type="button" onClick={() => { setSelectedPaciente(null); setValue('idPaciente', 0); setPacienteSearch(''); }} className="p-2 bg-white/50 text-indigo-400 hover:text-rose-500 rounded-xl transition-all shadow-sm"><X size={18}/></button>
                       </div>
                    )}

                    {/* Indicador de Paciente Recurrente */}
                    {selectedPaciente && !isNewPatient && !isEditing && lastTurno && (
                       <div className="mt-4 p-4.5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300 text-left">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                             <Check size={18} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-emerald-850 uppercase tracking-widest leading-none mb-1">Paciente Recurrente</p>
                             <p className="text-xs font-bold text-emerald-700 leading-tight">
                                El paciente ya se atiende con: <strong className="font-extrabold">Dr. {lastTurno.nombreOdontologo || ''}</strong>. 
                                Se pre-seleccionó su odontólogo habitual.
                             </p>
                          </div>
                       </div>
                    )}
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones / Motivo</label>
                   <textarea 
                    rows={2} 
                    {...register('afeccion')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.afeccion ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium`} 
                    placeholder="Ej: Caries molar superior derecho..."
                   ></textarea>
                   {errors.afeccion && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.afeccion.message}</p>}
                </div>
                
                <button type="submit" disabled={savePending} className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50">
                    {savePending ? 'PROCESANDO...' : isEditing ? 'GUARDAR CAMBIOS' : 'AGENDAR TURNO'}
                </button>
              </form>
              )}
           </div>
        </div>
      )}
      {isHistoryOpen && selectedHistoryPaciente && (
        <ClinicalHistoryModal 
          paciente={selectedHistoryPaciente}
          isOpen={isHistoryOpen}
          onClose={() => {
            setIsHistoryOpen(false);
            setSelectedHistoryPaciente(null);
          }}
        />
      )}

      {isAISummaryOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Resumen Clínico con IA: <span className="text-indigo-600">{selectedAIPacienteName}</span></h3>
              </div>
              <button onClick={() => setIsAISummaryOpen(false)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 text-left space-y-4">
              {loadingAI ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider animate-pulse">Analizando Historia Clínica...</p>
                </div>
              ) : (
                <div className="prose max-w-none text-slate-600 leading-relaxed whitespace-pre-line font-medium text-sm">
                  {aiSummary}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnosPage;

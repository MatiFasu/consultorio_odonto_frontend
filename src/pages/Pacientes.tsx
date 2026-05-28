import { usePacientes } from '../hooks/usePacientes';
import { Search, UserPlus, Trash2, Edit, X, Check, Droplet, CreditCard, AlertCircle, FileText, Wallet, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import ClinicalHistoryModal from '../components/ClinicalHistoryModal';
import BillingModal from '../components/BillingModal';

const PacientesPage = () => {
  const {
    pacientes,
    responsables,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    isMinor,
    formMethods,
    isOdonto,
    isHistoryOpen,
    setIsHistoryOpen,
    selectedPaciente,
    setSelectedPaciente,
    isBillingOpen,
    setIsBillingOpen,
    selectedBillingPaciente,
    setSelectedBillingPaciente,
    isAISummaryOpen,
    setIsAISummaryOpen,
    aiSummary,
    loadingAI,
    onSubmit,
    handleEdit,
    handleDelete,
    handleAISummary,
    resetForm
  } = usePacientes();

  const { register, handleSubmit, formState: { errors } } = formMethods;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellido o DNI..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
        {!isOdonto && (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95 w-full md:w-auto justify-center"
          >
            <UserPlus size={20} />
            Nuevo Paciente
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-5">Paciente</th>
                <th className="px-6 py-5">DNI / ID</th>
                <th className="px-6 py-5">Contacto</th>
                <th className="px-6 py-5">Información Médica</th>
                <th className="px-6 py-5 text-right pr-10">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : pacientes.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold italic">No hay registros que coincidan...</td></tr>
              ) : (
                pacientes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-sm">
                          {p.nombre.charAt(0)}{p.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-none mb-1">{p.nombre} {p.apellido}</p>
                          <p className="text-xs text-slate-500">{p.direccion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-600">{p.dni}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-600 font-medium">{p.telefono}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${p.tiene_OS ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          <CreditCard size={12} />
                          {p.tiene_OS ? 'CON OBRA SOCIAL' : 'PARTICULAR'}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">
                          <Droplet size={12} />
                          {p.tipoSangre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right pr-8">
                      <div className="flex justify-end items-center gap-3">
                        {isOdonto ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAISummary(p)}
                              className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Resumen con IA"
                            >
                              <Sparkles size={18} />
                            </button>
                            <button 
                              onClick={() => { setSelectedPaciente(p); setIsHistoryOpen(true); }}
                              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                              <FileText size={14} /> Atender
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAISummary(p)}
                              className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Resumen con IA"
                            >
                              <Sparkles size={18} />
                            </button>
                            <button 
                              onClick={() => { setSelectedPaciente(p); setIsHistoryOpen(true); }}
                              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Historia Clínica"
                            >
                              <FileText size={18} />
                            </button>
                          </div>
                        )}
                        
                        {!isOdonto && (
                          <>
                            <button 
                              onClick={() => { setSelectedBillingPaciente(p); setIsBillingOpen(true); }}
                              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Facturación y Pagos"
                            >
                              <Wallet size={18} />
                            </button>
                            <button 
                              onClick={() => handleEdit(p)}
                              className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(p.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 0 && (
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-bold">
              Página <span className="text-primary-600">{currentPage + 1}</span> de <span className="text-slate-800">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-primary-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-primary-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPaciente && (
        <ClinicalHistoryModal 
          paciente={selectedPaciente}
          isOpen={isHistoryOpen}
          onClose={() => { setIsHistoryOpen(false); setSelectedPaciente(null); }}
        />
      )}

      {selectedBillingPaciente && (
        <BillingModal 
          paciente={selectedBillingPaciente}
          isOpen={isBillingOpen}
          onClose={() => { setIsBillingOpen(false); setSelectedBillingPaciente(null); }}
        />
      )}

      {isAISummaryOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Resumen Inteligente</h2>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{selectedPaciente?.nombre} {selectedPaciente?.apellido}</p>
                </div>
              </div>
              <button onClick={() => setIsAISummaryOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              {loadingAI ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-medium animate-pulse">Analizando historial clínico...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm italic">
                    {aiSummary}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                    Generado automáticamente por IA basándose en registros previos
                  </p>
                </div>
              )}
              
              <div className="mt-8">
                <button 
                  onClick={() => setIsAISummaryOpen(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/90 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? 'Editar Paciente' : 'Alta de Paciente'}</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                  <input 
                    type="text" 
                    {...register('nombre')}
                    placeholder="Ej. Juan" 
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.nombre ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.nombre && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.nombre.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                  <input 
                    type="text" 
                    {...register('apellido')}
                    placeholder="Ej. Pérez" 
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.apellido ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.apellido && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.apellido.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">DNI</label>
                  <input 
                    type="text" 
                    {...register('dni')}
                    placeholder="Sin puntos" 
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.dni ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.dni && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.dni.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="text" 
                    {...register('telefono')}
                    placeholder="Ej. +54..." 
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.telefono ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.telefono && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.telefono.message}</p>}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                  <input 
                    type="text" 
                    {...register('direccion')}
                    placeholder="Ej. Av. Siempreviva 123" 
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.direccion ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.direccion && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.direccion.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label>
                  <input 
                    type="date" 
                    {...register('fecha_nac')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.fecha_nac ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.fecha_nac && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.fecha_nac.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Grupo Sanguíneo</label>
                  <select 
                    {...register('tipoSangre')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.tipoSangre ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all appearance-none cursor-pointer`}
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.tipoSangre && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.tipoSangre.message}</p>}
                </div>

                {isMinor && (
                  <div className="col-span-2 space-y-2 bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                    <label className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest ml-1">
                      <AlertCircle size={14} />
                      Responsable Legal (Obligatorio para menores)
                    </label>
                    <select 
                      {...register('idResponsable')}
                      className={`w-full px-5 py-3.5 bg-white border ${errors.idResponsable ? 'border-rose-500' : 'border-amber-200'} rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none cursor-pointer`}
                    >
                      <option value="">Seleccione un responsable...</option>
                      {responsables?.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre} {r.apellido} - DNI: {r.dni}</option>
                      ))}
                    </select>
                    {errors.idResponsable && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.idResponsable.message}</p>}
                    <p className="text-xs text-amber-600/70 mt-2 font-medium">
                      El paciente es menor de 18 años según su fecha de nacimiento.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-5 bg-primary-50/50 rounded-2xl border border-primary-100/50 transition-all hover:bg-primary-50">
                <input 
                  type="checkbox" 
                  id="tiene_os"
                  {...register('tiene_OS')}
                  className="w-5 h-5 accent-primary-500 cursor-pointer"
                />
                <label htmlFor="tiene_os" className="text-sm font-bold text-primary-700 cursor-pointer select-none">El paciente posee Obra Social</label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-primary-500 text-white rounded-2xl font-bold hover:bg-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {isEditing ? 'Guardar Cambios' : 'Registrar Paciente'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PacientesPage;

import { useOdontologos } from '../hooks/useOdontologos';
import { Search, UserPlus, Phone, X, Check, Key, AlertCircle, Trash2, Edit3 } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const OdontoCardSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <Skeleton className="w-20 h-6 rounded-lg" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-40 h-5" />
      <Skeleton className="w-24 h-3" />
    </div>
    <div className="pt-4 border-t border-slate-50 space-y-2">
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-48 h-3" />
    </div>
  </div>
);

const OdontologosPage = () => {
  const {
    odontologos,
    usuariosDisponibles,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    formMethods,
    isAdmin,
    onSubmit,
    handleDelete,
    openEditModal,
    closeModal
  } = useOdontologos();

  const { register, handleSubmit, formState: { errors } } = formMethods;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-10">

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96 text-left">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o especialidad..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all hover:bg-primary-600">
            <UserPlus size={20} /> Nuevo Especialista
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <><OdontoCardSkeleton /><OdontoCardSkeleton /><OdontoCardSkeleton /></>
        ) : odontologos.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No se encontraron especialistas registrados...</div>
        ) : (
          odontologos.map((o) => (
            <div key={o.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
              <div className="p-7 text-left">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 font-black text-lg shadow-inner ring-4 ring-white">{o.nombre.charAt(0)}{o.apellido.charAt(0)}</div>
                  {o.idUsuario && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <Key size={12} /> CON ACCESO
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Dr. {o.nombre} {o.apellido}</h3>
                <p className="text-primary-600 text-[11px] font-black uppercase mt-1 mb-6 tracking-[0.2em]">{o.especialidad}</p>
                
                <div className="flex gap-2 mb-6">
                   <button onClick={() => openEditModal(o)} className="flex-1 py-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase"><Edit3 size={14}/> Editar</button>
                   {isAdmin && <button onClick={() => handleDelete(o.id)} className="py-2.5 px-4 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>}
                </div>

                <div className="space-y-3 border-t border-slate-50 pt-6 mt-auto">
                  <div className="flex items-center gap-3 text-slate-600 text-sm font-medium"><div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><Phone size={14} /></div> {o.telefono || 'Sin teléfono'}</div>
                  {o.nombreUsuario && <div className="flex items-center gap-3 text-slate-400 text-xs italic font-medium"><div className="p-1.5 bg-slate-50 rounded-lg text-slate-300"><Key size={14} /></div> @{o.nombreUsuario}</div>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="text-left">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? 'Editar Especialista' : 'Registrar Especialista'}</h2>
                <p className="text-slate-500 text-sm font-medium">Completa la ficha técnica del profesional.</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horario Inicio</label>
                  <input 
                    type="time" 
                    {...register('horarioInicio')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.horarioInicio ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.horarioInicio && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.horarioInicio.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horario Fin</label>
                  <input 
                    type="time" 
                    {...register('horarioFinal')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.horarioFinal ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.horarioFinal && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.horarioFinal.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                  <input 
                    type="text" 
                    {...register('nombre')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.nombre ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.nombre && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.nombre.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                  <input 
                    type="text" 
                    {...register('apellido')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.apellido ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.apellido && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.apellido.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI</label>
                  <input 
                    type="text" 
                    {...register('dni')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.dni ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.dni && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.dni.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad</label>
                  <input 
                    type="text" 
                    {...register('especialidad')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.especialidad ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.especialidad && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.especialidad.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="text" 
                    {...register('telefono')}
                    placeholder="+549..." 
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.telefono ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.telefono && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.telefono.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label>
                  <input 
                    type="date" 
                    {...register('fecha_nac')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.fecha_nac ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.fecha_nac && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.fecha_nac.message}</p>}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                  <input 
                    type="text" 
                    {...register('direccion')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.direccion ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.direccion && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.direccion.message}</p>}
                </div>
              </div>

              <div className="bg-primary-50/50 p-6 rounded-3xl border border-primary-100 text-left">
                <div className="flex items-center gap-2 mb-4 text-primary-700">
                  <Key size={18} className="text-primary-500" />
                  <h3 className="font-bold tracking-tight">Vincular Cuenta de Acceso</h3>
                </div>
                <select 
                  {...register('usuarioId')}
                  className="w-full px-5 py-3.5 bg-white border border-primary-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">-- Sin cuenta asignada --</option>
                  {usuariosDisponibles.map(u => <option key={u.id} value={u.id}>@{u.usuario} ({u.rol})</option>)}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-primary-500 text-white rounded-2xl font-bold hover:bg-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {isEditing ? 'Guardar Cambios' : 'Crear Perfil'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdontologosPage;

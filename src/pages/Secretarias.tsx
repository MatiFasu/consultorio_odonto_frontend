import { useSecretarias } from '../hooks/useSecretarias';
import { Search, UserPlus, Phone, X, Check, Key, Briefcase, Trash2, Edit3, AlertCircle } from 'lucide-react';

const SecretariasPage = () => {
  const {
    secretarias,
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
  } = useSecretarias();

  const { register, handleSubmit, formState: { errors } } = formMethods;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Buscar por nombre o área..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-700">
            <UserPlus size={20} /> Nueva Secretaria
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
            <div className="col-span-full py-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div></div>
        ) : secretarias.map((s) => (
          <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="h-2 bg-emerald-500"></div>
            <div className="p-8 text-left">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-lg shadow-inner ring-4 ring-white">{s.nombre.charAt(0)}{s.apellido.charAt(0)}</div>
                {s.idUsuario && (
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    CON ACCESO
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{s.nombre} {s.apellido}</h3>
              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase mb-6 tracking-[0.2em] mt-2">
                <Briefcase size={12} /> {s.sector}
              </div>

              <div className="flex gap-2 mb-6">
                   <button onClick={() => openEditModal(s)} className="flex-1 py-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase"><Edit3 size={14}/> Editar</button>
                   {isAdmin && <button onClick={() => handleDelete(s.id)} className="py-2.5 px-4 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>}
              </div>

              <div className="space-y-3 border-t border-slate-50 pt-6 mt-auto">
                <div className="flex items-center gap-3 text-slate-600 text-sm font-medium"><div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><Phone size={14} /></div> {s.telefono || 'Sin teléfono'}</div>
                {s.nombreUsuario && <div className="flex items-center gap-3 text-slate-400 text-xs italic font-medium"><div className="p-1.5 bg-slate-50 rounded-lg text-slate-300"><Key size={12} /></div> Acceso: @{s.nombreUsuario}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="text-left">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? 'Editar Secretaria' : 'Alta de Secretaria'}</h2>
                <p className="text-slate-500 text-sm font-medium">Información del personal administrativo.</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-left">
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector / Área</label>
                  <input 
                    type="text" 
                    {...register('sector')}
                    placeholder="Ej: Recepción" 
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.sector ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all`} 
                  />
                  {errors.sector && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.sector.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="text" 
                    {...register('telefono')}
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

              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 text-left">
                <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold">
                   <Key size={18} />
                   <span>Vincular Cuenta Administrativa</span>
                </div>
                <select 
                  {...register('usuarioId')}
                  className="w-full px-5 py-3.5 bg-white border border-emerald-200 rounded-2xl outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">-- Sin cuenta asignada --</option>
                  {usuariosDisponibles.map(u => <option key={u.id} value={u.id}>@{u.usuario}</option>)}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {isEditing ? 'Guardar Cambios' : 'Registrar Secretaria'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretariasPage;

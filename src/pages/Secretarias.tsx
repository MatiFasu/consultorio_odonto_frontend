import { useEffect, useState } from 'react';
import { SecretariaService } from '../api/secretariaService';
import type { Secretaria } from '../api/secretariaService';
import { UsuarioService } from '../api/usuarioService';
import type { Usuario } from '../api/usuarioService';
import { useAuth } from '../store/AuthContext';
import { Search, UserPlus, Phone, X, Check, Key, Briefcase, Trash2, Edit3, AlertCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const SecretariasPage = () => {
  const { user } = useAuth();
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const isAdmin = user?.rol === 'ADMIN';

  const [formData, setFormData] = useState<any>({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    direccion: '',
    fecha_nac: '',
    sector: '',
    usuarioId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, uData] = await Promise.all([
        SecretariaService.getAll(),
        UsuarioService.getAll()
      ]);
      setSecretarias(sData);

      const idsAsignados = sData.filter(s => s.idUsuario).map(s => s.idUsuario);
      const disponibles = uData.filter(u => 
        u.rol.toUpperCase() === 'SECRETARIA' && 
        (!idsAsignados.includes(u.id_usuario) || (isEditing && u.id_usuario === formData.usuarioId))
      );

      setUsuarios(disponibles);
    } catch (error) {
      showNotification("Error al cargar la nómina", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload: any = {
      id: editingId,
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      telefono: formData.telefono,
      direccion: formData.direccion,
      fecha_nac: formData.fecha_nac || null,
      sector: formData.sector
    };

    if (formData.usuarioId) {
      payload.idUsuario = parseInt(formData.usuarioId);
    }

    try {
      if (isEditing) {
        await SecretariaService.update(payload);
        showNotification("Datos administrativos actualizados", "success");
      } else {
        await SecretariaService.create(payload);
        showNotification("Nueva secretaria registrada", "success");
      }
      await loadData();
      setTimeout(() => closeModal(), 800); 
    } catch (error) {
      showNotification("Error en la operación", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Desea dar de baja a esta secretaria?")) return;
    try {
      await SecretariaService.delete(id);
      showNotification("Registro eliminado correctamente", "success");
      loadData();
    } catch (error) {
      showNotification("No se pudo eliminar el registro", "error");
    }
  };

  const openEditModal = (s: any) => {
    setFormData({
      nombre: s.nombre,
      apellido: s.apellido,
      dni: s.dni,
      telefono: s.telefono || '',
      direccion: s.direccion || '',
      fecha_nac: s.fecha_nac ? s.fecha_nac.split('T')[0] : '',
      sector: s.sector,
      usuarioId: s.idUsuario || ''
    });
    setEditingId(s.id || s.id_persona);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ nombre: '', apellido: '', dni: '', telefono: '', direccion: '', fecha_nac: '', sector: '', usuarioId: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {notification.type === 'success' ? <Check className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
          <p className="font-bold text-sm">{notification.message}</p>
        </div>
      )}

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
        ) : secretarias.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((s: any) => (
          <div key={s.id || s.id_persona} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
                   {isAdmin && <button onClick={() => handleDelete(s.id || s.id_persona)} className="py-2.5 px-4 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>}
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

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector / Área</label>
                  <input type="text" required placeholder="Ej: Recepción" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" value={formData.fecha_nac} onChange={e => setFormData({...formData, fecha_nac: e.target.value})} />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 text-left">
                <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold">
                   <Key size={18} />
                   <span>Vincular Cuenta Administrativa</span>
                </div>
                <select 
                  className="w-full px-5 py-3.5 bg-white border border-emerald-200 rounded-2xl outline-none font-bold text-slate-700 cursor-pointer"
                  value={formData.usuarioId}
                  onChange={e => setFormData({...formData, usuarioId: e.target.value})}
                >
                  <option value="">-- Sin cuenta asignada --</option>
                  {usuarios.map(u => <option key={u.id_usuario} value={u.id_usuario}>@{u.usuario}</option>)}
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

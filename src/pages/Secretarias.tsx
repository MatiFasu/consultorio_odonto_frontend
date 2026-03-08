import { useEffect, useState } from 'react';
import { SecretariaService } from '../api/secretariaService';
import type { Secretaria } from '../api/secretariaService';
import { UsuarioService } from '../api/usuarioService';
import type { Usuario } from '../api/usuarioService';
import { useAuth } from '../store/AuthContext';
import { Search, UserPlus, Phone, X, Check, Key, Briefcase } from 'lucide-react';

const SecretariasPage = () => {
  const { user } = useAuth();
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const loadData = async () => {
    try {
      const [sData, uData] = await Promise.all([
        SecretariaService.getAll(),
        UsuarioService.getAll()
      ]);
      setSecretarias(sData);

      // Filtramos: 
      // 1. Que el rol sea SECRETARIA (insensible a mayúsculas)
      // 2. Que no esté ya asignado a otra secretaria
      const idsAsignados = sData.filter(s => s.unUsuario).map(s => s.unUsuario?.id_usuario);
      const disponibles = uData.filter(u => 
        u.rol.toUpperCase() === 'SECRETARIA' && 
        !idsAsignados.includes(u.id_usuario)
      );

      setUsuarios(disponibles);
    } catch (error) {
      console.error("Error al cargar secretarias", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      ...formData,
      unUsuario: formData.usuarioId ? { id_usuario: parseInt(formData.usuarioId) } : null
    };

    try {
      await SecretariaService.create(payload);
      await loadData();
      setIsModalOpen(false);
      setFormData({ nombre: '', apellido: '', dni: '', telefono: '', direccion: '', fecha_nac: '', sector: '', usuarioId: '' });
    } catch (error) {
      alert("Error al guardar secretaria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Buscar secretaria..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
            <UserPlus size={18} /> Nueva Secretaria
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {secretarias.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((s: any) => (
          <div key={s.id || s.id_persona} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
            <div className="h-2 bg-emerald-500"></div>
            <div className="p-6 text-left">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black">{s.nombre.charAt(0)}{s.apellido.charAt(0)}</div>
                {s.unUsuario && <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold">CON ACCESO</div>}
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{s.nombre} {s.apellido}</h3>
              <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase mb-4 tracking-widest">
                <Briefcase size={12} /> {s.sector}
              </div>
              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm"><Phone size={14} /> {s.telefono}</div>
                {s.unUsuario && <div className="flex items-center gap-2 text-slate-400 text-xs italic"><Key size={12} /> Acceso: @{s.unUsuario.usuario}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Alta de Secretaria</h2>
                <p className="text-slate-500 text-sm">Registro de personal administrativo.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Apellido</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">DNI</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sector / Área</label>
                  <input type="text" required placeholder="Ej: Recepción" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 text-left">
                <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold"><Key size={18} /> Asignar Cuenta</div>
                <select 
                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl outline-none font-medium"
                  value={formData.usuarioId}
                  onChange={e => setFormData({...formData, usuarioId: e.target.value})}
                >
                  <option value="">-- Sin cuenta asignada --</option>
                  {usuarios.map(u => <option key={u.id_usuario} value={u.id_usuario}>@{u.usuario}</option>)}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> Guardar Secretaria</>}
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

import { useEffect, useState } from 'react';
import { UsuarioService } from '../api/usuarioService';
import type { Usuario } from '../api/usuarioService';
import { Shield, UserPlus, Trash2, X, Check, Lock, UserCog } from 'lucide-react';

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Usuario>>({
    usuario: '',
    contrasenia: '',
    rol: 'SECRETARIA'
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const data = await UsuarioService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await UsuarioService.create(formData);
      await loadUsuarios(); // RECARGA LA LISTA DESDE LA DB
      setIsModalOpen(false);
      setFormData({ usuario: '', contrasenia: '', rol: 'SECRETARIA' });
    } catch (error) {
      alert("Error al registrar usuario en el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que deseas eliminar este acceso?")) {
      try {
        await UsuarioService.delete(id);
        await loadUsuarios();
      } catch (error) {
        alert("Error al borrar el usuario");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Shield size={28} /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Cuentas de Acceso</h2>
            <p className="text-slate-500 text-sm">Gestiona quién puede entrar al sistema.</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all w-full md:w-auto justify-center flex items-center gap-2">
          <UserPlus size={20} /> Nuevo Acceso
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-5">Nombre de Usuario</th>
                <th className="px-6 py-5">Rol de Sistema</th>
                <th className="px-6 py-5 text-right pr-10">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Conectando con el servidor...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={3} className="p-20 text-center text-slate-400 italic">No hay usuarios registrados en la base de datos.</td></tr>
              ) : usuarios.map((u) => (
                <tr key={u.id_usuario} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{u.usuario?.charAt(0).toUpperCase()}</div>
                      <span className="font-bold text-slate-700">@{u.usuario}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      u.rol === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 
                      u.rol === 'SECRETARIA' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <UserCog size={12} /> {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right pr-8">
                    {u.usuario !== 'admin' && (
                      <button onClick={() => u.id_usuario && handleDelete(u.id_usuario)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Crear Acceso</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <p className="text-slate-500 text-sm">Define las credenciales para el nuevo miembro.</p>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de Usuario</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input type="text" required value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ana_garcia" />
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" required value={formData.contrasenia} onChange={e => setFormData({...formData, contrasenia: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Rol de Usuario</label>
                <div className="grid grid-cols-1 gap-2">
                  {['ADMIN', 'SECRETARIA', 'ODONTOLOGO'].map((r) => (
                    <button key={r} type="button" onClick={() => setFormData({...formData, rol: r as any})} className={`px-4 py-3 rounded-xl text-left font-bold text-sm transition-all border ${formData.rol === r ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cerrar</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> Crear Cuenta</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;

import { useEffect, useState } from 'react';
import { OdontologoService } from '../api/odontologoService';
import type { Odontologo } from '../api/odontologoService';
import { UsuarioService } from '../api/usuarioService';
import type { Usuario } from '../api/usuarioService';
import { useAuth } from '../store/AuthContext';
import { Search, UserPlus, MoreHorizontal, Phone, Mail, Stethoscope, X, Check, Key } from 'lucide-react';

const OdontologosPage = () => {
  const { user } = useAuth();
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
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
    especialidad: '',
    usuarioId: '' // Campo para la asociación
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [oData, uData] = await Promise.all([
        OdontologoService.getAll(),
        UsuarioService.getAll()
      ]);
      setOdontologos(oData);
      
      // Filtramos solo usuarios que no estén asignados para ver todos los disponibles
      const idsAsignados = oData.filter(o => o.unUsuario).map(o => o.unUsuario?.id_usuario);
      const disponibles = uData.filter(u => !idsAsignados.includes(u.id_usuario));
      
      setUsuarios(disponibles);
    } catch (error) {
      console.error("Error al cargar datos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    
    // Preparamos el objeto con la asociación
    const payload = {
      ...formData,
      unUsuario: formData.usuarioId ? { id_usuario: parseInt(formData.usuarioId) } : null
    };

    try {
      await OdontologoService.create(payload);
      await loadData();
      setIsModalOpen(false);
      setFormData({ nombre: '', apellido: '', dni: '', telefono: '', direccion: '', fecha_nac: '', especialidad: '', usuarioId: '' });
    } catch (error) {
      alert("Error al guardar odontólogo");
    } finally {
      setSaving(false);
    }
  };

  const filteredOdontologos = odontologos.filter(o => 
    o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.apellido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar especialista..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
            <UserPlus size={18} /> Nuevo Odontólogo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {odontologos.map((o: any) => (
          <div key={o.id_persona} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
            <div className="h-2 bg-primary-500"></div>
            <div className="p-6 text-left">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-600 font-black">{o.nombre.charAt(0)}{o.apellido.charAt(0)}</div>
                {o.unUsuario && (
                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                    <Key size={10} /> CON ACCESO
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Dr. {o.nombre} {o.apellido}</h3>
              <p className="text-primary-600 text-xs font-bold uppercase mb-4 tracking-widest">{o.especialidad}</p>
              
              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm"><Phone size={14} /> {o.telefono}</div>
                {o.unUsuario && <div className="flex items-center gap-2 text-slate-400 text-xs italic"><Key size={12} /> Usuario: @{o.unUsuario.usuario}</div>}
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
                <h2 className="text-2xl font-bold text-slate-800">Registrar Especialista</h2>
                <p className="text-slate-500 text-sm">Completa el perfil profesional.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Apellido</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">DNI</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Especialidad</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.especialidad} onChange={e => setFormData({...formData, especialidad: e.target.value})} />
                </div>
              </div>

              {/* ASOCIACIÓN DE USUARIO */}
              <div className="bg-primary-50/50 p-6 rounded-2xl border border-primary-100 text-left">
                <div className="flex items-center gap-2 mb-4 text-primary-700">
                  <Key size={18} />
                  <h3 className="font-bold">Asignar Cuenta de Acceso</h3>
                </div>
                <select 
                  className="w-full px-4 py-3 bg-white border border-primary-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  value={formData.usuarioId}
                  onChange={e => setFormData({...formData, usuarioId: e.target.value})}
                >
                  <option value="">-- Sin cuenta asignada --</option>
                  {usuarios.map(u => <option key={u.id_usuario} value={u.id_usuario}>@{u.usuario} (Rol: {u.rol})</option>)}
                </select>
                <p className="mt-2 text-[10px] text-primary-600 font-medium leading-tight">* Debes crear el usuario en la sección "Accesos" antes de poder vincularlo aquí.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-primary-500 text-white rounded-2xl font-bold hover:bg-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> Guardar Perfil</>}
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

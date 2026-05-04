import { useEffect, useState } from 'react';
import { PacienteService } from '../api/pacienteService';
import type { Paciente } from '../api/pacienteService';
import { Search, UserPlus, Trash2, Edit, X, Check, Droplet, CreditCard, AlertCircle, FileText, Wallet } from 'lucide-react';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import ClinicalHistoryModal from '../components/ClinicalHistoryModal';
import BillingModal from '../components/BillingModal';
import { useAuth } from '../store/AuthContext';

const PacientesPage = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Historia Clínica
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  // Facturación
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [selectedBillingPaciente, setSelectedBillingPaciente] = useState<Paciente | null>(null);

  // Formulario Paciente
  const [formData, setFormData] = useState<Partial<Paciente>>({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    direccion: '',
    fecha_nac: '',
    tiene_OS: false,
    tipoSangre: 'O+'
  });

  useEffect(() => {
    loadPacientes();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const loadPacientes = async () => {
    setLoading(true);
    try {
      const data = await PacienteService.getAll();
      setPacientes(data);
    } catch (error) {
      showNotification("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload: Partial<Paciente> = {
      ...formData,
      id: editingId ?? undefined
    };

    try {
      if (isEditing && editingId) {
        await PacienteService.update(payload);
        showNotification("Paciente actualizado correctamente", "success");
      } else {
        await PacienteService.create(formData);
        showNotification("Paciente registrado con éxito", "success");
      }
      await loadPacientes();
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.response?.data?.message || "Ocurrió un error inesperado";
      showNotification(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Paciente) => {
    setFormData({
      nombre: p.nombre,
      apellido: p.apellido,
      dni: p.dni,
      telefono: p.telefono,
      direccion: p.direccion,
      fecha_nac: p.fecha_nac ? p.fecha_nac.split('T')[0] : '',
      tiene_OS: p.tiene_OS,
      tipoSangre: p.tipoSangre
    });
    setEditingId(p.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que deseas eliminar este paciente del sistema?")) {
      try {
        await PacienteService.delete(id);
        showNotification("Paciente eliminado", "success");
        await loadPacientes();
      } catch (error) {
        showNotification("No se pudo eliminar el paciente", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', apellido: '', dni: '', telefono: '', direccion: '', fecha_nac: '', tiene_OS: false, tipoSangre: 'O+' });
    setIsEditing(false);
    setEditingId(null);
  };

  const filteredPacientes = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dni.includes(searchTerm)
  );

  const isOdonto = user?.rol === 'ODONTOLOGO';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Toast Notification Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {notification.type === 'success' ? <Check className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
          <p className="font-bold text-sm">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* Search & Actions */}
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95 w-full md:w-auto justify-center"
          >
            <UserPlus size={20} />
            Nuevo Paciente
          </button>
        )}
      </div>

      {/* Patients List */}
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
              ) : filteredPacientes.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold italic">No hay registros que coincidan...</td></tr>
              ) : (
                filteredPacientes.map((p) => (
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
                          <button 
                            onClick={() => { setSelectedPaciente(p); setIsHistoryOpen(true); }}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            <FileText size={14} /> Atender
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setSelectedPaciente(p); setIsHistoryOpen(true); }}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Historia Clínica"
                          >
                            <FileText size={18} />
                          </button>
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
      </div>

      {/* Clinical History Modal */}
      {selectedPaciente && (
        <ClinicalHistoryModal 
          paciente={selectedPaciente}
          isOpen={isHistoryOpen}
          onClose={() => { setIsHistoryOpen(false); setSelectedPaciente(null); }}
        />
      )}

      {/* Billing & Finance Modal */}
      {selectedBillingPaciente && (
        <BillingModal 
          paciente={selectedBillingPaciente}
          isOpen={isBillingOpen}
          onClose={() => { setIsBillingOpen(false); setSelectedBillingPaciente(null); }}
        />
      )}

      {/* Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? 'Editar Paciente' : 'Alta de Paciente'}</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                  <input type="text" required placeholder="Ej. Juan" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                  <input type="text" required placeholder="Ej. Pérez" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">DNI</label>
                  <input type="text" required placeholder="Sin puntos" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input type="text" required placeholder="Ej. +54..." value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                  <input type="text" required placeholder="Ej. Av. Siempreviva 123" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label>
                  <input type="date" required value={formData.fecha_nac} onChange={e => setFormData({...formData, fecha_nac: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Grupo Sanguíneo</label>
                  <select value={formData.tipoSangre} onChange={e => setFormData({...formData, tipoSangre: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all appearance-none cursor-pointer">
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-5 bg-primary-50/50 rounded-2xl border border-primary-100/50 transition-all hover:bg-primary-50">
                <input 
                  type="checkbox" 
                  id="tiene_os"
                  checked={formData.tiene_OS} 
                  onChange={e => setFormData({...formData, tiene_OS: e.target.checked})} 
                  className="w-5 h-5 accent-primary-500 cursor-pointer"
                />
                <label htmlFor="tiene_os" className="text-sm font-bold text-primary-700 cursor-pointer select-none">El paciente posee Obra Social</label>
              </div>

              <div className="flex gap-4 pt-4">
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

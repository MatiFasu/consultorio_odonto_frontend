import { useEffect, useState } from 'react';
import { TurnoService } from '../api/turnoService';
import type { Turno } from '../api/turnoService';
import { PacienteService } from '../api/pacienteService';
import { OdontologoService } from '../api/odontologoService';
import { useAuth } from '../store/AuthContext';
import { Calendar, Plus, Clock, User, Stethoscope, Trash2, X, Check, Search } from 'lucide-react';

const TurnosPage = () => {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [odontologos, setOdontologos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const today = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(today);

  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<any | null>(null);

  // Permisos: Admin y Secretaria pueden CREAR y BORRAR
  const canManage = user?.rol === 'ADMIN' || user?.rol === 'SECRETARIA';

  const [formData, setFormData] = useState({
    fecha_turno: today,
    hora_turno: '',
    afeccion: '',
    odontologoId: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, pData, oData] = await Promise.all([
        TurnoService.getAll().catch(() => []),
        PacienteService.getAll().catch(() => []),
        OdontologoService.getAll().catch(() => [])
      ]);
      setTurnos(tData);
      setPacientes(pData);
      setOdontologos(oData);
    } catch (error) {
      console.error("Error cargando agenda", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const odontologo = odontologos.find(o => 
      String(o.id_persona || o.id) === String(formData.odontologoId)
    );

    if (!selectedPaciente || !odontologo) {
      alert("Error: Por favor selecciona un paciente y un odontólogo de las sugerencias.");
      return;
    }

    try {
      await TurnoService.create({
        fecha_turno: formData.fecha_turno,
        hora_turno: formData.hora_turno,
        afeccion: formData.afeccion,
        paciente: selectedPaciente,
        odontologo: odontologo
      });
      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Error al guardar en el servidor. Verifica que el backend esté corriendo.");
    }
  };

  const resetForm = () => {
    setFormData({ ...formData, hora_turno: '', afeccion: '', odontologoId: '' });
    setSelectedPaciente(null);
    setPacienteSearch('');
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Confirmas la cancelación del turno?")) {
      await TurnoService.delete(id);
      await loadData();
    }
  };

  const turnosVisualizados = (turnos || [])
    .filter(t => t.fecha_turno === selectedDate)
    .sort((a, b) => a.hora_turno.localeCompare(b.hora_turno));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shrink-0"><Calendar size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Agenda {canManage ? 'Global' : 'Personal'}</h2>
            <p className="text-slate-500 text-sm">Gestionando citas para el día {selectedDate}.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" />
          {canManage && (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all">
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Sincronizando...</div>
        ) : turnosVisualizados.length === 0 ? (
          <div className="p-20 text-center text-slate-400 font-medium">No hay turnos programados.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {turnosVisualizados.map((t) => (
              <div key={t.id_turno} className="p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                <div className="text-2xl font-black text-slate-300 group-hover:text-primary-500 transition-colors w-20">{t.hora_turno}</div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">{(t.pacien?.nombre || '?').charAt(0)}</div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Paciente</p>
                      <p className="font-bold text-slate-800">{t.pacien?.nombre} {t.pacien?.apellido}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">{(t.odonto?.nombre || '?').charAt(0)}</div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Doctor</p>
                      <p className="font-bold text-slate-800">Dr. {t.odonto?.nombre} {t.odonto?.apellido}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Motivo</p>
                    <p className="text-sm text-slate-600 italic">"{t.afeccion}"</p>
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => handleDelete(t.id_turno)} className="p-3 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Agendar Cita</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={formData.fecha_turno} onChange={e => setFormData({...formData, fecha_turno: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold" />
                <input type="time" required value={formData.hora_turno} onChange={e => setFormData({...formData, hora_turno: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold" />
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Buscar Paciente</label>
                {!selectedPaciente ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" value={pacienteSearch} onChange={e => setPacienteSearch(e.target.value)} placeholder="DNI o Apellido..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    {pacienteSearch.length > 1 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {pacientes.filter(p => p.dni.includes(pacienteSearch) || `${p.nombre} ${p.apellido}`.toLowerCase().includes(pacienteSearch.toLowerCase())).map(p => (
                          <div key={p.id_persona || p.id} onClick={() => { setSelectedPaciente(p); setPacienteSearch(''); }} className="p-4 hover:bg-primary-50 cursor-pointer border-b border-slate-50 last:border-0 text-left">
                            <p className="font-bold text-slate-800">{p.nombre} {p.apellido}</p>
                            <p className="text-xs text-slate-500">DNI: {p.dni}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl flex justify-between items-center animate-in zoom-in-95 duration-200">
                    <p className="font-bold text-primary-700">{selectedPaciente.nombre} {selectedPaciente.apellido}</p>
                    <button type="button" onClick={() => setSelectedPaciente(null)} className="text-primary-400 hover:text-rose-500"><X size={20} /></button>
                  </div>
                )}
              </div>

              <div className="text-left">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Especialista</label>
                <select required value={formData.odontologoId} onChange={e => setFormData({...formData, odontologoId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                  <option value="">-- Elige un odontólogo --</option>
                  {odontologos.map(o => <option key={o.id_persona || o.id} value={String(o.id_persona || o.id)}>Dr. {o.nombre} {o.apellido}</option>)}
                </select>
              </div>

              <textarea rows={2} required value={formData.afeccion} onChange={e => setFormData({...formData, afeccion: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" placeholder="Motivo..."></textarea>
              <button type="submit" className="w-full py-4 bg-primary-500 text-white rounded-2xl font-bold hover:bg-primary-600 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"><Check size={20} /> Agendar Turno</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnosPage;

import { useEffect, useState } from 'react';
import { OdontologoService } from '../api/odontologoService';
import type { Odontologo } from '../api/odontologoService';
import { HorarioService } from '../api/horarioService';
import type { Horario } from '../api/horarioService';
import { Clock, Check, X, Stethoscope, Save, AlertCircle } from 'lucide-react';

const HorariosPage = () => {
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Horario>({ id_horario: 0, horario_inicio: '08:00', horario_final: '12:00' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const oData = await OdontologoService.getAll();
      setOdontologos(oData);
    } catch (error) {
      console.error("Error al cargar odontólogos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (odontologo: Odontologo) => {
    setEditingId(odontologo.id_persona);
    if (odontologo.unHorario) {
      setEditFormData(odontologo.unHorario);
    } else {
      // Valor por defecto si no tiene horario asignado
      setEditFormData({ id_horario: 0, horario_inicio: '08:00', horario_final: '12:00' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const odontologo = odontologos.find(o => o.id_persona === editingId);
      if (!odontologo) return;

      let horarioFinal: Horario;

      if (editFormData.id_horario && editFormData.id_horario !== 0) {
        // ACTUALIZAR EXISTENTE
        await HorarioService.update(editFormData);
        horarioFinal = editFormData;
      } else {
        // CREAR NUEVO Y VINCULAR
        const newId = await HorarioService.create(editFormData);
        horarioFinal = { ...editFormData, id_horario: newId };
        
        // Actualizar el objeto odontologo con el nuevo horario
        const updatedOdonto = { ...odontologo, unHorario: horarioFinal };
        await OdontologoService.update(updatedOdonto);
      }

      await loadData(); // Recargar todo para ver reflejados los cambios
      setEditingId(null);
    } catch (error) {
      console.error("Error al guardar horario", error);
      alert("Hubo un error al procesar el horario. Verifica la consola.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Horarios de Atención</h2>
            <p className="text-slate-500 text-sm">Gestiona la jornada laboral de los odontólogos.</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
           <AlertCircle className="text-amber-600" size={20} />
           <p className="text-xs text-amber-700 font-bold max-w-[250px]">
             Importante: Un odontólogo sin horario asignado no aparecerá disponible para turnos.
           </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-8 py-5">Especialista</th>
                <th className="px-6 py-5">Entrada</th>
                <th className="px-6 py-5">Salida</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right pr-10">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Sincronizando...</td></tr>
              ) : odontologos.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400">No hay odontólogos registrados.</td></tr>
              ) : odontologos.map((o) => (
                <tr key={o.id_persona} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-600 font-black">
                        {o.nombre.charAt(0)}{o.apellido.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-none mb-1">Dr. {o.nombre} {o.apellido}</p>
                        <div className="flex items-center gap-1 text-[10px] text-primary-600 font-black uppercase">
                           <Stethoscope size={10} /> {o.especialidad}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {editingId === o.id_persona ? (
                    <>
                      <td className="px-6 py-5">
                        <input type="time" value={editFormData.horario_inicio} onChange={e => setEditFormData({...editFormData, horario_inicio: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold" />
                      </td>
                      <td className="px-6 py-5">
                        <input type="time" value={editFormData.horario_final} onChange={e => setEditFormData({...editFormData, horario_final: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold" />
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">Editando</span>
                      </td>
                      <td className="px-6 py-5 text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
                          <button onClick={handleSave} disabled={saving} className="p-2 text-primary-500 hover:text-primary-700 transition-colors">
                            {saving ? <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div> : <Save size={20} />}
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-5">
                        <span className="font-black text-slate-700 text-lg">{o.unHorario?.horario_inicio || '00:00'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-slate-700 text-lg">{o.unHorario?.horario_final || '00:00'}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${o.unHorario ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          <Check size={10} /> {o.unHorario ? 'ACTIVO' : 'SIN ASIGNAR'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right pr-8">
                        <button onClick={() => handleEditClick(o)} className="px-4 py-2 bg-slate-50 hover:bg-primary-50 text-slate-500 hover:text-primary-600 rounded-xl font-bold text-xs transition-all border border-slate-100">
                          Configurar Horario
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HorariosPage;

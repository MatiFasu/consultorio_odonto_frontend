import React, { useEffect, useState } from 'react';
import { X, Plus, Calendar, User, Stethoscope, FileText, Trash2, Check, Activity, Upload, Image as ImageIcon, File as FileIcon, Edit } from 'lucide-react';
import { RegistroClinicoService } from '../api/registroClinicoService';
import type { RegistroClinico, EstadoDiente } from '../api/registroClinicoService';
import type { Paciente } from '../api/pacienteService';
import { OdontologoService } from '../api/odontologoService';
import type { Odontologo } from '../api/odontologoService';
import { MediaService } from '../api/mediaService';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';
import Odontograma from './Odontograma';

interface Props {
  paciente: Paciente;
  isOpen: boolean;
  onClose: () => void;
}

const ClinicalHistoryModal = ({ paciente, isOpen, onClose }: Props) => {
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const [historial, setHistorial] = useState<RegistroClinico[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [odontogramaData, setOdontogramaData] = useState<EstadoDiente[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    motivoConsulta: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    odontologoId: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleOdontoChange = (numero: number, posicion: string, nuevoEstado: string) => {
    setOdontogramaData(prev => {
      const filtered = prev.filter(e => !(e.numeroDiente === numero && e.posicion === posicion));
      if (nuevoEstado === 'sano') return filtered;
      return [...filtered, { numeroDiente: numero, posicion, estado: nuevoEstado }];
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hData, oData] = await Promise.all([
        RegistroClinicoService.getHistorialByPaciente(paciente.id),
        OdontologoService.getAll()
      ]);
      setHistorial(hData);
      setOdontologos(oData);

      if (user?.rol === 'ODONTOLOGO' && !isEditingRecord) {
        const currentOdonto = oData.find(o => o.idUsuario === user.id);
        if (currentOdonto) {
          setFormData(prev => ({ ...prev, odontologoId: String(currentOdonto.id) }));
        }
      }
    } catch (error) {
      console.error("Error al cargar historia clínica", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = (reg: RegistroClinico) => {
    setFormData({
      motivoConsulta: reg.motivoConsulta,
      diagnostico: reg.diagnostico,
      tratamiento: reg.tratamiento,
      observaciones: reg.observaciones || '',
      odontologoId: String(reg.idOdontologo)
    });
    setOdontogramaData(reg.odontograma || []);
    setEditingRecordId(reg.id || null);
    setIsEditingRecord(true);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.odontologoId) {
      toast.error("Debe seleccionar un odontólogo");
      return;
    }
    setSaving(true);
    try {
      const registroPayload: RegistroClinico = {
        id: editingRecordId || undefined,
        fecha: isEditingRecord ? historial.find(r => r.id === editingRecordId)?.fecha || new Date().toISOString() : new Date().toISOString(),
        motivoConsulta: formData.motivoConsulta,
        diagnostico: formData.diagnostico,
        tratamiento: formData.tratamiento,
        observaciones: formData.observaciones,
        idPaciente: paciente.id,
        idOdontologo: Number(formData.odontologoId),
        odontograma: odontogramaData
      };

      const savedRegistro = await RegistroClinicoService.create(registroPayload);
      
      if (selectedFiles.length > 0 && (savedRegistro.id || editingRecordId)) {
        const targetId = savedRegistro.id || editingRecordId!;
        await Promise.all(selectedFiles.map(file => MediaService.upload(targetId, file)));
      }

      await loadData();
      toast.success(isEditingRecord ? "Registro clínico actualizado con éxito" : "Registro clínico guardado con éxito");
      cancelForm();
    } catch (error) {
      toast.error("Error al guardar el registro clínico");
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setIsAdding(false);
    setIsEditingRecord(false);
    setEditingRecordId(null);
    setFormData({ 
      motivoConsulta: '', 
      diagnostico: '', 
      tratamiento: '', 
      observaciones: '', 
      odontologoId: odontologos.find(o => o.idUsuario === user?.id)?.id?.toString() || '' 
    });
    setOdontogramaData([]);
    setSelectedFiles([]);
  };

  const handleDelete = async (id: number) => {
    if (await confirm("¿Confirmar Eliminación?", "¿Eliminar este registro de la historia clínica?")) {
      try {
        await RegistroClinicoService.delete(id);
        toast.success("Registro clínico eliminado con éxito");
        await loadData();
      } catch (error) {
        toast.error("No se pudo eliminar el registro");
      }
    }
  };

  const isOdonto = user?.rol === 'ODONTOLOGO';
  const isAdmin = user?.rol === 'ADMIN';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#F8FAFC] w-full max-w-6xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white">
        
        {/* Header */}
        <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5 text-left">
            <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Historia Clínica Digital</h2>
              <p className="text-slate-500 font-bold text-sm">Paciente: <span className="text-primary-600 uppercase">{paciente.nombre} {paciente.apellido}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isAdding && isOdonto && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <Plus size={18} /> Nuevo Registro
              </button>
            )}
            <button onClick={onClose} className="p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"><X size={24} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-top-4 duration-300 text-left">
              
              {/* Odontograma de Registro */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="flex items-center gap-2 mb-4">
                    <Activity className="text-primary-500" size={20} />
                    <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider">
                      {isEditingRecord ? 'Editar Estado Dental' : 'Estado Dental (Odontograma)'}
                    </h3>
                 </div>
                 <Odontograma estados={odontogramaData} onChange={handleOdontoChange} />
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                     {isEditingRecord ? <><Edit size={20} className="text-primary-500"/> Modificar Evolución</> : <><Plus size={20} className="text-emerald-500"/> Información de la Consulta</>}
                   </h3>
                   <button type="button" onClick={cancelForm} className="text-xs font-bold text-slate-400 hover:text-rose-500">Cancelar</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialista</label>
                    <select 
                      required
                      value={formData.odontologoId}
                      onChange={e => setFormData({...formData, odontologoId: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    >
                      <option value="">-- Selecciona odontólogo --</option>
                      {odontologos.map(o => <option key={o.id} value={String(o.id)}>Dr. {o.nombre} {o.apellido}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo de Consulta</label>
                    <input type="text" required value={formData.motivoConsulta} onChange={e => setFormData({...formData, motivoConsulta: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diagnóstico</label>
                    <textarea rows={2} required value={formData.diagnostico} onChange={e => setFormData({...formData, diagnostico: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tratamiento Realizado</label>
                    <textarea rows={2} required value={formData.tratamiento} onChange={e => setFormData({...formData, tratamiento: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones</label>
                    <textarea rows={2} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="pt-6 border-t border-slate-100">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Estudios / Radiografías (Máx 10MB)</label>
                   <div className="flex items-center gap-4">
                      <label className="cursor-pointer flex items-center gap-3 px-6 py-3 bg-primary-50 text-primary-600 rounded-2xl font-bold hover:bg-primary-100 transition-all border-2 border-dashed border-primary-200">
                         <Upload size={20} />
                         {isEditingRecord ? 'Añadir más archivos' : 'Seleccionar Archivos'}
                         <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                      </label>
                      <div className="flex flex-wrap gap-2">
                         {selectedFiles.map((f, i) => (
                           <span key={i} className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-lg border border-slate-200">{f.name}</span>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={saving} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95">
                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {isEditingRecord ? 'Guardar Cambios' : 'Guardar Registro Completo'}</>}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-left">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                   <p className="text-slate-400 font-bold animate-pulse">Cargando historial...</p>
                </div>
              ) : historial.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                   <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                   <p className="text-slate-400 font-bold italic text-lg">No hay registros clínicos previos...</p>
                   <p className="text-slate-300 text-sm mt-2">Haz clic en "Nuevo Registro" para empezar.</p>
                </div>
              ) : (
                historial.map((reg) => (
                  <div key={reg.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                    <div className="p-7 flex flex-col gap-8">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center w-24 shrink-0 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all">
                          <Calendar size={24} className="text-slate-300 mb-2 group-hover:text-primary-500" />
                          <span className="text-xs font-black text-slate-800">{new Date(reg.fecha).toLocaleDateString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(reg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        
                        <div className="flex-1 space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">Evolución Médica</p>
                              <h4 className="text-xl font-bold text-slate-800 leading-none">{reg.motivoConsulta}</h4>
                            </div>
                            <div className="flex gap-2">
                              {(isOdonto || isAdmin) && (
                                <>
                                  {isOdonto && (
                                    <button onClick={() => handleEditRecord(reg)} className="p-2 text-slate-200 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all">
                                      <Edit size={18} />
                                    </button>
                                  )}
                                  <button onClick={() => handleDelete(reg.id!)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                             <div className="space-y-1.5">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div> Diagnóstico</div>
                               <p className="text-sm text-slate-600 font-semibold leading-relaxed">{reg.diagnostico}</p>
                             </div>
                             <div className="space-y-1.5">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Tratamiento</div>
                               <p className="text-sm text-slate-600 font-semibold leading-relaxed">{reg.tratamiento}</p>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Multimedia Section */}
                      {reg.estudios && reg.estudios.length > 0 && (
                        <div className="mt-4 pt-6 border-t border-slate-50">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon size={14}/> Estudios Adjuntos</p>
                           <div className="flex flex-wrap gap-4">
                              {reg.estudios.map((est) => (
                                <a 
                                  key={est.id} 
                                  href={MediaService.getFileUrl(est.urlArchivo)} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-primary-50 hover:border-primary-100 transition-all group/file"
                                >
                                   {est.tipoContenido.includes('image') ? <ImageIcon size={20} className="text-primary-500" /> : <FileIcon size={20} className="text-slate-400" />}
                                   <div className="text-left">
                                      <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{est.nombreArchivo}</p>
                                      <p className="text-[9px] text-slate-400 font-black uppercase">Click para ver</p>
                                   </div>
                                </a>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Odontograma del Registro Histórico */}
                      {reg.odontograma && reg.odontograma.length > 0 && (
                        <div className="mt-4 pt-6 border-t border-slate-50">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14}/> Estado Dental Registrado</p>
                           <Odontograma estados={reg.odontograma} readOnly />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-black text-[10px]">
                              {reg.nombreOdontologo?.charAt(0)}
                           </div>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Atendido por: <span className="text-slate-600">Dr. {reg.nombreOdontologo}</span></p>
                         </div>
                         {reg.observaciones && (
                           <div className="text-[10px] text-slate-400 italic font-medium max-w-md truncate">"{reg.observaciones}"</div>
                         )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Dental-OS Clinical Management System v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default ClinicalHistoryModal;

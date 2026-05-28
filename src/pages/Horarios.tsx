import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { OdontologoService } from '../api/odontologoService';
import type { Odontologo } from '../api/odontologoService';
import { HorarioService } from '../api/horarioService';
import { Clock, Check, X, Stethoscope, Save, AlertCircle } from 'lucide-react';
import { useUI } from '../store/UIContext';

// Schema de validación con Zod
const horarioSchema = z.object({
  horario_inicio: z.string().min(1, "La hora de inicio es obligatoria"),
  horario_final: z.string().min(1, "La hora de fin es obligatoria"),
}).superRefine((data, ctx) => {
  if (data.horario_inicio >= data.horario_final) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La hora de inicio debe ser anterior a la de fin",
      path: ["horario_inicio"]
    });
  }
});

type HorarioFormData = z.infer<typeof horarioSchema>;

const HorariosPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useUI();
  const [editingId, setEditingId] = useState<number | null>(null);

  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HorarioFormData>({
    resolver: zodResolver(horarioSchema)
  });

  // Queries con React Query
  const { data: odontologos = [], isLoading: loading } = useQuery({
    queryKey: ['odontologos'],
    queryFn: () => OdontologoService.getAll(),
  });

  // Mutaciones
  const updateHorarioMutation = useMutation({
    mutationFn: async (data: { odontologo: Odontologo, formData: HorarioFormData }) => {
      const { odontologo, formData } = data;

      // Sincronizar con odontólogo (el backend manejará la creación/edición del horario)
      const payload: Partial<Odontologo> = {
        ...odontologo,
        horarioInicio: formData.horario_inicio,
        horarioFinal: formData.horario_final
      };
      await OdontologoService.update(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontologos'] });
      setEditingId(null);
      toast.success("¡Horario guardado correctamente!");
    },
    onError: () => toast.error("Hubo un error al procesar el horario.")
  });

  const handleEditClick = (odontologo: Odontologo) => {
    setEditingId(odontologo.id);
    reset({
      horario_inicio: odontologo.horarioInicio || '08:00',
      horario_final: odontologo.horarioFinal || '12:00'
    });
  };

  const onFormSubmit = (data: HorarioFormData) => {
    const odontologo = odontologos.find(o => o.id === editingId);
    if (!odontologo) return;
    updateHorarioMutation.mutate({ odontologo, formData: data });
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
          <form onSubmit={handleSubmit(onFormSubmit)}>
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
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-600 font-black">
                          {o.nombre.charAt(0)}{o.apellido.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 leading-none mb-1">Dr. {o.nombre} {o.apellido}</p>
                          <div className="flex items-center gap-1 text-[10px] text-primary-600 font-black uppercase">
                             <Stethoscope size={10} /> {o.especialidad}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {editingId === o.id ? (
                      <>
                        <td className="px-6 py-5">
                          <input 
                            type="time" 
                            {...register('horario_inicio')}
                            className={`px-3 py-2 bg-white border ${errors.horario_inicio ? 'border-rose-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold`} 
                          />
                          {errors.horario_inicio && <p className="text-rose-500 text-[9px] font-bold mt-1">{errors.horario_inicio.message}</p>}
                        </td>
                        <td className="px-6 py-5">
                          <input 
                            type="time" 
                            {...register('horario_final')}
                            className={`px-3 py-2 bg-white border ${errors.horario_final ? 'border-rose-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold`} 
                          />
                          {errors.horario_final && <p className="text-rose-500 text-[9px] font-bold mt-1">{errors.horario_final.message}</p>}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">Editando</span>
                        </td>
                        <td className="px-6 py-5 text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            <button type="submit" disabled={updateHorarioMutation.isPending} className="p-2 text-primary-500 hover:text-primary-700 transition-colors">
                              {updateHorarioMutation.isPending ? <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div> : <Save size={20} />}
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-5">
                          <span className="font-black text-slate-700 text-lg">{o.horarioInicio || '00:00'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-black text-slate-700 text-lg">{o.horarioFinal || '00:00'}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${o.idHorario ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            <Check size={10} /> {o.idHorario ? 'ACTIVO' : 'SIN ASIGNAR'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right pr-8">
                          <button type="button" onClick={() => handleEditClick(o)} className="px-4 py-2 bg-slate-50 hover:bg-primary-50 text-slate-500 hover:text-primary-600 rounded-xl font-bold text-xs transition-all border border-slate-100">
                            Configurar Horario
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HorariosPage;

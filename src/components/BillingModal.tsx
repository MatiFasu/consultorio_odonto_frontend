import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Plus, DollarSign, Trash2, CreditCard, Receipt, Wallet } from 'lucide-react';
import { FacturacionService, type Presupuesto, type Pago } from '../api/facturacionService';
import type { Paciente } from '../api/pacienteService';
import { useUI } from '../store/UIContext';

interface Props {
  paciente: Paciente;
  isOpen: boolean;
  onClose: () => void;
}

// Schemas de validación
const itemSchema = z.object({
  descripcion: z.string().min(2, "La descripción es corta"),
  costo: z.number().min(1, "El costo debe ser mayor a 0")
});

const presupuestoSchema = z.object({
  items: z.array(itemSchema).min(1, "Debe añadir al menos un ítem")
});

const pagoSchema = z.object({
  monto: z.number().min(1, "El monto debe ser mayor a 0"),
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MERCADO_PAGO']),
  notas: z.string().optional(),
  transaccionId: z.string().optional(),
  idPresupuesto: z.string().optional()
});

type PresupuestoFormData = z.infer<typeof presupuestoSchema>;
type PagoFormData = z.infer<typeof pagoSchema>;

const BillingModal = ({ paciente, isOpen, onClose }: Props) => {
  const queryClient = useQueryClient();
  const { toast, confirm } = useUI();
  const [tab, setTab] = useState<'balance' | 'presupuestos' | 'pagos'>('balance');

  // Estados para creación
  const [isAddingPresupuesto, setIsAddingPresupuesto] = useState(false);
  const [isAddingPago, setIsAddingPago] = useState(false);

  // React Hook Form - Presupuesto
  const { register: regPre, handleSubmit: handlePre, control: controlPre, reset: resetPre, formState: { errors: errPre } } = useForm<PresupuestoFormData>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: { items: [{ descripcion: '', costo: 0 }] }
  });

  const { fields, append, remove } = useFieldArray({
    control: controlPre,
    name: "items"
  });

  // React Hook Form - Pago
  const { register: regPago, handleSubmit: handlePago, reset: resetPago, formState: { errors: errPago } } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: { 
      monto: 0, 
      metodoPago: 'EFECTIVO', 
      notas: '', 
      transaccionId: '', 
      idPresupuesto: '' 
    }
  });

  // Queries con React Query
  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ['balance', paciente.id],
    queryFn: () => FacturacionService.getEstadoCuenta(paciente.id),
    enabled: isOpen
  });

  const { data: presupuestos = [], isLoading: loadingPresupuestos } = useQuery({
    queryKey: ['presupuestos', paciente.id],
    queryFn: () => FacturacionService.getPresupuestos(paciente.id),
    enabled: isOpen
  });

  const { data: pagos = [], isLoading: loadingPagos } = useQuery({
    queryKey: ['pagos', paciente.id],
    queryFn: () => FacturacionService.getPagos(paciente.id),
    enabled: isOpen
  });

  const loading = loadingBalance || loadingPresupuestos || loadingPagos;

  // Mutaciones
  const savePresupuestoMutation = useMutation({
    mutationFn: (p: Presupuesto) => FacturacionService.savePresupuesto(p),
    onSuccess: () => {
      toast.success("Presupuesto guardado correctamente");
      queryClient.invalidateQueries({ queryKey: ['presupuestos', paciente.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', paciente.id] });
      setIsAddingPresupuesto(false);
      resetPre();
    },
    onError: () => toast.error("Error al guardar presupuesto")
  });

  const savePagoMutation = useMutation({
    mutationFn: (p: Pago) => FacturacionService.registrarPago(p),
    onSuccess: () => {
      toast.success("Pago registrado con éxito");
      queryClient.invalidateQueries({ queryKey: ['pagos', paciente.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', paciente.id] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos', paciente.id] });
      setIsAddingPago(false);
      resetPago();
    },
    onError: () => toast.error("Error al registrar pago")
  });

  const deletePresupuestoMutation = useMutation({
    mutationFn: (id: number) => FacturacionService.deletePresupuesto(id),
    onSuccess: () => {
      toast.success("Presupuesto eliminado con éxito");
      queryClient.invalidateQueries({ queryKey: ['presupuestos', paciente.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', paciente.id] });
    },
    onError: () => toast.error("Error al eliminar el presupuesto")
  });

  const onAddPresupuesto = (data: PresupuestoFormData) => {
    const payload: Presupuesto = {
      fecha: new Date().toISOString(),
      estado: 'PENDIENTE',
      total: data.items.reduce((acc, curr) => acc + curr.costo, 0),
      idPaciente: paciente.id,
      items: data.items
    };
    savePresupuestoMutation.mutate(payload);
  };

  const onAddPago = (data: PagoFormData) => {
    const payload: Pago = {
      fecha: new Date().toISOString(),
      monto: data.monto,
      metodoPago: data.metodoPago,
      notas: data.notas || '',
      transaccionId: data.transaccionId,
      idPaciente: paciente.id,
      idPresupuesto: data.idPresupuesto ? Number(data.idPresupuesto) : undefined
    };
    savePagoMutation.mutate(payload);
  };

  const handleMercadoPagoLink = (presupuesto: Presupuesto) => {
    const mockUrl = `https://link.mercadopago.com.ar/dentalos/pay?amount=${presupuesto.total}&description=Presupuesto_${presupuesto.id}`;
    window.open(mockUrl, '_blank');
    toast.info("Se ha generado un link de pago para el paciente. Una vez abonado, registre el ID de operación.");
    setIsAddingPago(true);
    setTab('pagos');
    resetPago({
      monto: presupuesto.total,
      metodoPago: 'MERCADO_PAGO',
      idPresupuesto: presupuesto.id?.toString() || ''
    });
  };

  const deletePresupuesto = async (id: number) => {
    if (await confirm("¿Confirmar Eliminación?", "¿Eliminar este presupuesto?")) {
      deletePresupuestoMutation.mutate(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 text-left">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100">
        
        {/* Header */}
        <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <DollarSign size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 text-left">Estado de Cuenta</h2>
              <p className="text-slate-500 font-bold text-sm text-left">Paciente: <span className="text-indigo-600 uppercase">{paciente.nombre} {paciente.apellido}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-200 transition-colors text-slate-400"><X size={28} /></button>
        </div>

        {/* Tabs */}
        <div className="px-10 py-4 bg-white border-b border-slate-100 flex gap-4 shrink-0">
          {[
            { id: 'balance', label: 'Balance General', icon: Wallet },
            { id: 'presupuestos', label: 'Presupuestos', icon: Receipt },
            { id: 'pagos', label: 'Historial de Pagos', icon: CreditCard },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Calculando saldos...</p>
            </div>
          ) : (
            <>
              {/* TAB BALANCE */}
              {tab === 'balance' && balance && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Presupuestado</p>
                      <p className="text-4xl font-black tracking-tight">${balance.totalPresupuestado.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Total Pagado</p>
                      <p className="text-4xl font-black tracking-tight">${balance.totalPagado.toLocaleString()}</p>
                    </div>
                    <div className={`p-8 rounded-[2.5rem] shadow-xl transition-all ${balance.saldoPendiente > 0 ? 'bg-rose-50 border-2 border-rose-100 text-rose-600' : 'bg-indigo-50 border-2 border-indigo-100 text-indigo-600'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Saldo Pendiente</p>
                      <p className="text-4xl font-black tracking-tight">${balance.saldoPendiente.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-indigo-900 mb-1">¿Registrar nuevo pago?</h4>
                      <p className="text-sm text-indigo-700 font-medium">El paciente realizó una entrega o canceló su deuda.</p>
                    </div>
                    <button 
                      onClick={() => { setTab('pagos'); setIsAddingPago(true); resetPago(); }}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                      Registrar Cobro
                    </button>
                  </div>
                </div>
              )}

              {/* TAB PRESUPUESTOS */}
              {tab === 'presupuestos' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Presupuestos Emitidos</h3>
                    <button 
                      onClick={() => { setIsAddingPresupuesto(true); resetPre(); }}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={16} /> Crear Presupuesto
                    </button>
                  </div>

                  {isAddingPresupuesto && (
                    <form onSubmit={handlePre(onAddPresupuesto)} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Nuevo Detalle de Tratamiento</h4>
                      <div className="space-y-4">
                        {fields.map((field, i) => (
                          <div key={field.id} className="space-y-1">
                            <div className="flex gap-4">
                              <input 
                                placeholder="Descripción del tratamiento" 
                                className={`flex-1 px-5 py-3 rounded-xl border ${errPre.items?.[i]?.descripcion ? 'border-rose-500' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-indigo-500 font-bold`}
                                {...regPre(`items.${i}.descripcion` as const)}
                              />
                              <div className="relative w-40">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input 
                                  type="number" 
                                  placeholder="Costo" 
                                  className={`w-full pl-8 pr-4 py-3 rounded-xl border ${errPre.items?.[i]?.costo ? 'border-rose-500' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-indigo-500 font-bold`}
                                  {...regPre(`items.${i}.costo` as const, { valueAsNumber: true })}
                                />
                              </div>
                              {fields.length > 1 && (
                                <button type="button" onClick={() => remove(i)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                              )}
                            </div>
                            {(errPre.items?.[i]?.descripcion || errPre.items?.[i]?.costo) && (
                              <p className="text-rose-500 text-[9px] font-bold ml-1">Descripción y costo son obligatorios</p>
                            )}
                          </div>
                        ))}
                        <button 
                          type="button"
                          onClick={() => append({ descripcion: '', costo: 0 })}
                          className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 ml-1"
                        >
                          + Añadir ítem
                        </button>
                      </div>
                      <div className="flex gap-3 pt-4">
                         <button type="submit" disabled={savePresupuestoMutation.isPending} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                            {savePresupuestoMutation.isPending ? 'Guardando...' : 'Guardar Presupuesto'}
                         </button>
                         <button type="button" onClick={() => setIsAddingPresupuesto(false)} className="px-8 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200">Cancelar</button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    {presupuestos.map(p => (
                      <div key={p.id} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Presupuesto #{p.id}</p>
                            <h4 className="text-xl font-bold text-slate-800">{new Date(p.fecha).toLocaleDateString()}</h4>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              p.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              p.estado === 'APROBADO' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                              p.estado === 'FINALIZADO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              'bg-slate-50 text-slate-400'
                            }`}>{p.estado}</span>
                            <button onClick={() => deletePresupuesto(p.id!)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        <div className="space-y-3 mb-6">
                          {p.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-sm font-medium text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                              <span>{it.descripcion}</span>
                              <span className="font-black text-slate-800">${it.costo.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                          <div className="flex gap-4">
                            {p.estado !== 'FINALIZADO' && (
                              <button 
                                onClick={() => handleMercadoPagoLink(p)}
                                className="flex items-center gap-2 text-sky-600 font-black text-[10px] uppercase tracking-widest hover:bg-sky-50 px-4 py-2 rounded-lg transition-all"
                              >
                                <DollarSign size={14} /> Cobrar con MP
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total</span>
                            <span className="text-2xl font-black text-indigo-600">${p.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {presupuestos.length === 0 && !isAddingPresupuesto && (
                      <div className="p-20 text-center text-slate-300 font-bold italic">No hay presupuestos emitidos.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB PAGOS */}
              {tab === 'pagos' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historial de Pagos</h3>
                    <button 
                      onClick={() => { setIsAddingPago(true); resetPago(); }}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                    >
                      <Plus size={16} /> Registrar Cobro
                    </button>
                  </div>

                  {isAddingPago && (
                    <form onSubmit={handlePago(onAddPago)} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto a Cobrar</label>
                         <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input type="number" {...regPago('monto', { valueAsNumber: true })} className={`w-full pl-10 pr-5 py-4 rounded-2xl border ${errPago.monto ? 'border-rose-500' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-emerald-500 font-black text-xl`} />
                         </div>
                         {errPago.monto && <p className="text-rose-500 text-[10px] font-bold ml-1">{errPago.monto.message}</p>}
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
                         <select {...regPago('metodoPago')} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta (POS/Laposh)</option>
                            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                            <option value="MERCADO_PAGO">Mercado Pago</option>
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imputar a Presupuesto (Opcional)</label>
                         <select {...regPago('idPresupuesto')} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                            <option value="">Saldo General (Sin presupuesto)</option>
                            {presupuestos.filter(p => p.estado !== 'FINALIZADO').map(p => (
                              <option key={p.id} value={p.id}>Presupuesto #{p.id} - ${p.total.toLocaleString()} ({new Date(p.fecha).toLocaleDateString()})</option>
                            ))}
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Transacción / N° Cupón</label>
                         <input {...regPago('transaccionId')} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="Ej. 12345678" />
                       </div>
                       <div className="col-span-full space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Internas</label>
                         <input {...regPago('notas')} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="Observaciones adicionales..." />
                       </div>
                       <div className="col-span-full flex gap-3 pt-2">
                          <button type="submit" disabled={savePagoMutation.isPending} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                             {savePagoMutation.isPending ? 'Registrando...' : 'Registrar Pago'}
                          </button>
                          <button type="button" onClick={() => setIsAddingPago(false)} className="px-8 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200">Cancelar</button>
                       </div>
                    </form>
                  )}

                  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                    <table className="w-full">
                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <tr>
                            <th className="px-8 py-5 text-left">Fecha</th>
                            <th className="px-8 py-5 text-left">Método</th>
                            <th className="px-8 py-5 text-left">Presupuesto</th>
                            <th className="px-8 py-5 text-left">Ref / ID</th>
                            <th className="px-8 py-5 text-right pr-10">Monto</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {pagos.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                               <td className="px-8 py-6 font-bold text-slate-700">{new Date(p.fecha).toLocaleDateString()}</td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                                    p.metodoPago === 'MERCADO_PAGO' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'
                                  }`}>{p.metodoPago}</span>
                               </td>
                               <td className="px-8 py-6 text-slate-500 font-bold text-xs">
                                 {p.idPresupuesto ? `Presup. #${p.idPresupuesto}` : <span className="text-slate-300">Gral.</span>}
                               </td>
                               <td className="px-8 py-6 text-slate-400 text-xs font-mono">{p.transaccionId || '-'}</td>
                               <td className="px-8 py-6 text-right pr-10 font-black text-slate-800 text-lg">${p.monto.toLocaleString()}</td>
                            </tr>
                          ))}
                          {pagos.length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic">No se han registrado pagos aún.</td></tr>
                          )}
                       </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Dental-OS Financial Core v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default BillingModal;

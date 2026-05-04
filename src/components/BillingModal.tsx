import React, { useEffect, useState } from 'react';
import { X, Plus, DollarSign, FileText, Trash2, Check, CreditCard, Receipt, AlertCircle, Wallet } from 'lucide-react';
import { FacturacionService, type Presupuesto, type Pago, type EstadoCuenta, type ItemPresupuesto } from '../api/facturacionService';
import type { Paciente } from '../api/pacienteService';

interface Props {
  paciente: Paciente;
  isOpen: boolean;
  onClose: () => void;
}

const BillingModal = ({ paciente, isOpen, onClose }: Props) => {
  const [tab, setTab] = useState<'balance' | 'presupuestos' | 'pagos'>('balance');
  const [balance, setBalance] = useState<EstadoCuenta | null>(null);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para creación
  const [isAddingPresupuesto, setIsAddingPresupuesto] = useState(false);
  const [isAddingPago, setIsAddingPago] = useState(false);
  const [newItems, setNewItems] = useState<ItemPresupuesto[]>([{ descripcion: '', costo: 0 }]);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MERCADO_PAGO'>('EFECTIVO');
  const [pagoNotas, setPagoNotas] = useState('');
  const [pagoTransaccionId, setPagoTransaccionId] = useState('');
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState<string>('');

  useEffect(() => {
    if (isOpen) loadAllData();
  }, [isOpen]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const pId = paciente.id;
      const [bal, pre, pay] = await Promise.all([
        FacturacionService.getEstadoCuenta(pId),
        FacturacionService.getPresupuestos(pId),
        FacturacionService.getPagos(pId)
      ]);
      setBalance(bal);
      setPresupuestos(pre);
      setPagos(pay);
    } catch (error) {
      console.error("Error al cargar facturación", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPresupuesto = async () => {
    try {
      const pId = paciente.id;
      const payload: Presupuesto = {
        fecha: new Date().toISOString(),
        estado: 'PENDIENTE',
        total: newItems.reduce((acc, curr) => acc + curr.costo, 0),
        idPaciente: pId,
        items: newItems.filter(i => i.descripcion !== '')
      };
      await FacturacionService.savePresupuesto(payload);
      setIsAddingPresupuesto(false);
      setNewItems([{ descripcion: '', costo: 0 }]);
      loadAllData();
    } catch (error) {
      alert("Error al guardar presupuesto");
    }
  };

  const handleAddPago = async () => {
    try {
      const pId = paciente.id;
      const payload: Pago = {
        fecha: new Date().toISOString(),
        monto: Number(pagoMonto),
        metodoPago: pagoMetodo,
        notas: pagoNotas,
        transaccionId: pagoTransaccionId,
        idPaciente: pId,
        idPresupuesto: selectedPresupuestoId ? Number(selectedPresupuestoId) : undefined
      };
      await FacturacionService.registrarPago(payload);
      setIsAddingPago(false);
      setPagoMonto('');
      setPagoNotas('');
      setPagoTransaccionId('');
      setSelectedPresupuestoId('');
      loadAllData();
    } catch (error) {
      alert("Error al registrar pago");
    }
  };

  const handleMercadoPagoLink = (presupuesto: Presupuesto) => {
    const mockUrl = `https://link.mercadopago.com.ar/dentalos/pay?amount=${presupuesto.total}&description=Presupuesto_${presupuesto.id}`;
    window.open(mockUrl, '_blank');
    alert("Se ha generado un link de pago para el paciente. Una vez abonado, registre el ID de operación.");
    setIsAddingPago(true);
    setTab('pagos');
    setPagoMetodo('MERCADO_PAGO');
    setPagoMonto(presupuesto.total.toString());
    setSelectedPresupuestoId(presupuesto.id?.toString() || '');
  };

  const deletePresupuesto = async (id: number) => {
    if (confirm("¿Eliminar este presupuesto?")) {
      await FacturacionService.deletePresupuesto(id);
      loadAllData();
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
                      onClick={() => { setTab('pagos'); setIsAddingPago(true); }}
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
                      onClick={() => setIsAddingPresupuesto(true)}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={16} /> Crear Presupuesto
                    </button>
                  </div>

                  {isAddingPresupuesto && (
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Nuevo Detalle de Tratamiento</h4>
                      <div className="space-y-4">
                        {newItems.map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <input 
                              placeholder="Descripción del tratamiento" 
                              className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              value={item.descripcion}
                              onChange={e => {
                                const up = [...newItems];
                                up[i].descripcion = e.target.value;
                                setNewItems(up);
                              }}
                            />
                            <div className="relative w-40">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                              <input 
                                type="number" 
                                placeholder="Costo" 
                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                value={item.costo || ''}
                                onChange={e => {
                                  const up = [...newItems];
                                  up[i].costo = Number(e.target.value);
                                  setNewItems(up);
                                }}
                              />
                            </div>
                            {i > 0 && (
                              <button onClick={() => setNewItems(newItems.filter((_, idx) => idx !== i))} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => setNewItems([...newItems, { descripcion: '', costo: 0 }])}
                          className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 ml-1"
                        >
                          + Añadir ítem
                        </button>
                      </div>
                      <div className="flex gap-3 pt-4">
                         <button onClick={handleAddPresupuesto} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20">Guardar Presupuesto</button>
                         <button onClick={() => setIsAddingPresupuesto(false)} className="px-8 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200">Cancelar</button>
                      </div>
                    </div>
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
                  </div>
                </div>
              )}

              {/* TAB PAGOS */}
              {tab === 'pagos' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historial de Pagos</h3>
                    <button 
                      onClick={() => setIsAddingPago(true)}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                    >
                      <Plus size={16} /> Registrar Cobro
                    </button>
                  </div>

                  {isAddingPago && (
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto a Cobrar</label>
                         <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input type="number" className="w-full pl-10 pr-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-xl" value={pagoMonto} onChange={e => setPagoMonto(e.target.value)} />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
                         <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={pagoMetodo} onChange={e => setPagoMetodo(e.target.value as any)}>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta (POS/Laposh)</option>
                            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                            <option value="MERCADO_PAGO">Mercado Pago</option>
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imputar a Presupuesto (Opcional)</label>
                         <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={selectedPresupuestoId} onChange={e => setSelectedPresupuestoId(e.target.value)}>
                            <option value="">Saldo General (Sin presupuesto)</option>
                            {presupuestos.filter(p => p.estado !== 'FINALIZADO').map(p => (
                              <option key={p.id} value={p.id}>Presupuesto #{p.id} - ${p.total.toLocaleString()} ({new Date(p.fecha).toLocaleDateString()})</option>
                            ))}
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Transacción / N° Cupón</label>
                         <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="Ej. 12345678" value={pagoTransaccionId} onChange={e => setPagoTransaccionId(e.target.value)} />
                       </div>
                       <div className="col-span-full space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Internas</label>
                         <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="Observaciones adicionales..." value={pagoNotas} onChange={e => setPagoNotas(e.target.value)} />
                       </div>
                       <div className="col-span-full flex gap-3 pt-2">
                          <button onClick={handleAddPago} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20">Registrar Pago</button>
                          <button onClick={() => setIsAddingPago(false)} className="px-8 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200">Cancelar</button>
                       </div>
                    </div>
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

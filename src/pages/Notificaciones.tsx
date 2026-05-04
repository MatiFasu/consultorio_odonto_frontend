import { useEffect, useState } from 'react';
import { Bell, Settings, Save, Mail, MessageSquare, ShieldCheck, Clock, Check, AlertCircle } from 'lucide-react';
import { ConfigNotificacionService, type ConfiguracionNotificacion } from '../api/configNotificacionService';
import { useAuth } from '../store/AuthContext';
import api from '../api/apiClient';

const NotificacionesPage = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<ConfiguracionNotificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await ConfigNotificacionService.get();
      setConfig(data);
    } catch (err) {
      showNotification("Error al cargar la configuración central", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await ConfigNotificacionService.update(config);
      showNotification("Preferencias de comunicación actualizadas con éxito", "success");
    } catch (err) {
      showNotification("No se pudieron guardar los cambios", "error");
    } finally {
      setSaving(false);
    }
  };

  if (user?.rol !== 'ADMIN') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
        <ShieldCheck size={64} className="opacity-20" />
        <p className="font-black italic">Acceso restringido: Solo el administrador puede configurar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {notification.type === 'success' ? <Check className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
          <p className="font-bold text-sm">{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <Settings size={140} />
          </div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Centro de Notificaciones</h2>
            <p className="text-slate-400 font-medium tracking-tight max-w-md leading-relaxed">Configura los canales de comunicación automáticos para odontólogos y pacientes.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <button 
              onClick={async () => {
                try {
                  const res = await api.get('/api/notifications/test');
                  showNotification(res.data, 'success');
                } catch (e) {
                  showNotification("No se pudo conectar con el motor de envíos", 'error');
                }
              }}
              className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all active:scale-95"
            >
              <Bell size={20} /> Probar Envío Hoy
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || !config}
              className="flex items-center gap-3 bg-primary-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={20} /> Guardar Cambios</>}
            </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Channel Config */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm text-left">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><MessageSquare size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Canal de WhatsApp (Twilio)</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Envío de agendas y recordatorios</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado del Canal</label>
                        <button 
                            onClick={() => config && setConfig({...config, activa: !config.activa})}
                            className={`w-full py-4 rounded-2xl font-black text-sm transition-all border-2 flex items-center justify-center gap-3 ${config?.activa ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-inner' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${config?.activa ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            {config?.activa ? 'CANAL ACTIVADO' : 'CANAL PAUSADO'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                           <Clock size={12} /> Horario de Envío
                        </label>
                        <input 
                            type="time" 
                            value={config?.horarioEnvio.substring(0, 5) || "08:00"}
                            onChange={(e) => config && setConfig({...config, horarioEnvio: e.target.value + ":00"})}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Antelación de Agenda</label>
                        <div className="flex gap-2">
                           {[0, 1, 2].map(d => (
                               <button 
                                key={d}
                                onClick={() => config && setConfig({...config, diasAnticipacion: d})}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${config?.diasAnticipacion === d ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                               >
                                {d === 0 ? 'Hoy' : `${d}d antes`}
                               </button>
                           ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Días de la Semana</label>
                        <div className="flex justify-between bg-slate-50 p-2 rounded-2xl">
                            {['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].map(day => (
                                <button
                                    key={day}
                                    onClick={() => {
                                        if (!config) return;
                                        const days = config.diasEjecucion.split(',');
                                        const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
                                        setConfig({...config, diasEjecucion: newDays.join(',')});
                                    }}
                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${config?.diasEjecucion.includes(day) ? 'bg-white text-primary-600 shadow-md ring-1 ring-primary-100' : 'text-slate-300'}`}
                                >
                                    {day.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder for GMAIL/Other channels */}
            <div className="bg-slate-50 p-12 rounded-[3.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 group hover:border-primary-200 transition-colors cursor-pointer">
                <div className="p-5 bg-white rounded-3xl text-slate-300 group-hover:text-primary-400 transition-colors shadow-sm">
                    <Mail size={40} />
                </div>
                <div className="space-y-1">
                    <h4 className="font-black text-slate-800">Canal de Correo Electrónico (Gmail)</h4>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Módulo en desarrollo. Próximamente integrado.</p>
                </div>
            </div>
        </div>

        {/* Sidebar help / Stats */}
        <div className="space-y-8 text-left">
            <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <h3 className="text-xl font-black mb-4 flex items-center gap-2 italic"><Bell size={24} /> Estado del Motor</h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Próximo Envío</span>
                        <span className="font-black text-lg">{config?.horarioEnvio.substring(0, 5)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Destinatarios</span>
                        <span className="font-black">Odontólogos Staff</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Canal Principal</span>
                        <span className="font-black flex items-center gap-2">
                           <div className="w-2 h-2 bg-emerald-400 rounded-full"></div> WhatsApp
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
                <h4 className="font-black text-slate-800 tracking-tight">¿Cómo funciona? 🔍</h4>
                <div className="space-y-4 text-xs font-medium text-slate-500 leading-relaxed">
                    <p>• El sistema utiliza <span className="text-slate-900 font-bold">Twilio API</span> para el envío de mensajes a nivel global.</p>
                    <p>• Las agendas se procesan automáticamente en el horario configurado por el <span className="text-primary-600 font-bold italic underline">Notification Engine</span>.</p>
                    
                    <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 space-y-3">
                        <p className="text-primary-800 font-black text-[10px] uppercase">Guía de Prueba Rápida:</p>
                        <p className="text-slate-600">1. En **Odontólogos**, configura tu teléfono con <span className="font-bold">+</span> y código de país (ej: <span className="italic">+549...</span>).</p>
                        <p className="text-slate-600">2. Envía por WhatsApp el mensaje <span className="bg-white px-2 py-1 rounded border font-black text-slate-800">join memory-short</span> al número de Twilio.</p>
                        <p className="text-slate-600">3. En **Agenda**, crea un turno para <span className="font-bold underline text-primary-600">HOY</span> asignado a ese odontólogo.</p>
                        <p className="text-slate-600">4. Presiona el botón <span className="font-bold text-slate-900">"Probar Envío Hoy"</span> (arriba) para recibir el resumen instantáneo.</p>
                    </div>

                    <p>• Solo los especialistas con turnos agendados y suscripción activa recibirán el resumen diario.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default NotificacionesPage;

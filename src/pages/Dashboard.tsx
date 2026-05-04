import { useEffect, useState } from 'react';
import { Calendar, Clock, TrendingUp, UserCheck, Stethoscope, ChevronRight, Activity, ArrowUpRight, FileText, Bell, Settings, Save, AlertCircle, X } from 'lucide-react';
import { PacienteService } from '../api/pacienteService';
import { OdontologoService } from '../api/odontologoService';
import { TurnoService } from '../api/turnoService';
import { useAuth } from '../store/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfigNotificacionService, type ConfiguracionNotificacion } from '../api/configNotificacionService';
import ClinicalHistoryModal from '../components/ClinicalHistoryModal';

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-[0.03] transition-transform group-hover:scale-125 ${color}`}></div>
    <div className="flex justify-between items-start mb-5">
      <div className={`p-4 rounded-2xl ${color.replace('bg-', 'text-')} ${color.replace('bg-', 'bg-').replace('-500', '-50')}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
          <ArrowUpRight size={12} />
          <span className="text-[10px] font-black">{trend}</span>
        </div>
      )}
    </div>
    <div className="text-left relative z-10">
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pacientes: 0, odontologos: 0, turnosHoy: 0, misTurnosHoy: 0 });
  const [proximosTurnos, setProximosTurnos] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [myInfo, setMyInfo] = useState<any>(null);
  const [configNotif, setConfigNotif] = useState<ConfiguracionNotificacion | null>(null);
  const [alertasAdmin, setAlertasAdmin] = useState<{sinHorario: any[], sinTel: any[]}>({ sinHorario: [], sinTel: [] });

  // Historia Clínica
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);

  const today = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [p, o, tAll, config] = await Promise.all([
        PacienteService.getAll().catch(() => []),
        OdontologoService.getAll().catch(() => []),
        TurnoService.getAll().catch(() => []),
        ConfigNotificacionService.get().catch(() => null)
      ]);

      setConfigNotif(config);

      if (user?.rol === 'ADMIN') {
        const sinHorario = o.filter((od: any) => !od.idHorario);
        const sinTel = o.filter((od: any) => !od.telefono || od.telefono.length < 5);
        setAlertasAdmin({ sinHorario, sinTel });
      }

      let relevantTurnos = tAll;
      let myTodayTurnos = 0;

      if (user?.rol === 'ODONTOLOGO' && user.id_usuario) {
        const odonto = await OdontologoService.getByUserId(user.id_usuario);
        if (odonto) {
          setMyInfo(odonto);
          const misTurnos = tAll.filter((t: any) => t.idOdontologo === odonto.id);
          myTodayTurnos = misTurnos.filter((t: any) => t.fecha_turno === today).length;
          relevantTurnos = misTurnos;
        }
      }

      const hoyTurnos = relevantTurnos.filter((turno: any) => turno.fecha_turno === today);
      
      const weekStats = [0, 0, 0, 0, 0, 0, 0];
      relevantTurnos.forEach((t: any) => {
        const d = new Date(t.fecha_turno + 'T00:00:00').getDay();
        weekStats[d]++;
      });
      const max = Math.max(...weekStats, 5);
      setWeeklyActivity(weekStats.map(v => (v / max) * 100));

      setStats({
        pacientes: p.length,
        odontologos: o.length,
        turnosHoy: tAll.filter((t: any) => t.fecha_turno === today).length,
        misTurnosHoy: myTodayTurnos
      });

      setProximosTurnos(hoyTurnos.sort((a: any, b: any) => a.hora_turno.localeCompare(b.hora_turno)));
    } catch (error) {
      console.error("Error al cargar dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.rol === 'ODONTOLOGO') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-10 text-left">
        {/* Simplified Dentist Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-20 -mt-20 blur-[60px]"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black tracking-tight leading-none mb-4">Dr. {user?.usuario}</h2>
            <div className="flex items-center gap-3">
               <span className="px-4 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary-300">Agenda de Hoy</span>
               <p className="text-slate-400 font-bold text-sm">Tienes {stats.misTurnosHoy} pacientes programados.</p>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2 bg-white/5 px-8 py-4 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-300">Hoy</p>
              <p className="text-2xl font-black text-white">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        {/* 2 Focused Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <StatCard icon={Calendar} label="Turnos para hoy" value={stats.misTurnosHoy} color="bg-primary-500" />
           <StatCard icon={Stethoscope} label="Mi Especialidad" value={myInfo?.especialidad || 'General'} color="bg-emerald-500" />
        </div>

        {/* Simplified Daily Appointments Table */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-slate-50 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Clock size={20} /></div>
              <h3 className="font-black text-slate-800 text-xl tracking-tight">Pacientes del Día</h3>
           </div>
           
           <div className="overflow-x-auto">
             {loading ? (
                <div className="p-10 space-y-4"><Skeleton className="w-full h-20 rounded-2xl" /><Skeleton className="w-full h-20 rounded-2xl" /></div>
             ) : proximosTurnos.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><Calendar size={32} /></div>
                  <p className="text-slate-400 font-bold italic">No tienes turnos agendados para hoy.</p>
                </div>
             ) : (
                <table className="w-full text-left">
                  <thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
                    <tr>
                      <th className="px-10 py-5">Hora</th>
                      <th className="px-8 py-5">Paciente</th>
                      <th className="px-8 py-5 text-right pr-12">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {proximosTurnos.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-6 font-black text-2xl text-slate-800 tracking-tighter group-hover:text-primary-600 transition-colors">{t.hora_turno}</td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ring-4 ring-white">
                                 {t.nombrePaciente?.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-black text-slate-800 text-base leading-none mb-1">{t.nombrePaciente}</p>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{t.afeccion}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right pr-10">
                           <button 
                             onClick={async () => { 
                               const pac = await PacienteService.getById(t.idPaciente);
                               setSelectedPaciente(pac); 
                               setIsHistoryOpen(true); 
                             }}
                             className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                           >
                             <FileText size={16} /> Atender
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
           </div>
        </div>

        {/* Modal integration */}
        {selectedPaciente && (
          <ClinicalHistoryModal 
            paciente={selectedPaciente}
            isOpen={isHistoryOpen}
            onClose={() => { setIsHistoryOpen(false); setSelectedPaciente(null); }}
          />
        )}
      </div>
    );
  }

  const renderAdminStats = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={UserCheck} label="Pacientes" value={stats.pacientes} color="bg-blue-500" trend="+12% mes" />
        <StatCard icon={Stethoscope} label="Doctores" value={stats.odontologos} color="bg-emerald-500" trend="Staff" />
        <StatCard icon={Calendar} label="Turnos Hoy" value={stats.turnosHoy} color="bg-amber-500" trend="Clínica" />
        <div className={`p-7 rounded-[2.5rem] border shadow-sm flex flex-col justify-center text-left transition-all ${configNotif?.activa ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${configNotif?.activa ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Motor WhatsApp</p>
          </div>
          <p className={`text-xl font-black ${configNotif?.activa ? 'text-slate-800' : 'text-rose-600'}`}>
            {configNotif?.activa ? 'PROGRAMADO' : 'PAUSADO'}
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-1">Próximo: {configNotif?.horarioEnvio.substring(0, 5) || '--:--'}</p>
        </div>
      </div>

      {(alertasAdmin.sinHorario.length > 0 || alertasAdmin.sinTel.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {alertasAdmin.sinHorario.length > 0 && (
             <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4 text-left">
               <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm"><AlertCircle size={20} /></div>
               <div>
                 <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Vacíos Operativos ({alertasAdmin.sinHorario.length})</h4>
                 <p className="text-xs text-amber-700 font-medium mb-3">Los siguientes doctores no tienen horario y no pueden recibir turnos:</p>
                 <div className="flex flex-wrap gap-2">
                   {alertasAdmin.sinHorario.map((od: any) => (
                     <span key={od.id || od.id_persona} className="px-3 py-1 bg-white/50 rounded-lg text-[10px] font-bold text-amber-800 border border-amber-200">
                       Dr. {od.apellido}
                     </span>
                   ))}
                 </div>
               </div>
             </div>
           )}
           {alertasAdmin.sinTel.length > 0 && (
             <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-start gap-4 text-left">
               <div className="p-3 bg-white rounded-xl text-rose-600 shadow-sm"><Bell size={20} /></div>
               <div>
                 <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Falla de Comunicación ({alertasAdmin.sinTel.length})</h4>
                 <p className="text-xs text-rose-700 font-medium mb-3">Doctores sin teléfono válido. No recibirán su agenda diaria:</p>
                 <div className="flex flex-wrap gap-2">
                   {alertasAdmin.sinTel.map((od: any) => (
                     <span key={od.id || od.id_persona} className="px-3 py-1 bg-white/50 rounded-lg text-[10px] font-bold text-rose-800 border border-rose-200">
                       Dr. {od.apellido}
                     </span>
                   ))}
                 </div>
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );

  const renderSecretariaStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <StatCard icon={Calendar} label="Turnos del Día" value={stats.turnosHoy} color="bg-amber-500" trend="Gestión" />
      <StatCard icon={UserCheck} label="Nuevos Pacientes" value={stats.pacientes} color="bg-blue-500" trend="Total" />
      <div className="bg-primary-500 p-7 rounded-[2.5rem] shadow-lg shadow-primary-500/20 flex flex-col justify-center text-left text-white">
        <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mb-2">Acción Rápida</p>
        <button onClick={() => window.location.href='/turnos'} className="bg-white text-primary-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors">Agendar Cita</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10 text-left">
      
      {/* Welcome Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
              <Activity size={14} className="text-primary-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-200">Panel de {user?.rol}</span>
            </div>
            <h2 className="text-5xl font-black tracking-tight leading-tight">
              Hola, <br /> 
              <span className="text-primary-400 font-black italic">{user?.usuario}</span>
            </h2>
            <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
              {user?.rol === 'ADMIN' && "Bienvenido al panel de control central. Aquí tienes el pulso de toda la clínica."}
              {user?.rol === 'SECRETARIA' && `Hoy hay ${stats.turnosHoy} turnos agendados en total. ¡Buen trabajo organizando!`}
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl min-w-[240px]">
              <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/40 mb-2">
                <Calendar className="text-white" size={32} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-300 mb-1">Hoy</p>
                <p className="text-xl font-black text-white">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                <p className="text-xs text-slate-400 font-bold capitalize mt-1 opacity-60">{new Date().toLocaleDateString('es-ES', { weekday: 'long' })}</p>
              </div>
          </div>
        </div>

        {/* Weekly Chart Area */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">
               Flujo Clínica
            </h3>
            <p className="text-xs text-slate-400 font-medium tracking-tight">Pacientes por día</p>
          </div>
          <div className="flex items-end justify-between h-32 gap-1.5 px-1">
            {weeklyActivity.map((height, i) => (
              <div key={i} className="flex flex-col items-center gap-2 group w-full">
                <div className="w-full bg-slate-50 rounded-full h-24 relative overflow-hidden">
                  <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out rounded-full shadow-lg ${i === new Date().getDay() ? 'bg-primary-500 shadow-primary-500/50' : 'bg-slate-200 group-hover:bg-primary-200'}`}
                    style={{ height: loading ? '0%' : `${height}%` }}
                  ></div>
                </div>
                <span className={`text-[8px] font-black uppercase ${i === new Date().getDay() ? 'text-primary-500' : 'text-slate-300'}`}>
                  {['D','L','M','X','J','V','S'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conditional Stats Grid */}
      {user?.rol === 'ADMIN' && renderAdminStats()}
      {user?.rol === 'SECRETARIA' && renderSecretariaStats()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[450px] flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl"><Clock size={20} /></div>
              <div>
                <h3 className="font-black text-slate-800 text-xl tracking-tight leading-none">
                  Turnos Próximos
                </h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Ordenados por horario</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="p-20 space-y-4"><Skeleton className="w-full h-12 rounded-xl" /><Skeleton className="w-full h-12 rounded-xl" /></div>
            ) : proximosTurnos.length === 0 ? (
              <div className="p-24 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><Calendar size={32} /></div>
                <p className="text-slate-400 font-bold italic">No hay pacientes registrados para este bloque.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-50">
                  <tr>
                    <th className="px-10 py-5">Hora</th>
                    <th className="px-8 py-5">Paciente</th>
                    <th className="px-8 py-5">Doctor</th>
                    <th className="px-8 py-5 text-right pr-12">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {proximosTurnos.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-10 py-6 font-black text-slate-800 text-lg tracking-tighter group-hover:text-primary-600 transition-colors">{item.hora_turno}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-inner ring-4 ring-white">{(item.nombrePaciente || '?').charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-800 text-sm leading-none mb-1">{item.nombrePaciente}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{item.afeccion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-700 text-sm">Dr. {item.nombreOdontologo}</p>
                      </td>
                      <td className="px-8 py-6 text-right pr-10">
                        {user?.rol === 'SECRETARIA' ? (
                          <button 
                            onClick={() => window.open(`https://wa.me/${item.telefonoPaciente}?text=Hola%20${item.nombrePaciente},%20te%20recordamos%20tu%20turno%20hoy%20a%20las%20${item.hora_turno}%20en%20Consultorio%20Odontológico.`)}
                            className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            Avisar WhatsApp
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase">
                            Confirmado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary-50 text-primary-500 rounded-xl"><Activity size={18} /></div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Carga de Trabajo</h3>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidad Clínica</p>
                  <p className="text-sm font-black text-primary-600">{Math.min(100, Math.round((stats.turnosHoy / 20) * 100))}%</p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.turnosHoy / 20) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] text-white shadow-xl shadow-indigo-500/20 text-left">
             <h4 className="font-black text-lg mb-2">Resumen Diario 📋</h4>
             <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80">
               {user?.rol === 'ADMIN' && "La clínica está operando al ritmo esperado. No hay alertas críticas de personal."}
               {user?.rol === 'SECRETARIA' && "Utiliza el botón de WhatsApp para reducir el ausentismo en los turnos de la tarde."}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


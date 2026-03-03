import { useEffect, useState } from 'react';
import { Users, Calendar, Clock, TrendingUp, CheckCircle2, UserCheck, Stethoscope } from 'lucide-react';
import { PacienteService } from '../api/pacienteService';
import { OdontologoService } from '../api/odontologoService';
import { TurnoService } from '../api/turnoService';
import { useAuth } from '../store/AuthContext';

const StatCard = ({ icon: Icon, label, value, trend, color, bgLight }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color}`}></div>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${bgLight} ${color.replace('bg-', 'text-')}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="text-[10px] font-black px-2 py-1 bg-slate-50 text-slate-400 rounded-lg uppercase tracking-wider">
          Actualizado
        </span>
      )}
    </div>
    <div className="text-left">
      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pacientes: 0, odontologos: 0, turnosHoy: 0 });
  const [proximosTurnos, setProximosTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [p, o, t] = await Promise.all([
        PacienteService.getAll().catch(() => []),
        OdontologoService.getAll().catch(() => []),
        TurnoService.getAll().catch(() => [])
      ]);

      const hoyTurnos = t.filter((turno: any) => {
        // Normalizamos la fecha para comparar
        const fecha = turno.fecha_turno ? new Date(turno.fecha_turno).toISOString().split('T')[0] : '';
        return fecha === today;
      });

      setStats({
        pacientes: p.length,
        odontologos: o.length,
        turnosHoy: hoyTurnos.length
      });

      setProximosTurnos(hoyTurnos.sort((a: any, b: any) => a.hora_turno.localeCompare(b.hora_turno)).slice(0, 5));
    } catch (error) {
      console.error("Error al cargar dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-[2.5rem] p-10 text-white shadow-xl shadow-primary-500/20 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 space-y-3">
          <h2 className="text-4xl font-black tracking-tight">¡Hola de nuevo, {user?.usuario}! 👋</h2>
          <p className="text-primary-100 font-medium max-w-md opacity-90">
            {stats.turnosHoy > 0 
              ? `Hoy hay ${stats.turnosHoy} turnos programados en la agenda. ¡Buen inicio de jornada!` 
              : "No hay turnos para hoy. Aprovecha para organizar la semana."}
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary-100 mb-1">Fecha Actual</p>
              <p className="font-bold">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={UserCheck} label="Pacientes Registrados" value={stats.pacientes} color="bg-blue-500" bgLight="bg-blue-50" trend />
        <StatCard icon={Stethoscope} label="Staff Médico Activo" value={stats.odontologos} color="bg-emerald-500" bgLight="bg-emerald-50" trend />
        <StatCard icon={Calendar} label="Citas para hoy" value={stats.turnosHoy} color="bg-amber-500" bgLight="bg-amber-50" trend />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Appointments */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="font-black text-slate-800 text-xl tracking-tight text-left">Próximas Citas</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 text-left">Agenda Prioritaria</p>
            </div>
            <span className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-wider">Hoy</span>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest animate-pulse">Sincronizando base de datos...</div>
            ) : proximosTurnos.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-medium italic">No hay pacientes registrados en este momento.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                  <tr>
                    <th className="px-8 py-4">Horario</th>
                    <th className="px-8 py-4">Paciente</th>
                    <th className="px-8 py-4">Odontólogo</th>
                    <th className="px-8 py-4 text-right pr-12">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {proximosTurnos.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6 font-black text-slate-400 group-hover:text-primary-500 transition-colors">{item.hora_turno}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">{(item.pacien?.nombre || '?').charAt(0)}</div>
                          <span className="font-bold text-slate-700 text-sm">{item.pacien?.nombre} {item.pacien?.apellido}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black">{(item.odonto?.nombre || '?').charAt(0)}</div>
                          <span className="font-bold text-slate-700 text-sm">Dr. {item.odonto?.nombre}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right pr-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
                          <Clock size={12} /> Confirmado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Resumen Sidebar */}
        <div className="space-y-6 text-left">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
               <TrendingUp size={20} className="text-primary-500" />
               Actividad del Sistema
            </h3>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pacientes</p>
                  <p className="text-sm font-black text-slate-700">{stats.pacientes} Registrados</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">{Math.round((stats.pacientes/100)*100)}%</div>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Especialistas</p>
                  <p className="text-sm font-black text-slate-700">{stats.odontologos} Profesionales</p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xs">100%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

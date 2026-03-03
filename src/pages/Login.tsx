import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Lock, AlertCircle } from 'lucide-react';
import { AuthService } from '../api/authService';
import { useAuth } from '../store/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await AuthService.login({ username, contrasenia: password });
      
      if (success) {
        // Obtenemos los datos completos del usuario (rol, etc.)
        const fullUser = await AuthService.getUserInfo(username);
        login(fullUser || { usuario: username, rol: 'ADMIN' }); // Fallback por si no lo encuentra
        navigate('/');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Icon Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 text-white rounded-2xl shadow-xl shadow-primary-500/20 mb-4 animate-in zoom-in duration-500">
            <Calendar size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">OdontoSys</h1>
          <p className="text-slate-500 font-medium">Gestión Profesional para Consultorios</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Usuario</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium"
                  placeholder="admin_odontologo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Entrar al Sistema'
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Accesos de Prueba (Modo Demo)</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">ADMIN: admin / admin</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">SECRETARIA: sec_ana / 123</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">ODONTÓLOGO: dr_garcia / 123</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
          © 2026 OdontoSys Medical Suite
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

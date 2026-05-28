import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UsuarioService } from '../api/usuarioService';
import type { Usuario } from '../api/usuarioService';
import { Shield, UserPlus, Trash2, X, Check, Lock, UserCog, Edit } from 'lucide-react';
import { useUI } from '../store/UIContext';

// Schema de validación con Zod
const usuarioSchema = z.object({
  usuario: z.string().min(3, "El usuario debe tener al menos 3 caracteres").max(20),
  contrasenia: z.string().optional().refine((val) => {
    // Si estamos editando, puede ser vacío. Si es nuevo, debe tener al menos 4 caracteres.
    return true; // La validación lógica se hará en el componente o con superRefine
  }, "Contraseña inválida"),
  rol: z.enum(['ADMIN', 'SECRETARIA', 'ODONTOLOGO'])
}).superRefine((data, ctx) => {
  // Validación personalizada para la contraseña (solo requerida en creación)
  // Nota: en este componente usamos una variable externa `isEditing` que no está en el schema.
  // Pero podemos simplificar: si viene algo, que tenga al menos 4 caracteres.
  if (data.contrasenia && data.contrasenia.length > 0 && data.contrasenia.length < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La contraseña debe tener al menos 4 caracteres",
      path: ["contrasenia"]
    });
  }
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

const UsuariosPage = () => {
  const queryClient = useQueryClient();
  const { toast, confirm } = useUI();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // React Hook Form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      usuario: '',
      contrasenia: '',
      rol: 'SECRETARIA'
    }
  });

  const selectedRol = watch('rol');

  // Queries con React Query
  const { data: usuarios = [], isLoading: loading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => UsuarioService.getAll(),
  });

  // Mutaciones
  const deleteMutation = useMutation({
    mutationFn: (id: number) => UsuarioService.delete(id),
    onSuccess: () => {
      toast.success("Usuario eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: () => toast.error("Error al borrar el usuario")
  });

  const onSubmit = async (data: UsuarioFormData) => {
    setSaving(true);
    try {
      if (isEditing && editingId) {
        await UsuarioService.update({ ...data, id: editingId });
        toast.success("Usuario actualizado correctamente");
      } else {
        if (!data.contrasenia || data.contrasenia.length < 4) {
           toast.error("La contraseña es requerida para nuevos usuarios (mín. 4 caracteres)");
           setSaving(false);
           return;
        }
        await UsuarioService.create(data);
        toast.success("Usuario creado correctamente");
      }
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      closeModal();
    } catch (error) {
      toast.error("Error al procesar la solicitud en el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u: Usuario) => {
    reset({
      usuario: u.usuario,
      contrasenia: '', // No cargamos la contraseña por seguridad
      rol: u.rol as any
    });
    setEditingId(u.id!);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm("¿Confirmar Eliminación?", "¿Seguro que deseas eliminar este acceso?")) {
      deleteMutation.mutate(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    reset({ usuario: '', contrasenia: '', rol: 'SECRETARIA' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Shield size={28} /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Cuentas de Acceso</h2>
            <p className="text-slate-500 text-sm">Gestiona quién puede entrar al sistema.</p>
          </div>
        </div>
        <button onClick={() => { setIsModalOpen(true); setIsEditing(false); setEditingId(null); reset(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all w-full md:w-auto justify-center flex items-center gap-2">
          <UserPlus size={20} /> Nuevo Acceso
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-5">Nombre de Usuario</th>
                <th className="px-6 py-5">Rol de Sistema</th>
                <th className="px-6 py-5 text-right pr-10">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Conectando con el servidor...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={3} className="p-20 text-center text-slate-400 italic">No hay usuarios registrados en la base de datos.</td></tr>
              ) : usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{u.usuario?.charAt(0).toUpperCase()}</div>
                      <span className="font-bold text-slate-700">@{u.usuario}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      u.rol === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 
                      u.rol === 'SECRETARIA' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <UserCog size={12} /> {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right pr-8">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(u)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                            <Edit size={18} />
                        </button>
                        {u.usuario !== 'admin' && (
                        <button onClick={() => u.id && handleDelete(u.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                        </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? 'Editar Acceso' : 'Crear Acceso'}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <p className="text-slate-500 text-sm">Define las credenciales para el miembro.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de Usuario</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input 
                    type="text" 
                    {...register('usuario')}
                    className={`w-full pl-8 pr-4 py-3.5 bg-slate-50 border ${errors.usuario ? 'border-rose-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500`} 
                    placeholder="ana_garcia" 
                  />
                </div>
                {errors.usuario && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.usuario.message}</p>}
              </div>
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña {isEditing && '(dejar en blanco para no cambiar)'}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    {...register('contrasenia')}
                    className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border ${errors.contrasenia ? 'border-rose-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500`} 
                    placeholder="••••••••" 
                  />
                </div>
                {errors.contrasenia && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.contrasenia.message}</p>}
              </div>
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Rol de Usuario</label>
                <div className="grid grid-cols-1 gap-2">
                  {['ADMIN', 'SECRETARIA', 'ODONTOLOGO'].map((r) => (
                    <button 
                      key={r} 
                      type="button" 
                      onClick={() => setValue('rol', r as any)} 
                      className={`px-4 py-3 rounded-xl text-left font-bold text-sm transition-all border ${selectedRol === r ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {errors.rol && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.rol.message}</p>}
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cerrar</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;

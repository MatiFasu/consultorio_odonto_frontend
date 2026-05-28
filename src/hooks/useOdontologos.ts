import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Odontologo, OdontologoService } from '../api/odontologoService';
import { UsuarioService } from '../api/usuarioService';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';

// Schema de validación con Zod
export const odontologoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(50),
  dni: z.string().min(7, "DNI inválido").max(12, "DNI demasiado largo"),
  telefono: z.string().min(8, "Teléfono demasiado corto").max(15, "Teléfono demasiado largo"),
  direccion: z.string().min(5, "La dirección es demasiado corta"),
  fecha_nac: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  especialidad: z.string().min(3, "La especialidad es obligatoria"),
  usuarioId: z.string().optional(),
  horarioInicio: z.string().min(1, "La hora de inicio es obligatoria"),
  horarioFinal: z.string().min(1, "La hora de fin es obligatoria")
});

export type OdontologoFormData = z.infer<typeof odontologoSchema>;

export const useOdontologos = () => {
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentHorarioId, setCurrentHorarioId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.rol === 'ADMIN';

  // React Hook Form
  const formMethods = useForm<OdontologoFormData>({
    resolver: zodResolver(odontologoSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      direccion: '',
      fecha_nac: '',
      especialidad: '',
      usuarioId: '',
      horarioInicio: '08:00',
      horarioFinal: '18:00'
    }
  });

  const { reset } = formMethods;

  // Queries con React Query
  const { data: odontologosData = [], isLoading: loading } = useQuery({
    queryKey: ['odontologos'],
    queryFn: () => OdontologoService.getAll(),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => UsuarioService.getAll(),
  });

  // Usuarios disponibles (no asignados a otros odontólogos)
  const usuariosDisponibles = useMemo(() => {
    const idsAsignados = odontologosData.filter(o => o.idUsuario).map(o => o.idUsuario);
    return usuarios.filter(u => !idsAsignados.includes(u.id) || (isEditing && odontologosData.find(o => o.id === editingId)?.idUsuario === u.id));
  }, [usuarios, odontologosData, isEditing, editingId]);

  // Mutaciones
  const deleteMutation = useMutation({
    mutationFn: (id: number) => OdontologoService.delete(id),
    onSuccess: () => {
      toast.success("Especialista eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ['odontologos'] });
    },
    onError: () => toast.error("Error al eliminar")
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setCurrentHorarioId(null);
    reset({ 
        nombre: '', apellido: '', dni: '', telefono: '', direccion: '', 
        fecha_nac: '', especialidad: '', usuarioId: '', 
        horarioInicio: '08:00', horarioFinal: '18:00' 
    });
  };

  const onSubmit = async (data: OdontologoFormData) => {
    setSaving(true);
    
    const payload: Partial<Odontologo> = {
      ...data,
      id: editingId ?? undefined,
      idUsuario: data.usuarioId ? parseInt(data.usuarioId) : undefined,
      idHorario: currentHorarioId ?? undefined
    };

    try {
      if (isEditing && editingId) {
        await OdontologoService.update(payload);
        toast.success("Perfil actualizado con éxito");
      } else {
        await OdontologoService.create(payload);
        toast.success("Especialista registrado con éxito");
      }
      queryClient.invalidateQueries({ queryKey: ['odontologos'] });
      setTimeout(() => closeModal(), 800);
    } catch (error: any) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await confirm("¿Confirmar Eliminación?", "¿Estás seguro de eliminar a este especialista?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (o: Odontologo) => {
    reset({
      nombre: o.nombre,
      apellido: o.apellido,
      dni: o.dni,
      telefono: o.telefono || '',
      direccion: o.direccion || '',
      fecha_nac: o.fecha_nac ? o.fecha_nac.split('T')[0] : '',
      especialidad: o.especialidad,
      usuarioId: o.idUsuario ? String(o.idUsuario) : '',
      horarioInicio: o.horarioInicio || '08:00',
      horarioFinal: o.horarioFinal || '18:00'
    });
    setEditingId(o.id);
    setCurrentHorarioId(o.idHorario || null);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const filteredOdontologos = useMemo(() => {
      return odontologosData.filter(o => 
        o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [odontologosData, searchTerm]);

  return {
    odontologos: filteredOdontologos,
    usuariosDisponibles,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    formMethods,
    isAdmin,
    onSubmit,
    handleDelete,
    openEditModal,
    closeModal
  };
};

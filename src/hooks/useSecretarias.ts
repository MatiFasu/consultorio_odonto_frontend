import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Secretaria, SecretariaService } from '../api/secretariaService';
import { UsuarioService } from '../api/usuarioService';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';

// Schema de validación con Zod
export const secretariaSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(50),
  dni: z.string().min(7, "DNI inválido").max(10, "DNI demasiado largo").regex(/^\d+$/, "Solo se permiten números"),
  telefono: z.string().min(8, "Teléfono demasiado corto").max(15, "Teléfono demasiado largo"),
  direccion: z.string().min(5, "La dirección es demasiado corta"),
  fecha_nac: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  sector: z.string().min(2, "El sector es obligatorio"),
  usuarioId: z.string().optional()
});

export type SecretariaFormData = z.infer<typeof secretariaSchema>;

export const useSecretarias = () => {
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.rol === 'ADMIN';

  // React Hook Form
  const formMethods = useForm<SecretariaFormData>({
    resolver: zodResolver(secretariaSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      direccion: '',
      fecha_nac: '',
      sector: '',
      usuarioId: ''
    }
  });

  const { reset } = formMethods;

  // Queries con React Query
  const { data: secretarias = [], isLoading: loading } = useQuery({
    queryKey: ['secretarias'],
    queryFn: () => SecretariaService.getAll(),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => UsuarioService.getAll(),
  });

  // Usuarios disponibles (no asignados a otras secretarias)
  const usuariosDisponibles = useMemo(() => {
    const idsAsignados = secretarias.filter(s => s.idUsuario).map(s => s.idUsuario);
    return usuarios.filter(u => 
      u.rol.toUpperCase() === 'SECRETARIA' && 
      (!idsAsignados.includes(u.id) || (isEditing && secretarias.find(s => s.id === editingId)?.idUsuario === u.id))
    );
  }, [usuarios, secretarias, isEditing, editingId]);

  // Mutaciones
  const deleteMutation = useMutation({
    mutationFn: (id: number) => SecretariaService.delete(id),
    onSuccess: () => {
      toast.success("Secretaria dada de baja correctamente");
      queryClient.invalidateQueries({ queryKey: ['secretarias'] });
    },
    onError: () => toast.error("Error al dar de baja secretaria")
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    reset({ nombre: '', apellido: '', dni: '', telefono: '', direccion: '', fecha_nac: '', sector: '', usuarioId: '' });
  };

  const onSubmit = async (data: SecretariaFormData) => {
    setSaving(true);
    
    const payload: Partial<Secretaria> = {
      ...data,
      id: editingId ?? undefined,
      idUsuario: data.usuarioId ? parseInt(data.usuarioId) : undefined
    };

    try {
      if (isEditing && editingId) {
        await SecretariaService.update(payload);
        toast.success("Datos administrativos actualizados");
      } else {
        await SecretariaService.create(payload);
        toast.success("Nueva secretaria registrada");
      }
      queryClient.invalidateQueries({ queryKey: ['secretarias'] });
      setTimeout(() => closeModal(), 800); 
    } catch (error) {
      toast.error("Error en la operación");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await confirm("¿Confirmar Baja?", "¿Desea dar de baja a esta secretaria?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (s: Secretaria) => {
    reset({
      nombre: s.nombre,
      apellido: s.apellido,
      dni: s.dni,
      telefono: s.telefono || '',
      direccion: s.direccion || '',
      fecha_nac: s.fecha_nac ? s.fecha_nac.split('T')[0] : '',
      sector: s.sector,
      usuarioId: s.idUsuario ? String(s.idUsuario) : ''
    });
    setEditingId(s.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const filteredSecretarias = useMemo(() => {
      return secretarias.filter(s => 
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [secretarias, searchTerm]);

  return {
    secretarias: filteredSecretarias,
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

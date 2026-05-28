import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Paciente, PacienteService } from '../api/pacienteService';
import { type Responsable, ResponsableService } from '../api/responsableService';
import { aiService } from '../api/aiService';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';

// Schema de validación con Zod
export const pacienteSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(50),
  dni: z.string().min(7, "DNI inválido").max(10, "DNI demasiado largo").regex(/^\d+$/, "Solo se permiten números"),
  telefono: z.string().min(8, "Teléfono demasiado corto").max(15, "Teléfono demasiado largo"),
  direccion: z.string().min(5, "La dirección es demasiado corta"),
  fecha_nac: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  tiene_OS: z.boolean(),
  tipoSangre: z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']),
  idResponsable: z.coerce.number().optional().nullable()
}).refine(data => {
  if (!data.fecha_nac) return true;
  const birthDate = new Date(data.fecha_nac);
  const age = Math.floor((new Date().getTime() - birthDate.getTime()) / 31557600000);
  if (age < 18) {
    return !!data.idResponsable;
  }
  return true;
}, {
  message: "Debe seleccionar un responsable para pacientes menores de edad",
  path: ["idResponsable"]
});

export type PacienteFormData = z.infer<typeof pacienteSchema>;

export const usePacientes = () => {
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 8;

  // Modales adicionales
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [selectedBillingPaciente, setSelectedBillingPaciente] = useState<Paciente | null>(null);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // React Hook Form
  const formMethods = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema) as any,
    defaultValues: {
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      direccion: '',
      fecha_nac: '',
      tiene_OS: false,
      tipoSangre: 'O+',
      idResponsable: null
    }
  });

  const { reset } = formMethods;
  const isMinor = useWatch({
    control: formMethods.control,
    name: 'fecha_nac'
  }) ? (new Date().getFullYear() - new Date(formMethods.getValues('fecha_nac')).getFullYear() < 18) : false;

  // Queries
  const { data: paginatedData, isLoading: loading } = useQuery({
    queryKey: ['pacientes', currentPage],
    queryFn: () => PacienteService.getPaginated(currentPage, pageSize),
  });

  const { data: responsables = [] } = useQuery({
    queryKey: ['responsables'],
    queryFn: ResponsableService.getAll,
  });

  const pacientes = paginatedData?.content || [];
  const totalPages = paginatedData?.totalPages || 0;

  // Mutaciones
  const deleteMutation = useMutation({
    mutationFn: (id: number) => PacienteService.delete(id),
    onSuccess: () => {
      toast.success("Paciente eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
    onError: () => toast.error("No se pudo eliminar el paciente")
  });

  const onSubmit = async (data: PacienteFormData) => {
    setSaving(true);
    
    const payload: Partial<Paciente> = {
      ...data,
      id: editingId ?? undefined,
      idResponsable: isMinor ? data.idResponsable || undefined : undefined
    };

    try {
      if (isEditing && editingId) {
        await PacienteService.update(payload);
        toast.success("Paciente actualizado correctamente");
      } else {
        await PacienteService.create(payload);
        toast.success("Paciente registrado con éxito");
      }
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.response?.data?.message || "Ocurrió un error inesperado";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Paciente) => {
    reset({
      nombre: p.nombre,
      apellido: p.apellido,
      dni: p.dni,
      telefono: p.telefono,
      direccion: p.direccion,
      fecha_nac: p.fecha_nac ? p.fecha_nac.split('T')[0] : '',
      tiene_OS: p.tiene_OS,
      tipoSangre: p.tipoSangre as any,
      idResponsable: p.idResponsable || null
    });
    setEditingId(p.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm("¿Confirmar Eliminación?", "¿Seguro que deseas eliminar este paciente del sistema?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    reset({ 
      nombre: '', 
      apellido: '', 
      dni: '', 
      telefono: '', 
      direccion: '', 
      fecha_nac: '', 
      tiene_OS: false, 
      tipoSangre: 'O+',
      idResponsable: null
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleAISummary = async (p: Paciente) => {
    setSelectedPaciente(p);
    setLoadingAI(true);
    setIsAISummaryOpen(true);
    setAiSummary('');
    try {
      const summary = await aiService.getResumenClinico(p.id);
      setAiSummary(summary);
    } catch (error) {
      toast.error("Error al generar resumen con IA");
      setIsAISummaryOpen(false);
    } finally {
      setLoadingAI(false);
    }
  };

  const filteredPacientes = useMemo(() => {
      return pacientes.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm)
      );
  }, [pacientes, searchTerm]);

  return {
    pacientes: filteredPacientes,
    responsables,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    isMinor,
    formMethods,
    isAdmin: user?.rol === 'ADMIN',
    isOdonto: user?.rol === 'ODONTOLOGO',
    isHistoryOpen,
    setIsHistoryOpen,
    selectedPaciente,
    setSelectedPaciente,
    isBillingOpen,
    setIsBillingOpen,
    selectedBillingPaciente,
    setSelectedBillingPaciente,
    isAISummaryOpen,
    setIsAISummaryOpen,
    aiSummary,
    loadingAI,
    onSubmit,
    handleEdit,
    handleDelete,
    handleAISummary,
    resetForm
  };
};

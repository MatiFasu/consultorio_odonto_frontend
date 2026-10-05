import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Turno, TurnoService } from '../api/turnoService';
import { PacienteService } from '../api/pacienteService';
import { type Odontologo, OdontologoService } from '../api/odontologoService';
import { ResponsableService } from '../api/responsableService';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';

// Schema de validación con Zod
export const turnoSchema = z.object({
  fecha_turno: z.string().min(1, "La fecha es obligatoria"),
  hora_turno: z.string().min(1, "La hora es obligatoria"),
  afeccion: z.string().min(3, "Indique el motivo de la consulta (mín. 3 caracteres)").max(255),
  odontologoId: z.string().optional(),
  idPaciente: z.number().min(1, "Debe seleccionar un paciente")
});

export type TurnoFormData = z.infer<typeof turnoSchema>;

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export const useTurnos = () => {
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchAgenda, setSearchAgenda] = useState('');

  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<any | null>(null);
  const [isQuickCreatingPatient, setIsQuickCreatingPatient] = useState(false);
  const canManage = user?.rol === 'ADMIN' || user?.rol === 'SECRETARIA';

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // React Hook Form
  const formMethods = useForm<TurnoFormData>({
    resolver: zodResolver(turnoSchema),
    defaultValues: {
      fecha_turno: todayStr,
      hora_turno: '',
      afeccion: '',
      odontologoId: '',
      idPaciente: 0
    }
  });

  const { reset, watch, setValue, setFocus } = formMethods;
  const formFecha = watch('fecha_turno');
  const formHora = watch('hora_turno');
  const formOdontologoId = watch('odontologoId');
  const formPacienteId = watch('idPaciente');

  const [lastSelectedPatientId, setLastSelectedPatientId] = useState<number | null>(null);

  // Consulta de historial de turnos del paciente seleccionado
  const { data: turnosPaciente = [] } = useQuery({
    queryKey: ['turnos-paciente', formPacienteId],
    queryFn: async () => {
      if (!formPacienteId) return [];
      return await TurnoService.getByPaciente(formPacienteId);
    },
    enabled: !!formPacienteId && isModalOpen
  });

  // Determinar el último turno y odontólogo asociado
  const lastTurno = useMemo(() => {
    if (turnosPaciente.length === 0) return null;
    return [...turnosPaciente].sort((a, b) => {
      const dateDiff = new Date(b.fecha_turno + 'T00:00:00').getTime() - new Date(a.fecha_turno + 'T00:00:00').getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.hora_turno || '').localeCompare(a.hora_turno || '');
    })[0];
  }, [turnosPaciente]);

  const isNewPatient = formPacienteId > 0 && turnosPaciente.length === 0;

  // Auto-seleccionar odontólogo habitual en pacientes recurrentes (solo una vez para evitar bucles/multiples avisos)
  useEffect(() => {
    if (isModalOpen && !isEditing && lastTurno && lastTurno.idOdontologo && formPacienteId !== lastSelectedPatientId) {
      setValue('odontologoId', String(lastTurno.idOdontologo));
      setLastSelectedPatientId(formPacienteId);
      toast.info(`Paciente recurrente. Se pre-seleccionó su odontólogo habitual: Dr. ${lastTurno.nombreOdontologo || ''}`);
    }
  }, [lastTurno, isModalOpen, isEditing, formPacienteId, lastSelectedPatientId, setValue, toast]);

  // Limpiar estados cuando el modal se cierra
  useEffect(() => {
    if (!isModalOpen) {
      setLastSelectedPatientId(null);
    }
  }, [isModalOpen]);

  // Atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abrir modal con Alt + N (Nuevo)
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (!isModalOpen && canManage) {
          resetForm();
          setIsModalOpen(true);
        }
      }
      
      // Cerrar con Escape
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, canManage]);

  // Autofocus al abrir modal
  useEffect(() => {
    if (isModalOpen) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => setFocus('fecha_turno'), 100);
    }
  }, [isModalOpen, setFocus]);

  // Selección rápida de paciente con Enter
  const handlePacienteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pacienteSearch.length > 1) {
      const filtered = pacientes.filter(p => 
        `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(pacienteSearch.toLowerCase())
      );
      if (filtered.length > 0) {
        e.preventDefault();
        const p = filtered[0];
        setSelectedPaciente(p);
        setValue('idPaciente', p.id);
        setPacienteSearch('');
      }
    }
  };

  // Queries
  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes-all'],
    queryFn: () => PacienteService.getAll(),
  });

  const { data: responsables = [] } = useQuery({
    queryKey: ['responsables-all'],
    queryFn: () => ResponsableService.getAll(),
  });

  // Mutación para creación rápida de responsable
  const quickCreateResponsableMutation = useMutation({
    mutationFn: (data: { nombre: string, apellido: string, dni: string, telefono: string, tipoResponsabilidad: string }) => 
      ResponsableService.create({ 
        ...data, 
        direccion: 'No especificada', 
        fecha_nac: '1980-01-01' // Valor genérico para tutor
      }),
    onSuccess: (newResp: any) => {
      queryClient.invalidateQueries({ queryKey: ['responsables-all'] });
      toast.success("Responsable registrado correctamente");
    },
    onError: () => toast.error("Error al registrar responsable")
  });

  // Mutación para creación rápida de paciente
  const quickCreatePatientMutation = useMutation({
    mutationFn: (data: { 
        nombre: string, 
        apellido: string, 
        dni: string, 
        telefono: string, 
        fecha_nac: string, 
        tipoSangre: string, 
        tiene_OS: boolean,
        idResponsable?: number | null
    }) => {
      const payload = { ...data, direccion: 'No especificada' };
      if (payload.idResponsable === 0) {
        payload.idResponsable = null;
      }
      return PacienteService.create(payload as any);
    },
    onSuccess: (newPatient: any) => {
      queryClient.invalidateQueries({ queryKey: ['pacientes-all'] });
      
      // Sincronización con el ID real devuelto por el servidor
      setPacienteSearch(newPatient.dni);
      setSelectedPaciente(newPatient);
      setValue('idPaciente', newPatient.id);
      
      setIsQuickCreatingPatient(false);
      toast.success("Paciente creado y seleccionado");
    },
    onError: (err: any) => {
        const msg = err.response?.data?.message || "Error al crear paciente";
        toast.error(msg);
    }
  });

  const { data: odontologos = [] } = useQuery({
    queryKey: ['odontologos-all'],
    queryFn: () => OdontologoService.getAll(),
  });



  const { data: turnosData, isLoading: loading } = useQuery({
    queryKey: ['turnos', user?.rol, user?.id, currentPage, pageSize, viewMode, selectedDate],
    queryFn: async () => {
      if (user?.rol === 'ODONTOLOGO') {
        const odonto = odontologos.find(o => o.idUsuario === user.id);
        if (odonto) {
          const allTurnos = await TurnoService.getByOdontologo(odonto.id);
          const filtered = allTurnos.filter(t => t.fecha_turno === selectedDate);
          return { content: filtered, totalPages: 1 };
        }
        return { content: [], totalPages: 0 };
      } else {
        if (viewMode === 'calendar') {
          return await TurnoService.getByFechaPaginated(selectedDate, 0, 100);
        }
        return await TurnoService.getByFechaPaginated(selectedDate, currentPage, pageSize);
      }
    },
    enabled: !!user && (user.rol !== 'ODONTOLOGO' || odontologos.length > 0)
  });

  const turnos = turnosData?.content || [];
  const totalPages = turnosData?.totalPages || 0;

  // Mutaciones
  const saveMutation = useMutation({
    mutationFn: (payload: Turno) => isEditing ? TurnoService.update(payload) : TurnoService.create(payload),
    onSuccess: () => {
      toast.success(isEditing ? "¡Cita actualizada correctamente!" : "¡Cita agendada correctamente!");
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
        const msg = err.response?.data?.message || "Error al procesar el turno";
        toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => TurnoService.delete(id),
    onSuccess: () => {
      toast.success("Cita cancelada");
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
    },
    onError: () => toast.error("Error al cancelar")
  });

  const handleEdit = (t: Turno) => {
    const p = pacientes.find(p => p.id === t.idPaciente);
    setSelectedPaciente(p);
    
    reset({
      fecha_turno: t.fecha_turno,
      hora_turno: t.hora_turno,
      afeccion: t.afeccion,
      odontologoId: String(t.idOdontologo),
      idPaciente: t.idPaciente
    });
    
    setEditingId(t.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const onFormSubmit = (data: TurnoFormData) => {
    let finalOdontoId = data.odontologoId;

    // Si es un paciente nuevo o no se seleccionó odontólogo manualmente, el sistema preselecciona automáticamente
    if (!finalOdontoId) {
      // Encontrar el primer profesional libre a esa hora sin ninguna regla de especialidad
      const freeOdonto = odontologos.find(o => {
        const works = o.horarioInicio && o.horarioFinal && data.hora_turno >= o.horarioInicio && data.hora_turno < o.horarioFinal;
        if (!works) return false;

        const occupied = turnosOcupados.some(t => 
          t.idOdontologo === o.id &&
          t.hora_turno?.substring(0, 5) === data.hora_turno &&
          (!isEditing || t.id !== editingId)
        );
        return !occupied;
      });

      if (!freeOdonto) {
        toast.error("No hay ningún profesional disponible en el horario seleccionado.");
        return;
      }

      finalOdontoId = String(freeOdonto.id);
      toast.info(`Asignado automáticamente: Dr. ${freeOdonto.nombre} ${freeOdonto.apellido}`);
    }

    const payload: Turno = {
      id: editingId || 0,
      fecha_turno: data.fecha_turno,
      hora_turno: data.hora_turno,
      afeccion: data.afeccion,
      idPaciente: data.idPaciente,
      idOdontologo: Number(finalOdontoId)
    };

    saveMutation.mutate(payload);
  };

  const resetForm = () => {
    reset({ 
      fecha_turno: todayStr, 
      hora_turno: '', 
      afeccion: '', 
      odontologoId: '',
      idPaciente: 0 
    });
    setSelectedPaciente(null);
    setPacienteSearch('');
    setIsEditing(false);
    setEditingId(null);
    setIsQuickCreatingPatient(false);
    setLastSelectedPatientId(null);
  };

  const handleDelete = async (id: number) => {
    if (await confirm("¿Cancelar Turno?", "¿Confirmas la cancelación del turno?")) {
      deleteMutation.mutate(id);
    }
  };

  const turnosFiltrados = useMemo(() => {
    return (turnos || []).filter(t => {
      const search = searchAgenda.toLowerCase();
      const pName = (t.nombrePaciente || '').toLowerCase();
      const oName = (t.nombreOdontologo || '').toLowerCase();
      return (searchAgenda === '' || pName.includes(search) || oName.includes(search));
    });
  }, [turnos, searchAgenda]);

  // Turnos del día seleccionado en el formulario para validación de disponibilidad
  const { data: turnosOcupados = [] } = useQuery({
    queryKey: ['turnos-fecha', formFecha],
    queryFn: async () => {
      if (!formFecha) return [];
      const res = await TurnoService.getByFechaPaginated(formFecha, 0, 100);
      return res.content as Turno[];
    },
    enabled: !!formFecha && isModalOpen
  });

  // Grilla de horarios con estado detallado para el profesional seleccionado o cálculo general para asignación automática
  const timeSlotsWithStatus = useMemo(() => {
    if (!formFecha) return [];
    
    if (formOdontologoId) {
      const odontoIdNum = Number(formOdontologoId);
      const selectedOdonto = odontologos.find(o => o.id === odontoIdNum);
      if (!selectedOdonto) return [];

      return TIME_SLOTS.map(slot => {
        let isWithinHours = false;
        if (selectedOdonto.horarioInicio && selectedOdonto.horarioFinal) {
          isWithinHours = slot >= selectedOdonto.horarioInicio && slot < selectedOdonto.horarioFinal;
        }

        const turnoOcupante = turnosOcupados.find(t => 
          t.idOdontologo === selectedOdonto.id &&
          t.hora_turno?.substring(0, 5) === slot &&
          (!isEditing || t.id !== editingId)
        );

        const isOccupied = !!turnoOcupante;

        return {
          time: slot,
          isWithinHours,
          isOccupied,
          occupiedBy: isOccupied ? turnoOcupante.nombrePaciente : null,
          isCurrentSelection: formHora === slot
        };
      });
    }

    // Si no hay profesional seleccionado (Asignación Automática), evaluamos la disponibilidad colectiva general
    return TIME_SLOTS.map(slot => {
      // Encontrar profesionales que trabajan a esta hora y están libres
      const freeOdontos = odontologos.filter(o => {
        const works = o.horarioInicio && o.horarioFinal && slot >= o.horarioInicio && slot < o.horarioFinal;
        if (!works) return false;

        const occupied = turnosOcupados.some(t => 
          t.idOdontologo === o.id &&
          t.hora_turno?.substring(0, 5) === slot &&
          (!isEditing || t.id !== editingId)
        );
        return !occupied;
      });

      const hasAnyFree = freeOdontos.length > 0;
      const hasAnyWorking = odontologos.some(o => 
        o.horarioInicio && o.horarioFinal && slot >= o.horarioInicio && slot < o.horarioFinal
      );

      return {
        time: slot,
        isWithinHours: hasAnyWorking,
        isOccupied: hasAnyWorking && !hasAnyFree,
        occupiedBy: (hasAnyWorking && !hasAnyFree) ? "Todos ocupados" : null,
        isCurrentSelection: formHora === slot
      };
    });
  }, [formFecha, formOdontologoId, formHora, odontologos, turnosOcupados, isEditing, editingId]);

  // Si cambia la fecha o el odontólogo, limpiar la hora si deja de estar disponible
  useEffect(() => {
    if (isModalOpen && formHora && formOdontologoId) {
      const odontoIdNum = Number(formOdontologoId);
      const selectedOdonto = odontologos.find(o => o.id === odontoIdNum);
      if (selectedOdonto) {
        const isWithinHours = selectedOdonto.horarioInicio && selectedOdonto.horarioFinal &&
          formHora >= selectedOdonto.horarioInicio && formHora < selectedOdonto.horarioFinal;
        
        const isOccupied = turnosOcupados.some(t =>
          t.idOdontologo === selectedOdonto.id &&
          t.hora_turno?.substring(0, 5) === formHora &&
          (!isEditing || t.id !== editingId)
        );

        if (!isWithinHours || isOccupied) {
          setValue('hora_turno', '');
        }
      }
    }
  }, [formFecha, formOdontologoId, isModalOpen, turnosOcupados, isEditing, editingId, setValue, odontologos]);

  const changeDate = (days: number) => {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  return {
    turnos: turnosFiltrados,
    pacientes,
    responsables,
    odontologos: odontologos, // Retornamos la lista completa de odontólogos para el selector
    allOdontologos: odontologos,
    timeSlots: timeSlotsWithStatus, // Retornamos la grilla de horarios calculada
    isNewPatient,
    lastTurno,
    loading,
    savePending: saveMutation.isPending,
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    selectedDate,
    setSelectedDate,
    searchAgenda,
    setSearchAgenda,
    pacienteSearch,
    setPacienteSearch,
    selectedPaciente,
    setSelectedPaciente,
    canManage,
    currentPage,
    setCurrentPage,
    totalPages,
    formMethods,
    onFormSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    changeDate,
    formFecha,
    formHora,
    todayStr,
    handlePacienteKeyDown,
    isQuickCreatingPatient,
    setIsQuickCreatingPatient,
    quickCreatePatient: (data: any) => quickCreatePatientMutation.mutate(data),
    isCreatingPatient: quickCreatePatientMutation.isPending,
    quickCreateResponsable: (data: any) => quickCreateResponsableMutation.mutate(data),
    isCreatingResponsable: quickCreateResponsableMutation.isPending
  };
};

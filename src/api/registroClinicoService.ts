import api from './apiClient';
import type { Paciente } from './pacienteService';
import type { Odontologo } from './odontologoService';

export interface EstadoDiente {
  id?: number;
  numeroDiente: number;
  posicion: string; // "top" | "bottom" | "left" | "right" | "center"
  estado: string; // "caries" | "ausente" | "protesis" | "sano" | "restaurado"
}

export interface MultimediaEstudio {
  id?: number;
  nombreArchivo: string;
  tipoContenido: string;
  urlArchivo: string;
  fechaCarga?: string;
}

export interface RegistroClinico {
  id?: number;
  fecha: string;
  motivoConsulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
  idPaciente: number;
  nombrePaciente?: string;
  idOdontologo: number;
  nombreOdontologo?: string;
  odontograma?: EstadoDiente[];
  estudios?: MultimediaEstudio[];
}

export const RegistroClinicoService = {
  getHistorialByPaciente: async (pacienteId: number) => {
    const response = await api.get<RegistroClinico[]>(`/registro-clinico/paciente/${pacienteId}`);
    return response.data;
  },
  create: async (registro: RegistroClinico) => {
    const response = await api.post<RegistroClinico>('/registro-clinico/crear', registro);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/registro-clinico/eliminar/${id}`);
    return response.data;
  }
};

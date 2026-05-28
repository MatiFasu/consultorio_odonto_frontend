import api, { type PaginatedResponse } from './apiClient';

export interface Paciente {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fecha_nac: string; // Formato YYYY-MM-DD
  tiene_OS: boolean;
  tipoSangre: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  idResponsable?: number | null;
  nombreResponsable?: string;
}

export const PacienteService = {
  getAll: async () => {
    const response = await api.get<Paciente[]>('/paciente/traer');
    return response.data;
  },
  getPaginated: async (page: number = 0, size: number = 10) => {
    const response = await api.get<PaginatedResponse<Paciente>>(`/paciente/traer/paginado?page=${page}&size=${size}`);
    return response.data;
  },
  create: async (paciente: Partial<Paciente>) => {
    const response = await api.post('/paciente/crear', paciente);
    return response.data;
  },
  update: async (paciente: Partial<Paciente>) => {
    const response = await api.put('/paciente/editar', paciente);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/paciente/eliminar/${id}`);
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Paciente>(`/paciente/traer/${id}`);
    return response.data;
  }
};

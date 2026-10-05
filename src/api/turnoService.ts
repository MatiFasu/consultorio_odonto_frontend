import api, { type PaginatedResponse } from './apiClient';

export interface Turno {
  id: number;
  fecha_turno: string;
  hora_turno: string;
  afeccion: string;
  idPaciente: number;
  nombrePaciente?: string;
  idOdontologo: number;
  nombreOdontologo?: string;
}

export const TurnoService = {
  getAll: async () => {
    const response = await api.get<Turno[]>('/turno/traer');
    return response.data;
  },
  getPaginated: async (page: number = 0, size: number = 10) => {
    const response = await api.get<PaginatedResponse<Turno>>(`/turno/traer/paginado?page=${page}&size=${size}`);
    return response.data;
  },
  getByFechaPaginated: async (fecha: string, page: number = 0, size: number = 10) => {
    const response = await api.get<PaginatedResponse<Turno>>(`/turno/traer/fecha?fecha=${fecha}&page=${page}&size=${size}`);
    return response.data;
  },
  getByOdontologo: async (odontoId: number) => {
    const response = await api.get<Turno[]>(`/turno/odontologo/${odontoId}`);
    return response.data;
  },
  getUpcomingByOdontologo: async (odontoId: number) => {
    const response = await api.get<Turno[]>(`/turno/odontologo/${odontoId}/proximos`);
    return response.data;
  },
  getByPaciente: async (pacienteId: number) => {
    const response = await api.get<Turno[]>(`/turno/paciente/${pacienteId}`);
    return response.data;
  },
  create: async (t: Partial<Turno>) => {
    const response = await api.post('/turno/crear', t);
    return response.data;
  },
  update: async (t: Turno) => {
    const response = await api.put('/turno/editar', t);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/turno/eliminar/${id}`);
  }
};

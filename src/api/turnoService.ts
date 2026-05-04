import api from './apiClient';

export interface Turno {
  id_turno: number;
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
  getByOdontologo: async (odontoId: number) => {
    const response = await api.get<Turno[]>(`/turno/odontologo/${odontoId}`);
    return response.data;
  },
  getUpcomingByOdontologo: async (odontoId: number) => {
    const response = await api.get<Turno[]>(`/turno/odontologo/${odontoId}/proximos`);
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
    await api.delete(`/turno/borrar/${id}`);
  }
};

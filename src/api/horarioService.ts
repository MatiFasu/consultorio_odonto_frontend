import api from './apiClient';

export interface Horario {
  id_horario: number;
  horario_inicio: string;
  horario_final: string;
}

export const HorarioService = {
  getAll: async () => {
    const response = await api.get<Horario[]>('/horario/traer');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Horario>(`/horario/traer/${id}`);
    return response.data;
  },
  create: async (h: Partial<Horario>) => {
    const response = await api.post<number>('/horario/crear', h);
    return response.data; // Retorna el ID generado
  },
  update: async (h: Horario) => {
    const response = await api.put('/horario/editar', h);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/horario/borrar/${id}`);
  }
};

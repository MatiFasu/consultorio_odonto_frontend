import api from './apiClient';

export interface Responsable {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fecha_nac: string;
  tipoResponsabilidad: string;
}

export const ResponsableService = {
  getAll: async () => {
    const response = await api.get<Responsable[]>('/responsable/traer');
    return response.data;
  },
  create: async (r: Partial<Responsable>) => {
    const response = await api.post('/responsable/crear', r);
    return response.data;
  },
  update: async (r: Partial<Responsable>) => {
    const response = await api.put('/responsable/editar', r);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/responsable/borrar/${id}`);
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Responsable>(`/responsable/traer/${id}`);
    return response.data;
  }
};

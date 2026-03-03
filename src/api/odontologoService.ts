import api from './apiClient';

export interface Odontologo {
  id_persona: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fecha_nac: string;
  especialidad: string;
  unHorario?: any;
}

export const OdontologoService = {
  getAll: async () => {
    const response = await api.get<Odontologo[]>('/odontologo/traer');
    return response.data;
  },
  create: async (o: Partial<Odontologo>) => {
    const response = await api.post('/odontologo/crear', o);
    return response.data;
  },
  update: async (o: Partial<Odontologo>) => {
    const response = await api.put('/odontologo/editar', o);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/odontologo/eliminar/${id}`);
    return response.data;
  }
};

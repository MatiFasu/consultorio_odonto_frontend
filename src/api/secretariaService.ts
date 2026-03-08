import api from './apiClient';

export interface Secretaria {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fecha_nac: string;
  sector: string;
  unUsuario?: any;
}

export const SecretariaService = {
  getAll: async () => {
    const response = await api.get<Secretaria[]>('/secretaria/traer');
    return response.data;
  },
  create: async (s: Partial<Secretaria>) => {
    const response = await api.post('/secretaria/crear', s);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/secretaria/borrar/${id}`);
  }
};

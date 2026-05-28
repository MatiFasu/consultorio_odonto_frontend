import api from './apiClient';

export interface Usuario {
  id?: number;
  usuario: string;
  contrasenia: string;
  rol: 'ADMIN' | 'SECRETARIA' | 'ODONTOLOGO';
}

export const UsuarioService = {
  getAll: async () => {
    const response = await api.get<Usuario[]>('/usuario/traer');
    return response.data;
  },
  create: async (u: Partial<Usuario>) => {
    const response = await api.post('/usuario/crear', u);
    return response.data;
  },
  update: async (u: Partial<Usuario>) => {
    const response = await api.put('/usuario/editar', u);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/usuario/borrar/${id}`);
  }
};

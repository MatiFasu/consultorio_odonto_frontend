import api from './apiClient';

export interface Usuario {
  id_usuario?: number;
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
    console.log("Enviando nuevo usuario al backend:", u);
    // La ruta exacta según tu UsuarioController.java es /usuario/crear
    const response = await api.post('/usuario/crear', u);
    return response.data;
  },
  delete: async (id: number) => {
    // La ruta según tu backend es /usuario/borrar/{id}
    await api.delete(`/usuario/borrar/${id}`);
  }
};

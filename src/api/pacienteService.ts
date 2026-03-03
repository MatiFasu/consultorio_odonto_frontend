import api from './apiClient';

export interface Paciente {
  id_persona: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fecha_nac: string;
  tiene_OS: boolean;
  tipoSangre: string;
}

export const PacienteService = {
  getAll: async () => {
    const response = await api.get<Paciente[]>('/paciente/traer');
    return response.data;
  },
  create: async (p: Partial<Paciente>) => {
    const response = await api.post('/paciente/crear', p);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/paciente/eliminar/${id}`);
    return response.data;
  }
};

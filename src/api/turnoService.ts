import api from './apiClient';
import type { Paciente } from './pacienteService';
import type { Odontologo } from './odontologoService';

export interface Turno {
  id_turno: number;
  fecha_turno: string;
  hora_turno: string;
  afeccion: string;
  pacien: any; 
  odonto: any;
}

export const TurnoService = {
  getAll: async () => {
    const response = await api.get<Turno[]>('/turno/traer');
    return response.data;
  },
  create: async (t: any) => {
    // IMPORTANTE: Según Persona.java, el campo se llama 'id'
    const pId = t.paciente.id || t.paciente.id_persona;
    const oId = t.odontologo.id || t.odontologo.id_persona;

    const payload = {
      fecha_turno: t.fecha_turno,
      hora_turno: t.hora_turno,
      afeccion: t.afeccion,
      pacien: { id: pId }, // Enviamos 'id' para que coincida con Persona.java
      odonto: { id: oId }
    };
    
    console.log("🚀 Payload Final Enviado:", payload);
    const response = await api.post('/turno/crear', payload);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/turno/borrar/${id}`);
  }
};

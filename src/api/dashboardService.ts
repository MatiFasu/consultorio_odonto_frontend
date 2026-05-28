import apiClient from './apiClient';

export interface DashboardStats {
  pacientes: number;
  odontologos: number;
  turnosHoy: number;
  misTurnosHoy: number;
  weeklyActivity: number[];
  alertasAdmin: {
    sinHorario: Array<{ id: number; nombre: string; apellido: string }>;
    sinTel: Array<{ id: number; nombre: string; apellido: string }>;
  };
}

export const DashboardService = {
  getStats: async (odontologoId?: number): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/api/dashboard/stats', {
      params: odontologoId ? { odontologoId } : {}
    });
    return response.data;
  }
};

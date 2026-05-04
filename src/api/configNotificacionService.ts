import apiClient from './apiClient';

export interface ConfiguracionNotificacion {
    id: number;
    activa: boolean;
    horarioEnvio: string; // Formato "HH:mm:ss"
    diasAnticipacion: number;
    diasEjecucion: string;
}

export const ConfigNotificacionService = {
    get: async (): Promise<ConfiguracionNotificacion> => {
        const response = await apiClient.get('/api/config-notificaciones');
        return response.data;
    },
    update: async (config: ConfiguracionNotificacion): Promise<ConfiguracionNotificacion> => {
        const response = await apiClient.put('/api/config-notificaciones', config);
        return response.data;
    }
};

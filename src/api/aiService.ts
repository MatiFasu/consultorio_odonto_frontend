import apiClient from "./apiClient";

export const aiService = {
  getResumenClinico: async (pacienteId: number): Promise<string> => {
    const response = await apiClient.get<string>(`/api/ai/resumen-clinico/${pacienteId}`, {
        // El backend devuelve un string plano, no un objeto JSON necesariamente
        responseType: 'text'
    });
    return response.data;
  },
};

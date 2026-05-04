import api from './apiClient';
import type { MultimediaEstudio } from './registroClinicoService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const MediaService = {
  upload: async (registroId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<MultimediaEstudio>(`/media/upload/${registroId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getFileUrl: (filename: string) => {
    return `${API_URL}/media/${filename}`;
  }
};

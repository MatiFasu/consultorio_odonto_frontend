import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'; 
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de petición: Inyectar el token JWT real si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: Manejo centralizado de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Manejo de error 401 (Autenticación)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // 2. Extraer el mensaje de error del backend si existe
    if (error.response && error.response.data) {
      const backendError = error.response.data;
      // Normalizamos el error para que siempre tenga una propiedad 'details' limpia
      error.message = backendError.details || backendError.message || "Error desconocido en el servidor";
    }

    return Promise.reject(error);
  }
);

export default api;

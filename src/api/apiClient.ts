import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, 
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

// Interceptor de respuesta: Manejar errores 401 (Token expirado o inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

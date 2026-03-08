import axios from 'axios';

// REEMPLAZA esta URL por la que te dé Railway o Render (ej: https://tu-backend.up.railway.app)
const API_URL = 'http://localhost:8080'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

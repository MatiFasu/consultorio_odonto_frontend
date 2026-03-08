import axios from 'axios';

// URL de producción en Railway
const API_URL = 'https://shimmering-youthfulness-production.up.railway.app'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

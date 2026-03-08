import axios from 'axios';

// Cambia esta URL por la que te dé Railway o Render cuando hagas el deploy
const API_URL = 'http://localhost:8080'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

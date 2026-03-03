import axios from 'axios';

// Cambia esta URL por la que te dé Railway o Render cuando hagas el deploy
const API_URL = 'https://shimmering-youthfulness-production.up.railway.app'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

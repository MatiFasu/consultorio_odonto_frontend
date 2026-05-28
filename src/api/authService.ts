import api from './apiClient';

export interface LoginRequest {
  username: string;
  contrasenia: string;
}

export interface AuthResponse {
  token: string;
  usuario: string;
  rol: string;
  id: number;
}

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse | null> => {
    // Solo login real contra el backend
    const response = await api.post<AuthResponse>('/usuario/login', credentials);
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: (): AuthResponse | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

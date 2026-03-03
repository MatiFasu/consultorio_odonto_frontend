import api from './apiClient';

export interface LoginRequest {
  username: string;
  contrasenia: string;
}

// Usuarios de prueba para el Modo Demo
const mockUsers = [
  { id_usuario: 1, usuario: 'admin', contrasenia: 'admin', rol: 'ADMIN' },
  { id_usuario: 2, usuario: 'secretaria_ana', contrasenia: '1234', rol: 'SECRETARIA' },
  { id_usuario: 3, usuario: 'dr_garcia', contrasenia: 'odontosys', rol: 'ODONTOLOGO' },
];

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<boolean> => {
    try {
      const response = await api.post<number>('/usuario/login', credentials);
      return response.data === 1;
    } catch (error) {
      // MODO DEMO: Validamos contra la lista de usuarios de prueba
      const found = mockUsers.find(
        u => u.usuario === credentials.username && u.contrasenia === credentials.contrasenia
      );
      return !!found;
    }
  },
  
  getUserInfo: async (username: string) => {
    try {
      const response = await api.get<any[]>('/usuario/traer');
      const user = response.data.find(u => u.usuario === username);
      if (user) return user;
      throw new Error("User not found in backend");
    } catch (error) {
      // MODO DEMO: Devolvemos el objeto completo del usuario de prueba
      return mockUsers.find(u => u.usuario === username) || {
        id_usuario: 1,
        usuario: username,
        rol: 'ADMIN'
      };
    }
  }
};

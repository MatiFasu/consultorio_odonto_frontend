
// Base de Datos Local Limpia - Solo el Administrador existe por defecto
const DEFAULT_DATA: Record<string, any> = {
  '/usuario/traer': [
    { id: 1, usuario: 'admin', contrasenia: 'admin', rol: 'ADMIN' }
  ],
  '/horario/traer': [],
  '/odontologo/traer': [],
  '/secretaria/traer': [],
  '/paciente/traer': [],
  '/turno/traer': [],
  '/facturacion/estado-cuenta': { totalPresupuestado: 0, totalPagado: 0, saldoPendiente: 0 }
};

const getDb = () => {
  const db = localStorage.getItem('mock_db');
  if (!db) {
    localStorage.setItem('mock_db', JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
  return JSON.parse(db);
};

const saveDb = (data: any) => {
  localStorage.setItem('mock_db', JSON.stringify(data));
};

export const getMockResponse = (url: string = '', method: string = 'GET', body: any = null) => {
  const db = getDb();
  let path = url.replace('http://localhost:8080', '').split('?')[0];
  if (!path.startsWith('/')) path = '/' + path;

  // LOGIN INTELIGENTE (Admin + Usuarios Creados)
  if (path.includes('/usuario/login')) {
     const username = body?.username;
     const password = body?.contrasenia;

     // 1. Buscamos en la lista de usuarios de la "Base de Datos Local"
     const allUsers = db['/usuario/traer'] || [];
     const found = allUsers.find((u: any) => u.usuario === username && (u.contrasenia === password || !u.contrasenia));

     if (found) {
        return { 
          token: `mock-jwt-${found.rol}-${found.id}`, 
          usuario: found.usuario, 
          rol: found.rol 
        };
     }
     return null;
  }

  // LECTURA (GET)
  if (method === 'GET') {
    for (const key in db) {
      if (path.startsWith(key)) return db[key];
    }
  }

  // ESCRITURA (POST/PUT)
  if (method === 'POST' || method === 'PUT') {
    let listKey = '';
    if (path.includes('/paciente')) listKey = '/paciente/traer';
    if (path.includes('/odontologo')) listKey = '/odontologo/traer';
    if (path.includes('/secretaria')) listKey = '/secretaria/traer';
    if (path.includes('/turno')) listKey = '/turno/traer';
    if (path.includes('/usuario')) listKey = '/usuario/traer';

    if (listKey) {
       const list = db[listKey];
       if (method === 'PUT' || path.includes('/editar')) {
         const id = body.id;
         const index = list.findIndex((item: any) => item.id === id);
         if (index !== -1) list[index] = { ...list[index], ...body };
       } else {
         const newId = Math.floor(Math.random() * 1000);
         body.id = newId;
         list.push(body);
       }
       saveDb(db);
       return body;
    }
    return { success: true };
  }

  // BORRADO (DELETE)
  if (method === 'DELETE') {
    const segments = path.split('/');
    const id = parseInt(segments[segments.length - 1]);
    let listKey = '';
    if (path.includes('/paciente')) listKey = '/paciente/traer';
    if (path.includes('/odontologo')) listKey = '/odontologo/traer';
    if (path.includes('/secretaria')) listKey = '/secretaria/traer';
    if (path.includes('/turno')) listKey = '/turno/traer';
    if (path.includes('/usuario')) listKey = '/usuario/traer';

    if (listKey && !isNaN(id)) {
       db[listKey] = db[listKey].filter((item: any) => item.id !== id);
       saveDb(db);
       return { success: true };
    }
    return { success: true };
  }

  return null;
};

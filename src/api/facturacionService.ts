import api, { type PaginatedResponse } from './apiClient';
import type { Paciente } from './pacienteService';

export interface ItemPresupuesto {
  id?: number;
  descripcion: string;
  costo: number;
}

export interface Presupuesto {
  id?: number;
  fecha: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'FINALIZADO';
  total: number;
  idPaciente: number;
  nombrePaciente?: string;
  items: ItemPresupuesto[];
}

export interface Pago {
  id?: number;
  fecha: string;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MERCADO_PAGO';
  notas: string;
  transaccionId?: string;
  idPaciente: number;
  nombrePaciente?: string;
  idPresupuesto?: number;
}

export interface EstadoCuenta {
  totalPresupuestado: number;
  totalPagado: number;
  saldoPendiente: number;
}

export const FacturacionService = {
  // Presupuestos
  getPresupuestos: async (pacienteId: number) => {
    const response = await api.get<Presupuesto[]>(`/facturacion/presupuestos/paciente/${pacienteId}`);
    return response.data;
  },
  getPresupuestosPaginated: async (page: number = 0, size: number = 10) => {
    const response = await api.get<PaginatedResponse<Presupuesto>>(`/facturacion/presupuestos/traer/paginado?page=${page}&size=${size}`);
    return response.data;
  },
  savePresupuesto: async (p: Presupuesto) => {
    const response = await api.post<Presupuesto>('/facturacion/presupuestos/crear', p);
    return response.data;
  },
  deletePresupuesto: async (id: number) => {
    const response = await api.delete(`/facturacion/presupuestos/eliminar/${id}`);
    return response.data;
  },

  // Pagos
  getPagos: async (pacienteId: number) => {
    const response = await api.get<Pago[]>(`/facturacion/pagos/paciente/${pacienteId}`);
    return response.data;
  },
  getPagosPaginated: async (page: number = 0, size: number = 10) => {
    const response = await api.get<PaginatedResponse<Pago>>(`/facturacion/pagos/traer/paginado?page=${page}&size=${size}`);
    return response.data;
  },
  registrarPago: async (p: Pago) => {
    const response = await api.post<Pago>('/facturacion/pagos/registrar', p);
    return response.data;
  },
  deletePago: async (id: number) => {
    const response = await api.delete(`/facturacion/pagos/eliminar/${id}`);
    return response.data;
  },

  // Balance
  getEstadoCuenta: async (pacienteId: number) => {
    const response = await api.get<EstadoCuenta>(`/facturacion/estado-cuenta/${pacienteId}`);
    return response.data;
  }
};

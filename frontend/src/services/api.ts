import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config;
}, (error) => {
  return Promise.reject(error);
})

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
  initials: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserDto;
}

export interface InformeEntregaResponse {
  mensaje: string;
  nombreArchivo: string;
  tamanoBytes: number;
  contentType: string;
  fechaEntrega: string;
}

export interface Planificacion {
  id: number;
  nombreArchivo?: string;
  tipoArchivo?: string;
  archivo?: string;
  rutaAlmacenamiento?: string;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | string;
  fecha?: string;
  fechaCreacion?: string;
  retroalimentacion?: string | null;
  usuario?: UserDto | null;
}

export const uploadInformeFinal = async (archivo: File): Promise<InformeEntregaResponse> => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const response = await API.post<InformeEntregaResponse>('/practicas/informe-final', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Subir planificación asociando el userId para RBAC
export const uploadPlanificacion = async (file: File, userId?: number): Promise<Planificacion> => {
  const formData = new FormData();
  formData.append('archivo', file);
  if (userId) {
    formData.append('userId', userId.toString());
  }

  const response = await API.post<Planificacion>('/planificaciones', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Obtener historial con parámetros RBAC (userId y role)
export const getPlanificaciones = async (userId?: number, role?: string): Promise<Planificacion[]> => {
  const response = await API.get<Planificacion[]>('/planificaciones', {
    params: {
      userId,
      role,
    },
  });
  return response.data;
};

// Evaluar planificación (Aprobar o Rechazar con comentarios) - Solo Docentes / Evaluadores
export const evaluarPlanificacion = async (
  id: number,
  estado: 'APROBADA' | 'RECHAZADA',
  retroalimentacion?: string
): Promise<Planificacion> => {
  const response = await API.patch<Planificacion>(`/planificaciones/${id}/evaluar`, {
    estado,
    retroalimentacion: retroalimentacion || '',
  });
  return response.data;
};

export default API

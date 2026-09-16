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
  createdAt: string;
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
  nombreArchivo: string;
  tipoArchivo: string;
  rutaAlmacenamiento?: string;
  fechaCreacion: string;
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

export const uploadPlanificacion = async (file: File): Promise<Planificacion> => {
  const formData = new FormData();
  formData.append('archivo', file);

  const response = await API.post<Planificacion>('/planificaciones', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getPlanificaciones = async (): Promise<Planificacion[]> => {
  const response = await API.get<Planificacion[]>('/planificaciones');
  return response.data;
};

export default API


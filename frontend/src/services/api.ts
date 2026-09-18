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

export interface InscripcionDto {
  inscripcionId: number;
  estudianteRut: string;
  nombreCompleto: string;
  correo: string;
}

export const getInscripcionesForProfesor = async (profesorEmail: string): Promise<InscripcionDto[]> => {
  const response = await API.get<InscripcionDto[]>(`/practicas/inscripciones?profesorEmail=${encodeURIComponent(profesorEmail)}`)
  return response.data
}

export interface OfertaDto {
  id: number;
  anio: number;
  periodo: number;
  asignaturaCodigo: string;
  asignaturaNombre: string;
  inscritosCount?: number;
}

export const getOfertasForProfesor = async (profesorEmail: string): Promise<OfertaDto[]> => {
  const response = await API.get<OfertaDto[]>(`/practicas/ofertas?profesorEmail=${encodeURIComponent(profesorEmail)}`)
  return response.data
}

export const getOfertaById = async (ofertaId: number): Promise<OfertaDto & { inscritosCount: number }> => {
  const response = await API.get<OfertaDto & { inscritosCount: number }>(`/practicas/ofertas/${ofertaId}`)
  return response.data
}

export const getInscripcionesForOferta = async (ofertaId: number): Promise<InscripcionDto[]> => {
  const response = await API.get<InscripcionDto[]>(`/practicas/ofertas/${ofertaId}/inscripciones`)
  return response.data
}

export const uploadInformeForInscripcion = async (inscripcionId: number, archivo: File): Promise<InformeEntregaResponse> => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const response = await API.post<InformeEntregaResponse>(`/practicas/${inscripcionId}/informe-final`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  return response.data;
}

export default API


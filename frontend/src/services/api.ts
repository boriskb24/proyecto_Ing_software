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

export interface EvaluadorItemDto {
  rut: string;
  nombreCompleto: string;
  correo: string;
  tipo: string;
}

export interface PracticaHistorialItemDto {
  inscripcionId: number;
  ofertaId: number;
  asignaturaCodigo: string;
  asignaturaNombre: string;
  anio: number;
  periodo: number;
  esActual: boolean;
  estado: string;
}

export interface InformeItemDto {
  id: number;
  archivo: string;
  nombreArchivo: string;
  fecha: string;
  emisor: string;
}

export interface EstudianteDetalleDto {
  inscripcionId: number;
  ofertaId: number;
  asignaturaCodigo: string;
  asignaturaNombre: string;
  anio: number;
  periodo: number;
  estudianteRut: string;
  estudianteNombre: string;
  estudianteCorreo: string;
  carrera?: string;
  profesorGuiaNombre?: string;
  profesorGuiaCorreo?: string;
  establecimiento?: string;
  evaluadores: EvaluadorItemDto[];
  historialPracticas: PracticaHistorialItemDto[];
  informeActual?: InformeItemDto | null;
}

export const getDetalleInscripcion = async (inscripcionId: number): Promise<EstudianteDetalleDto> => {
  const response = await API.get<EstudianteDetalleDto>(`/practicas/inscripciones/${inscripcionId}?t=${Date.now()}`);
  return response.data;
};

export interface EstudianteDirectorioDto {
  rut: string;
  nombreCompleto: string;
  correo: string;
  carrera?: string;
  ultimaInscripcionId?: number | null;
  ofertaId?: number | null;
  practicaActual?: string;
  codigoPractica?: string;
  anio?: number;
  periodo?: number;
  estado?: string;
}

export const getEstudiantesDirectorio = async (profesorEmail?: string): Promise<EstudianteDirectorioDto[]> => {
  const params = profesorEmail ? `?profesorEmail=${encodeURIComponent(profesorEmail)}` : '';
  const response = await API.get<EstudianteDirectorioDto[]>(`/practicas/alumnos${params}`);
  return response.data;
};

export const getDetalleEstudianteByRut = async (rut: string): Promise<EstudianteDetalleDto> => {
  const response = await API.get<EstudianteDetalleDto>(`/practicas/estudiantes/${rut}`);
  return response.data;
};

// Determina el período académico actual (1: primer semestre, 2: segundo semestre)
export const CURRENT_ACADEMIC_YEAR = 2026;

export const getPeriodoAcademicoActual = (ofertas?: OfertaDto[]) => {
  const currentYear = CURRENT_ACADEMIC_YEAR;
  const currentMonth = new Date().getMonth() + 1;
  const calendarPeriod = currentMonth >= 8 ? 2 : 1;

  if (ofertas && ofertas.length > 0) {
    const hasCalendar = ofertas.some(o => o.anio === currentYear && o.periodo === calendarPeriod);
    if (!hasCalendar) {
      const other = calendarPeriod === 1 ? 2 : 1;
      const hasOther = ofertas.some(o => o.anio === currentYear && o.periodo === other);
      if (hasOther) {
        return { anio: currentYear, periodo: other };
      }
    }
  }

  return { anio: currentYear, periodo: calendarPeriod };
};

export const esPracticaActual = (anio: number, periodo: number, periodoActual?: { anio: number; periodo: number }) => {
  const ref = periodoActual || getPeriodoAcademicoActual();
  return anio === ref.anio && periodo === ref.periodo;
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

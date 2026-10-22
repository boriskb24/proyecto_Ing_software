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
  id?: number;
  archivoUrl?: string;
}

export interface Planificacion {
  id: number;
  nombreArchivo?: string;
  tipoArchivo?: string;
  archivo?: string;
  archivoUrl?: string;
  rutaAlmacenamiento?: string;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | string;
  fecha?: string;
  fechaCreacion?: string;
  fechaClase?: string;
  retroalimentacion?: string | null;
  usuario?: UserDto | null;
}

export const uploadInformeFinal = async (
  archivo: File,
  userIdOrEmail?: number | string,
  correo?: string
): Promise<InformeEntregaResponse> => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (typeof userIdOrEmail === 'number') {
    formData.append('userId', userIdOrEmail.toString());
  } else if (typeof userIdOrEmail === 'string') {
    formData.append('email', userIdOrEmail);
    formData.append('correo', userIdOrEmail);
  }
  if (correo) {
    formData.append('correo', correo);
    formData.append('email', correo);
  }

  const response = await API.post<InformeEntregaResponse>('/practicas/informe-final', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getMiInforme = async (email: string): Promise<InformeEntregaResponse | null> => {
  try {
    const response = await API.get<InformeEntregaResponse>(`/practicas/mi-informe?email=${encodeURIComponent(email)}`);
    if (response.status === 204 || !response.data) {
      return null;
    }
    return response.data;
  } catch (error) {
    return null;
  }
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
  inscripcionId?: number;
  profesorNombre?: string;
  profesorCorreo?: string;
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
  primerNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
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
  archivoUrl?: string;
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

export const getDetalleInscripcion = async (inscripcionId: number, userEmail?: string): Promise<EstudianteDetalleDto> => {
  const emailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : '';
  const response = await API.get<EstudianteDetalleDto>(`/practicas/inscripciones/${inscripcionId}?t=${Date.now()}${emailParam}`);
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

export const getDetalleEstudianteByRut = async (rut: string, userEmail?: string): Promise<EstudianteDetalleDto> => {
  const emailParam = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
  const response = await API.get<EstudianteDetalleDto>(`/practicas/estudiantes/${rut}${emailParam}`);
  return response.data;
};

export const getDetalleEstudianteByCorreo = async (correo: string, userEmail?: string): Promise<EstudianteDetalleDto> => {
  const emailParam = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
  const response = await API.get<EstudianteDetalleDto>(`/practicas/estudiantes/correo/${encodeURIComponent(correo)}${emailParam}`);
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

// Subir planificación asociando el userId para RBAC y fechaClase para la clase planificada
export const uploadPlanificacion = async (file: File, userId?: number, fechaClase?: string): Promise<Planificacion> => {
  const formData = new FormData();
  formData.append('archivo', file);
  if (userId) {
    formData.append('userId', userId.toString());
  }
  if (fechaClase) {
    formData.append('fechaClase', fechaClase);
  }

  const response = await API.post<Planificacion>('/planificaciones', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Reemplazar archivo de una planificación existente
export const reemplazarPlanificacion = async (id: number, file: File, userId?: number): Promise<Planificacion> => {
  const formData = new FormData();
  formData.append('archivo', file);
  if (userId) {
    formData.append('userId', userId.toString());
  }

  const response = await API.post<Planificacion>(`/planificaciones/${id}/reemplazar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Obtener historial con parámetros RBAC (userId, role, email, inscripcionId)
export const getPlanificaciones = async (
  userId?: number,
  role?: string,
  email?: string,
  inscripcionId?: number
): Promise<Planificacion[]> => {
  const response = await API.get<Planificacion[]>('/planificaciones', {
    params: {
      userId,
      role,
      email,
      inscripcionId,
    },
  });
  return response.data;
};

// Evaluar planificación (Aprobar o Rechazar con comentarios) - Solo Docentes / Evaluadores
export const evaluarPlanificacion = async (
  id: number,
  estado: 'APROBADA' | 'RECHAZADA',
  retroalimentacion?: string,
  userEmail?: string
): Promise<Planificacion> => {
  const response = await API.patch<Planificacion>(`/planificaciones/${id}/evaluar`, {
    estado,
    retroalimentacion: retroalimentacion || '',
    userEmail: userEmail || '',
  });
  return response.data;
};

// Formalizar entrega de planificación tras revisión con chatbot IA
export const formalizarPlanificacion = async (id: number, userEmail?: string): Promise<Planificacion> => {
  const response = await API.patch<Planificacion>(`/planificaciones/${id}/formalizar`, null, {
    params: { userEmail },
  });
  return response.data;
};

/**
 * Genera una URL de acceso a un archivo adjuntando de forma segura los parámetros de autenticación
 * para permitir la apertura en una nueva pestaña (target="_blank") sin que el navegador bloquee la petición por 403.
 */
export const getAuthFileUrl = (url?: string): string => {
  if (!url || url === '#' || url.startsWith('blob:') || url.startsWith('data:')) {
    return url || '#';
  }
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let email = '';
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      email = u.email || '';
    } catch (e) {
      // Ignorar error de parsing
    }
  }

  const separator = url.includes('?') ? '&' : '?';
  const parts: string[] = [];
  if (token && !url.includes('token=')) {
    parts.push(`token=${encodeURIComponent(token)}`);
  }
  if (email && !url.includes('userEmail=')) {
    parts.push(`userEmail=${encodeURIComponent(email)}`);
  }

  return parts.length > 0 ? `${url}${separator}${parts.join('&')}` : url;
};

// ==========================================
// Módulo Chatbot IA: RetroPlani Mate V3
// ==========================================

export interface ChatMessageDto {
  id: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | string;
  content: string;
  promptTokens?: number;
  completionTokens?: number;
  createdAt?: string;
}

export interface ChatSessionDto {
  sessionId: number;
  planificacionId: number;
  userEmail: string;
  rolUsuario: string;
  totalPaginas: number;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageDto[];
}

export const initChatSession = async (planificacionId: number): Promise<ChatSessionDto> => {
  const response = await API.post<ChatSessionDto>('/ai/session/init', { planificacionId });
  return response.data;
};

export const sendChatMessage = async (sessionId: number, message: string): Promise<ChatMessageDto> => {
  const response = await API.post<ChatMessageDto>('/ai/chat', { sessionId, message });
  return response.data;
};

export const getChatSession = async (sessionId: number): Promise<ChatSessionDto> => {
  const response = await API.get<ChatSessionDto>(`/ai/session/${sessionId}`);
  return response.data;
};

export default API


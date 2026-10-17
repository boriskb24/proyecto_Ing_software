export type TipoFiltroEvaluacion = 'TODAS' | 'CLASE' | 'SEMESTRAL';

export interface EvaluacionCLA {
  id: number;
  rutEstudiante: string;
  nombreCompletoEstudiante: string;
  tipoEvaluacion: string;
  nota?: number | null;
  observaciones?: string | null;
  fecha: string; // ISO LocalDateTime string
  archivoUrl?: string;
  nombreArchivo?: string;
  evaluadorNombre?: string;
  evaluadorRut?: string;
  evaluadorTipo?: string;
  anio?: number;
  periodo?: number;
  asignaturaNombre?: string;
}

export interface EvaluacionSEM {
  id: number;
  rutEstudiante: string;
  nombreCompletoEstudiante: string;
  tipoEvaluacion: string;
  nota?: number | null;
  observaciones?: string | null;
  fecha: string; // ISO LocalDate string
  archivoUrl?: string;
  nombreArchivo?: string;
  evaluadorNombre?: string;
  evaluadorRut?: string;
  evaluadorTipo?: string;
  anio?: number;
  periodo?: number;
  asignaturaNombre?: string;
}

export interface EvaluacionesResponse {
  evaluacionesClase: EvaluacionCLA[];
  evaluacionesSemestrales: EvaluacionSEM[];
}
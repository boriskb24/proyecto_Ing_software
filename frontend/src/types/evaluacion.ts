export type TipoFiltroEvaluacion = 'TODAS' | 'CLASE' | 'SEMESTRAL';

export interface EvaluacionCLA {
  id: number;
  rutEstudiante: string;
  nombreCompletoEstudiante: string;
  tipoEvaluacion: string;
  nota: number | null;
  observaciones: string;
  fecha: string; // ISO LocalDateTime string
}

export interface EvaluacionSEM {
  id: number;
  rutEstudiante: string;
  nombreCompletoEstudiante: string;
  tipoEvaluacion: string;
  nota: number | null;
  observaciones: string;
  fecha: string; // ISO LocalDate string
}

export interface EvaluacionesResponse {
  evaluacionesClase: EvaluacionCLA[];
  evaluacionesSemestrales: EvaluacionSEM[];
}
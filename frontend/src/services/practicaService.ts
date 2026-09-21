import API from './api';
import { EvaluacionesResponse, TipoFiltroEvaluacion } from '../types/evaluacion';

export const getEvaluacionesProfesor = async (
  rutProfesor?: string,
  tipo: TipoFiltroEvaluacion = 'TODAS',
  correoProfesor?: string,
  rutEstudiante?: string,
  inscripcionId?: number
): Promise<EvaluacionesResponse> => {
  const params: Record<string, string | number> = { tipo };
  if (rutProfesor && rutProfesor.trim()) {
    params.rutProfesor = rutProfesor.trim();
  }
  if (correoProfesor && correoProfesor.trim()) {
    params.correoProfesor = correoProfesor.trim();
  }
  if (rutEstudiante && rutEstudiante.trim()) {
    params.rutEstudiante = rutEstudiante.trim();
  }
  if (inscripcionId !== undefined && inscripcionId !== null) {
    params.inscripcionId = inscripcionId;
  }

  const response = await API.get<EvaluacionesResponse>(
    '/practicas/evaluaciones/profesor',
    { params }
  );
  return response.data;
};

export const getEvaluacionesEstudiante = async (
  correoEstudiante?: string,
  rutEstudiante?: string,
  inscripcionId?: number,
  tipo: TipoFiltroEvaluacion = 'TODAS'
): Promise<EvaluacionesResponse> => {
  const params: Record<string, string | number> = { tipo };
  if (correoEstudiante && correoEstudiante.trim()) {
    params.correoEstudiante = correoEstudiante.trim();
  }
  if (rutEstudiante && rutEstudiante.trim()) {
    params.rutEstudiante = rutEstudiante.trim();
  }
  if (inscripcionId !== undefined && inscripcionId !== null) {
    params.inscripcionId = inscripcionId;
  }

  const response = await API.get<EvaluacionesResponse>(
    '/practicas/evaluaciones/estudiante',
    { params }
  );
  return response.data;
};
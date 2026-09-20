import axios from 'axios';
import { EvaluacionesResponse, TipoFiltroEvaluacion } from '../types/evaluacion';

const API_BASE_URL = 'http://localhost:8080/api/practicas';

export const getEvaluacionesProfesor = async (
  rutProfesor: string,
  tipo: TipoFiltroEvaluacion = 'TODAS'
): Promise<EvaluacionesResponse> => {
  const response = await axios.get<EvaluacionesResponse>(
    `${API_BASE_URL}/evaluaciones/profesor`,
    {
      params: { rutProfesor, tipo },
    }
  );
  return response.data;
};
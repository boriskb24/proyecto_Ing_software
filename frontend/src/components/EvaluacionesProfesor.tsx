import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { getEvaluacionesProfesor } from '../services/practicaService';
import { EvaluacionesResponse, TipoFiltroEvaluacion } from '../types/evaluacion';

interface Props {
  rutProfesor: string;
}

export const EvaluacionesProfesor: React.FC<Props> = ({ rutProfesor }) => {
  const [data, setData] = useState<EvaluacionesResponse>({
    evaluacionesClase: [],
    evaluacionesSemestrales: [],
  });
  const [filtro, setFiltro] = useState<TipoFiltroEvaluacion>('TODAS');
  const [rutBusqueda, setRutBusqueda] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEvaluacionesProfesor(rutProfesor, filtro);
      setData(response);
    } catch (err) {
      setError('Error al cargar las evaluaciones del profesor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rutProfesor, filtro]);

  useEffect(() => {
    if (rutProfesor) {
      fetchEvaluaciones();
    }
  }, [fetchEvaluaciones, rutProfesor]);

  const rutNormalizado = rutBusqueda.trim().toLowerCase();
  const evaluacionesClase = data.evaluacionesClase.filter((item) =>
    item.rutEstudiante.toLowerCase().includes(rutNormalizado)
  );
  const evaluacionesSemestrales = data.evaluacionesSemestrales.filter((item) =>
    item.rutEstudiante.toLowerCase().includes(rutNormalizado)
  );

  return (
    <div className="evaluaciones-page">
      <h2>Seguimiento de Evaluaciones de Práctica</h2>

      <div className="evaluaciones-toolbar">
        <label htmlFor="filtro-select">Filtrar por tipo:</label>
        <select
          id="filtro-select"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as TipoFiltroEvaluacion)}
        >
          <option value="TODAS">Todas las Evaluaciones</option>
          <option value="CLASE">Evaluaciones de Clase</option>
          <option value="SEMESTRAL">Evaluaciones Semestrales</option>
        </select>

        <label className="rut-search" htmlFor="rut-search-input">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Buscar por RUT de estudiante</span>
          <input
            id="rut-search-input"
            type="search"
            value={rutBusqueda}
            onChange={(e) => setRutBusqueda(e.target.value)}
            placeholder="Buscar por RUT de estudiante"
            aria-label="Buscar por RUT de estudiante"
          />
        </label>
      </div>

      {loading && <p>Cargando evaluaciones...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Class Evaluations Table */}
          {(filtro === 'TODAS' || filtro === 'CLASE') && (
            <section style={{ marginBottom: '30px' }}>
              <h3>Evaluaciones de Clase</h3>
              {evaluacionesClase.length === 0 ? (
                <p className="empty-state">
                  {rutBusqueda ? 'No hay evaluaciones para ese RUT.' : 'No hay evaluaciones de clase registradas.'}
                </p>
              ) : (
                <div className="table-scroll">
                <table className="evaluaciones-table">
                  <thead>
                    <tr>
                      <th>RUT Estudiante</th>
                      <th>Nombre Estudiante</th>
                      <th>Nota</th>
                      <th>Observaciones</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluacionesClase.map((item) => (
                      <tr key={item.id}>
                        <td>{item.rutEstudiante}</td>
                        <td>{item.nombreCompletoEstudiante}</td>
                        <td>{item.nota ?? 'N/A'}</td>
                        <td>{item.observaciones ?? 'Sin observaciones'}</td>
                        <td>{new Date(item.fecha).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </section>
          )}

          {/* Semester Evaluations Table */}
          {(filtro === 'TODAS' || filtro === 'SEMESTRAL') && (
            <section>
              <h3>Evaluaciones Semestrales</h3>
              {evaluacionesSemestrales.length === 0 ? (
                <p className="empty-state">
                  {rutBusqueda ? 'No hay evaluaciones para ese RUT.' : 'No hay evaluaciones semestrales registradas.'}
                </p>
              ) : (
                <div className="table-scroll">
                <table className="evaluaciones-table">
                  <thead>
                    <tr>
                      <th>RUT Estudiante</th>
                      <th>Nombre Estudiante</th>
                      <th>Nota</th>
                      <th>Observaciones</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluacionesSemestrales.map((item) => (
                      <tr key={item.id}>
                        <td>{item.rutEstudiante}</td>
                        <td>{item.nombreCompletoEstudiante}</td>
                        <td>{item.nota ?? 'N/A'}</td>
                        <td>{item.observaciones ?? 'Sin observaciones'}</td>
                        <td>{item.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};
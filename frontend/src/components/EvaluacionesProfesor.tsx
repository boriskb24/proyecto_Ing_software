import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, FileText, ExternalLink, Calendar, UserCheck, Filter, Clock, CheckCircle2, Award } from 'lucide-react';
import { getEvaluacionesProfesor } from '../services/practicaService';
import { EvaluacionesResponse, TipoFiltroEvaluacion, EvaluacionCLA, EvaluacionSEM } from '../types/evaluacion';

interface Props {
  rutProfesor?: string;
  correoProfesor?: string;
}

export const EvaluacionesProfesor: React.FC<Props> = ({ rutProfesor, correoProfesor }) => {
  const [data, setData] = useState<EvaluacionesResponse>({
    evaluacionesClase: [],
    evaluacionesSemestrales: [],
  });
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltroEvaluacion>('TODAS');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'TODAS' | 'ACTUALES' | 'ANTIGUAS'>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEvaluacionesProfesor(rutProfesor, filtroTipo, correoProfesor);
      setData(response);
    } catch (err) {
      setError('Error al cargar las evaluaciones de tus estudiantes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rutProfesor, correoProfesor, filtroTipo]);

  useEffect(() => {
    fetchEvaluaciones();
  }, [fetchEvaluaciones]);

  const esPeriodoActual = (anio?: number, periodo?: number) => {
    if (!anio || !periodo) return true;
    return anio === 2026 && periodo === 1;
  };

  const formatoTipoEvaluador = (tipo?: string) => {
    if (!tipo) return 'Evaluador';
    if (tipo === 'TUTOR_CENTRO') return 'Tutor de Centro';
    if (tipo === 'SUPERVISOR') return 'Supervisor';
    return tipo;
  };

  const itemCoincidePeriodo = (anio?: number, periodo?: number) => {
    if (filtroPeriodo === 'TODAS') return true;
    const actual = esPeriodoActual(anio, periodo);
    return filtroPeriodo === 'ACTUALES' ? actual : !actual;
  };

  const itemCoincideBusqueda = (item: {
    rutEstudiante: string;
    nombreCompletoEstudiante: string;
    evaluadorNombre?: string;
    asignaturaNombre?: string;
  }) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    return (
      item.rutEstudiante.toLowerCase().includes(q) ||
      item.nombreCompletoEstudiante.toLowerCase().includes(q) ||
      (item.evaluadorNombre && item.evaluadorNombre.toLowerCase().includes(q)) ||
      (item.asignaturaNombre && item.asignaturaNombre.toLowerCase().includes(q))
    );
  };

  const evaluacionesClaseFiltradas = useMemo(() => {
    return data.evaluacionesClase.filter(
      (item) => itemCoincidePeriodo(item.anio, item.periodo) && itemCoincideBusqueda(item)
    );
  }, [data.evaluacionesClase, filtroPeriodo, busqueda]);

  const evaluacionesSemestralesFiltradas = useMemo(() => {
    return data.evaluacionesSemestrales.filter(
      (item) => itemCoincidePeriodo(item.anio, item.periodo) && itemCoincideBusqueda(item)
    );
  }, [data.evaluacionesSemestrales, filtroPeriodo, busqueda]);

  const totalEvaluaciones = data.evaluacionesClase.length + data.evaluacionesSemestrales.length;

  return (
    <div className="evaluaciones-page" style={{ paddingBottom: '40px' }}>
      {/* Encabezado Principal */}
      <div style={{
        backgroundColor: '#131e3a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              <Award size={16} />
              <span>Seguimiento Académico</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>
              Evaluaciones de <span style={{ color: '#d4af37' }}>Mis Estudiantes</span>
            </h1>
            <p style={{ fontSize: '14.5px', color: '#94a3b8', margin: 0, maxWidth: '650px' }}>
              Consulta las evaluaciones aplicadas por los evaluadores (tutores de centro y supervisores) a tus estudiantes de práctica profesional.
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '8px 14px',
            borderRadius: '10px',
            color: '#d4af37',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            <Calendar size={16} />
            <span>Período Vigente: Año 2026 • Primer Semestre</span>
          </div>
        </div>

        {/* Métricas Resumen */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Evaluaciones</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{totalEvaluaciones}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
            <div style={{ fontSize: '12px', color: '#93c5fd', textTransform: 'uppercase' }}>Evaluaciones de Clase</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa', marginTop: '4px' }}>{data.evaluacionesClase.length}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ fontSize: '12px', color: '#c084fc', textTransform: 'uppercase' }}>Evaluaciones Semestrales</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#c084fc', marginTop: '4px' }}>{data.evaluacionesSemestrales.length}</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '24px',
        backgroundColor: '#131e3a',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Selector de Período (Actuales vs Antiguas) */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            onClick={() => setFiltroPeriodo('TODAS')}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: filtroPeriodo === 'TODAS' ? '#2563eb' : 'transparent',
              color: filtroPeriodo === 'TODAS' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFiltroPeriodo('ACTUALES')}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: filtroPeriodo === 'ACTUALES' ? '#2563eb' : 'transparent',
              color: filtroPeriodo === 'ACTUALES' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            Actuales (En curso)
          </button>
          <button
            type="button"
            onClick={() => setFiltroPeriodo('ANTIGUAS')}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: filtroPeriodo === 'ANTIGUAS' ? '#2563eb' : 'transparent',
              color: filtroPeriodo === 'ANTIGUAS' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            Antiguas (Histórico)
          </button>
        </div>

        {/* Selector de Tipo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tipo:</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoFiltroEvaluacion)}
            style={{
              backgroundColor: '#0b1329',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="TODAS">Todas las Evaluaciones</option>
            <option value="CLASE">Solo Evaluaciones de Clase</option>
            <option value="SEMESTRAL">Solo Evaluaciones Semestrales</option>
          </select>
        </div>

        {/* Buscador */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#0b1329',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '6px 12px',
          flex: '1 1 260px',
          maxWidth: '360px',
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por estudiante, RUT o evaluador..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '13px',
              width: '100%',
            }}
          />
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
          <p>Cargando evaluaciones de tus estudiantes...</p>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '14px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* TABLA 1: EVALUACIONES DE CLASE */}
          {(filtroTipo === 'TODAS' || filtroTipo === 'CLASE') && (
            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Evaluaciones de Clase</span>
                  <span style={{ fontSize: '12px', backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '6px' }}>
                    {evaluacionesClaseFiltradas.length}
                  </span>
                </h3>
              </div>

              {evaluacionesClaseFiltradas.length === 0 ? (
                <div style={{
                  backgroundColor: '#131e3a',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13.5px'
                }}>
                  {busqueda.trim()
                    ? 'No hay evaluaciones de clase que coincidan con los filtros aplicados.'
                    : 'No hay evaluaciones de clase registradas para tus estudiantes en este período.'}
                </div>
              ) : (
                <div className="table-scroll" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <table className="evaluaciones-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#18274d' }}>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Estudiante</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Práctica / Período</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Evaluador Responsable</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Fecha de Clase</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px', textAlign: 'center' }}>Pauta de Evaluación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluacionesClaseFiltradas.map((item) => {
                        const actual = esPeriodoActual(item.anio, item.periodo);
                        return (
                          <tr key={item.id} style={{ backgroundColor: '#131e3a', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
                                {item.nombreCompletoEstudiante}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                RUT: {item.rutEstudiante}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>
                                {item.asignaturaNombre || 'Práctica Profesional'}
                              </div>
                              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: actual ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                  color: actual ? '#4ade80' : '#94a3b8',
                                  border: `1px solid ${actual ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                }}>
                                  {actual ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                  {item.anio ? `Año ${item.anio} • Sem. ${item.periodo}` : 'Período Vigente'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#e2e8f0', fontSize: '13px' }}>
                                <UserCheck size={15} color="#60a5fa" />
                                <span>{item.evaluadorNombre || 'Evaluador No Asignado'}</span>
                              </div>
                              {item.evaluadorTipo && (
                                <span style={{
                                  display: 'inline-block',
                                  marginTop: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: 'rgba(37, 99, 235, 0.15)',
                                  color: '#93c5fd',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                }}>
                                  {formatoTipoEvaluador(item.evaluadorTipo)}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                              {item.fecha ? new Date(item.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <a
                                href={item.archivoUrl || `/api/practicas/evaluaciones/clase/${item.id}/archivo`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: '#2563eb',
                                  color: '#ffffff',
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  textDecoration: 'none',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Abrir pauta de evaluación en nueva pestaña"
                              >
                                <FileText size={14} /> Ver Pauta (PDF) <ExternalLink size={12} />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TABLA 2: EVALUACIONES SEMESTRALES */}
          {(filtroTipo === 'TODAS' || filtroTipo === 'SEMESTRAL') && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Evaluaciones Semestrales</span>
                  <span style={{ fontSize: '12px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '6px' }}>
                    {evaluacionesSemestralesFiltradas.length}
                  </span>
                </h3>
              </div>

              {evaluacionesSemestralesFiltradas.length === 0 ? (
                <div style={{
                  backgroundColor: '#131e3a',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13.5px'
                }}>
                  {busqueda.trim()
                    ? 'No hay evaluaciones semestrales que coincidan con los filtros aplicados.'
                    : 'No hay evaluaciones semestrales registradas para tus estudiantes en este período.'}
                </div>
              ) : (
                <div className="table-scroll" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <table className="evaluaciones-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#18274d' }}>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Estudiante</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Práctica / Período</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Evaluador Responsable</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px' }}>Fecha</th>
                        <th style={{ color: '#ffffff', padding: '12px 16px', textAlign: 'center' }}>Documento de Evaluación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluacionesSemestralesFiltradas.map((item) => {
                        const actual = esPeriodoActual(item.anio, item.periodo);
                        return (
                          <tr key={item.id} style={{ backgroundColor: '#131e3a', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
                                {item.nombreCompletoEstudiante}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                RUT: {item.rutEstudiante}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>
                                {item.asignaturaNombre || 'Práctica Profesional'}
                              </div>
                              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: actual ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                  color: actual ? '#4ade80' : '#94a3b8',
                                  border: `1px solid ${actual ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                }}>
                                  {actual ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                  {item.anio ? `Año ${item.anio} • Sem. ${item.periodo}` : 'Período Vigente'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#e2e8f0', fontSize: '13px' }}>
                                <UserCheck size={15} color="#c084fc" />
                                <span>{item.evaluadorNombre || 'Evaluador No Asignado'}</span>
                              </div>
                              {item.evaluadorTipo && (
                                <span style={{
                                  display: 'inline-block',
                                  marginTop: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                  color: '#d8b4fe',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                }}>
                                  {formatoTipoEvaluador(item.evaluadorTipo)}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                              {item.fecha ? new Date(item.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <a
                                href={item.archivoUrl || `/api/practicas/evaluaciones/semestral/${item.id}/archivo`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: '#9333ea',
                                  color: '#ffffff',
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  textDecoration: 'none',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Abrir evaluación semestral en nueva pestaña"
                              >
                                <FileText size={14} /> Ver Evaluación (PDF) <ExternalLink size={12} />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
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
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEvaluacionesEstudiante } from '../services/practicaService';
import { getOfertasForProfesor, OfertaDto } from '../services/api';
import { EvaluacionesResponse, EvaluacionCLA, EvaluacionSEM } from '../types/evaluacion';
import {
  Award,
  BookOpen,
  Calendar,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const EvaluacionesEstudiante: React.FC = () => {
  const { user } = useAuth();

  const [ofertas, setOfertas] = useState<OfertaDto[]>([]);
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<OfertaDto | null>(null);
  const [evaluacionesData, setEvaluacionesData] = useState<EvaluacionesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'CLASE' | 'SEMESTRAL'>('TODAS');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // 1. Cargar las ofertas del estudiante para resolver su práctica actual automáticamente
  useEffect(() => {
    if (!user?.email) return;

    const cargarPracticas = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOfertasForProfesor(user.email);
        setOfertas(data || []);
        if (data && data.length > 0) {
          // La primera es la práctica más reciente (actual)
          setPracticaSeleccionada(data[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Error al obtener tus asignaturas de práctica.');
      } finally {
        setLoading(false);
      }
    };

    cargarPracticas();
  }, [user]);

  // 2. Cargar evaluaciones vinculadas a la práctica seleccionada (por defecto la actual)
  useEffect(() => {
    if (!user?.email || !practicaSeleccionada) return;

    const cargarEvaluaciones = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetInscripcionId = practicaSeleccionada.inscripcionId || practicaSeleccionada.id;
        const res = await getEvaluacionesEstudiante(user.email, undefined, targetInscripcionId, 'TODAS');
        setEvaluacionesData(res);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Error al cargar tus evaluaciones de desempeño.');
      } finally {
        setLoading(false);
      }
    };

    cargarEvaluaciones();
  }, [user, practicaSeleccionada]);

  // Combinar y clasificar evaluaciones
  const todasEvaluaciones = useMemo(() => {
    const clases = (evaluacionesData?.evaluacionesClase || []).map((ec: EvaluacionCLA) => ({
      ...ec,
      categoria: 'CLASE' as const,
    }));
    const semestrales = (evaluacionesData?.evaluacionesSemestrales || []).map((es: EvaluacionSEM) => ({
      ...es,
      categoria: 'SEMESTRAL' as const,
    }));
    return [...clases, ...semestrales];
  }, [evaluacionesData]);

  // Filtrado reactivo
  const evaluacionesFiltradas = useMemo(() => {
    return todasEvaluaciones.filter((ev) => {
      if (filtroTipo !== 'TODAS' && ev.categoria !== filtroTipo) {
        return false;
      }
      if (busquedaTexto.trim()) {
        const q = busquedaTexto.toLowerCase();
        const matchEvaluador = ev.evaluadorNombre?.toLowerCase().includes(q);
        const matchTipo = ev.evaluadorTipo?.toLowerCase().includes(q);
        const matchAsig = ev.asignaturaNombre?.toLowerCase().includes(q);
        return matchEvaluador || matchTipo || matchAsig;
      }
      return true;
    });
  }, [todasEvaluaciones, filtroTipo, busquedaTexto]);

  const esPracticaEnCurso = practicaSeleccionada && ofertas.length > 0 && practicaSeleccionada.id === ofertas[0].id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header y Contexto de Práctica Actual */}
      <div
        style={{
          backgroundColor: '#131e3a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Portal Estudiante
              </span>
              {esPracticaEnCurso ? (
                <span
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} /> Práctica Actual en Curso
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} /> Práctica Histórica
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px' }}>
              Mis Evaluaciones de Desempeño
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Pautas de observación de clase y evaluaciones semestrales emitidas por tus evaluadores asignados.
            </p>
          </div>

          {/* Selector de Práctica para el Estudiante (si tiene históricas) */}
          {ofertas.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                Consultar práctica:
              </label>
              <select
                value={practicaSeleccionada?.id || ''}
                onChange={(e) => {
                  const of = ofertas.find((o) => o.id === Number(e.target.value));
                  if (of) setPracticaSeleccionada(of);
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {ofertas.map((o, idx) => (
                  <option key={o.id} value={o.id} style={{ backgroundColor: '#131e3a', color: '#ffffff' }}>
                    {o.asignaturaNombre} ({o.anio}-{o.periodo}) {idx === 0 ? '• Actual' : '• Histórica'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tarjeta de Práctica Contextual */}
        {practicaSeleccionada && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px 20px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              border: '1.5px solid rgba(37, 99, 235, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(37, 99, 235, 0.25)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
                  {practicaSeleccionada.asignaturaNombre} ({practicaSeleccionada.asignaturaCodigo})
                </div>
                <div style={{ fontSize: '12.5px', color: '#93c5fd', marginTop: '2px' }}>
                  Año {practicaSeleccionada.anio} • Período {practicaSeleccionada.periodo === 1 ? 'Primer Semestre' : 'Segundo Semestre'}
                </div>
              </div>
            </div>

            {practicaSeleccionada.profesorNombre && (
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                <span style={{ color: '#94a3b8' }}>Profesor de Asignatura: </span>
                <strong style={{ color: '#ffffff' }}>{practicaSeleccionada.profesorNombre}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tarjetas KPI Resumen */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#131e3a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Evaluaciones</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
              {todasEvaluaciones.length}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#131e3a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Pautas de Clase</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
              {evaluacionesData?.evaluacionesClase.length || 0}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#131e3a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              color: '#d8b4fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Evaluación Semestral</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
              {evaluacionesData?.evaluacionesSemestrales.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Principal: Filtros y Lista */}
      <div
        style={{
          backgroundColor: '#131e3a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Barra de Filtros */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {/* Botones de Categoría */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['TODAS', 'CLASE', 'SEMESTRAL'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroTipo(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: filtroTipo === cat ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: filtroTipo === cat ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: filtroTipo === cat ? '#93c5fd' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat === 'TODAS'
                  ? 'Todas las Pautas'
                  : cat === 'CLASE'
                  ? 'Pautas de Clase'
                  : 'Evaluaciones Semestrales'}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 14px',
              width: '280px',
            }}
          >
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Buscar por evaluador..."
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Feedback de Error */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} color="#f87171" />
            <span>{error}</span>
          </div>
        )}

        {/* Lista de Evaluaciones */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>Cargando evaluaciones de desempeño...</p>
          </div>
        ) : evaluacionesFiltradas.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
            }}
          >
            <Award size={36} color="#64748b" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 6px' }}>
              No se registran evaluaciones para los criterios seleccionados
            </h3>
            <p style={{ fontSize: '13px', margin: 0, color: '#94a3b8' }}>
              {busquedaTexto || filtroTipo !== 'TODAS'
                ? 'Prueba modificando tus términos de búsqueda o el tipo de evaluación.'
                : 'Aún no se han cargado pautas de evaluación por parte de tus evaluadores para esta práctica.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {evaluacionesFiltradas.map((ev) => {
              const isClase = ev.categoria === 'CLASE';
              const isTutor = ev.evaluadorTipo?.toUpperCase().includes('TUTOR');
              return (
                <div
                  key={`${ev.categoria}-${ev.id}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          backgroundColor: isClase ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                          color: isClase ? '#93c5fd' : '#d8b4fe',
                          border: `1px solid ${isClase ? 'rgba(59, 130, 246, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {isClase ? <BookOpen size={12} /> : <Award size={12} />}
                        {isClase ? 'Pauta de Clase' : 'Evaluación Semestral'}
                      </span>

                      <span style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                        {ev.asignaturaNombre || practicaSeleccionada?.asignaturaNombre}
                        {ev.anio && ev.periodo ? ` (${ev.anio}-${ev.periodo})` : ''}
                      </span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} />
                      <span>{ev.fecha ? ev.fecha.split('T')[0] : 'Fecha no registrada'}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14.5px', color: '#ffffff' }}>
                          Evaluador: {ev.evaluadorNombre || 'Evaluador Asignado'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: isTutor ? 'rgba(37, 99, 235, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            color: isTutor ? '#93c5fd' : '#d8b4fe',
                            border: `1px solid ${isTutor ? 'rgba(37, 99, 235, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
                          }}
                        >
                          {isTutor ? 'Profesor Tutor' : 'Profesor Colaborador'}
                        </span>
                      </div>
                      {ev.evaluadorRut && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                          RUT del Evaluador: {ev.evaluadorRut}
                        </div>
                      )}
                    </div>

                    <a
                      href={
                        ev.archivoUrl ||
                        (isClase
                          ? `/api/practicas/evaluaciones/clase/${ev.id}/archivo`
                          : `/api/practicas/evaluaciones/semestral/${ev.id}/archivo`)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                    >
                      <FileText size={15} /> Ver Pauta de Evaluación (PDF) <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluacionesEstudiante;

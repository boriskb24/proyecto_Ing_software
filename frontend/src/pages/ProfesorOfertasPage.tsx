import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { 
  getOfertasForProfesor, 
  OfertaDto, 
  getPeriodoAcademicoActual, 
  esPracticaActual 
} from '../services/api'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Users,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Filter
} from 'lucide-react'

export const ProfesorOfertasPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ofertas, setOfertas] = useState<OfertaDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [tabFiltro, setTabFiltro] = useState<'TODAS' | 'ACTUALES' | 'ANTIGUAS'>('TODAS')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user) throw new Error('Usuario no autenticado')
        const data = await getOfertasForProfesor(user.email)
        setOfertas(data || [])
      } catch (e: any) {
        setError(e.response?.data?.message || e.message || 'Error al obtener ofertas de práctica')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  // Período académico de referencia
  const periodoActual = useMemo(() => getPeriodoAcademicoActual(ofertas), [ofertas])

  // Clasificación de ofertas en Actuales y Antiguas según año y período
  const { actuales, antiguas } = useMemo(() => {
    const act: OfertaDto[] = []
    const ant: OfertaDto[] = []

    ofertas.forEach((o) => {
      if (esPracticaActual(o.anio, o.periodo, periodoActual)) {
        act.push(o)
      } else {
        ant.push(o)
      }
    })

    return { actuales: act, antiguas: ant }
  }, [ofertas, periodoActual])

  const totalInscritos = useMemo(() => {
    return ofertas.reduce((acc, o) => acc + (o.inscritosCount || 0), 0)
  }, [ofertas])

  // Filtrado por texto de búsqueda
  const filterFn = (o: OfertaDto) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      o.asignaturaNombre.toLowerCase().includes(q) ||
      o.asignaturaCodigo.toLowerCase().includes(q) ||
      o.anio.toString().includes(q)
    )
  }

  const filteredActuales = actuales.filter(filterFn)
  const filteredAntiguas = antiguas.filter(filterFn)

  const periodoTexto = (periodo: number) => {
    return periodo === 1 ? 'Primer Semestre' : periodo === 2 ? 'Segundo Semestre' : `Período ${periodo}`
  }

  const isDocente = !!user?.role && (
    user.role.toLowerCase().includes('profesor') ||
    user.role.toLowerCase().includes('administrador') ||
    user.role.toLowerCase().includes('evaluador')
  )
  const isEstudiante = !isDocente

  const handleCardClick = (o: OfertaDto) => {
    if (isEstudiante) {
      return
    }
    navigate(`/practicas/${o.id}`)
  }

  const renderPracticaCard = (o: OfertaDto, esActual: boolean) => {
    // Si es estudiante: tarjeta estática informativa, sin botón y sin navegación
    if (isEstudiante) {
      return (
        <div
          key={o.id}
          style={{
            backgroundColor: '#131e3a',
            border: esActual ? '1.5px solid rgba(37, 99, 235, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            cursor: 'default',
            boxShadow: esActual ? '0 4px 20px rgba(37, 99, 235, 0.12)' : '0 2px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Lado izquierdo: Datos de la práctica */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: esActual ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: esActual ? '#60a5fa' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {esActual ? <Sparkles size={22} /> : <Briefcase size={22} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontWeight: '800', fontSize: '16px', color: '#ffffff' }}>
                  {o.asignaturaNombre}
                </span>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {o.asignaturaCodigo}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#94a3b8', fontSize: '13px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={14} color="#60a5fa" />
                  Año <strong style={{ color: '#e2e8f0' }}>{o.anio}</strong> • <strong style={{ color: '#e2e8f0' }}>{periodoTexto(o.periodo)}</strong>
                </span>
                {o.profesorNombre && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#93c5fd' }}>
                    • Prof. Guía: <strong style={{ color: '#ffffff' }}>{o.profesorNombre}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lado derecho: Estado de la práctica (sin botón entrar, sin redirección) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: esActual ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${esActual ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              color: esActual ? '#4ade80' : '#cbd5e1',
              fontWeight: '600'
            }}>
              <CheckCircle2 size={15} />
              <span>{esActual ? 'En curso' : 'Finalizada'}</span>
            </div>
          </div>
        </div>
      )
    }

    // Modo Profesor / Administrador
    return (
      <div
        key={o.id}
        onClick={() => handleCardClick(o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick(o)
          }
        }}
        role="button"
        tabIndex={0}
        style={{
          backgroundColor: '#131e3a',
          border: esActual ? '1.5px solid rgba(37, 99, 235, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          cursor: 'pointer',
          boxShadow: esActual ? '0 4px 20px rgba(37, 99, 235, 0.12)' : '0 2px 10px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = esActual ? '#18274d' : '#172242'
          e.currentTarget.style.borderColor = esActual ? '#2563eb' : 'rgba(255, 255, 255, 0.2)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#131e3a'
          e.currentTarget.style.borderColor = esActual ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
        title={`Ver estudiantes inscritos en ${o.asignaturaNombre}`}
      >
        {/* Lado izquierdo: Datos de la práctica */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: esActual ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: esActual ? '#60a5fa' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {esActual ? <Sparkles size={22} /> : <Briefcase size={22} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontWeight: '800', fontSize: '16px', color: '#ffffff' }}>
                {o.asignaturaNombre}
              </span>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {o.asignaturaCodigo}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#94a3b8', fontSize: '13px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="#60a5fa" />
                Año <strong style={{ color: '#e2e8f0' }}>{o.anio}</strong> • <strong style={{ color: '#e2e8f0' }}>{periodoTexto(o.periodo)}</strong>
              </span>
              {o.profesorNombre && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#93c5fd' }}>
                  • Prof. Guía: <strong style={{ color: '#ffffff' }}>{o.profesorNombre}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lado derecho: Inscritos y Botón Entrar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: esActual ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${esActual ? 'rgba(37, 99, 235, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: esActual ? '#93c5fd' : '#cbd5e1',
            fontWeight: '600'
          }}>
            <Users size={15} />
            <span>{o.inscritosCount ?? 0} {Number(o.inscritosCount) === 1 ? 'inscrito' : 'inscritos'}</span>
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: esActual ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: esActual ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none',
          }}>
            {esActual ? 'Entrar' : 'Ver Registro'}
            <ChevronRight size={15} />
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 20px 60px' }}>
        {/* Botón Volver */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '24px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>

        {/* Encabezado Principal */}
        <div style={{
          backgroundColor: '#131e3a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '28px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              {!isEstudiante && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  <Briefcase size={16} />
                  <span>Gestión Docente</span>
                </div>
              )}
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>
                Mis <span style={{ color: '#d4af37' }}>Prácticas</span>
              </h1>
              <p style={{ fontSize: '14.5px', color: '#94a3b8', margin: 0, maxWidth: '600px' }}>
                {isEstudiante
                  ? 'Aquí puedes ver el listado de tus prácticas actuales y antiguas'
                  : 'Supervisión de prácticas profesionales divididas por período académico vigente e histórico.'}
              </p>
            </div>

            {/* Insignia Período Académico */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              padding: '10px 16px',
              borderRadius: '12px',
              color: '#d4af37',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              <Calendar size={18} />
              <span>Período Vigente: Año {periodoActual.anio} • {periodoTexto(periodoActual.periodo)}</span>
            </div>
          </div>

          {/* Tarjetas de Métricas Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Prácticas</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{ofertas.length}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
              <div style={{ fontSize: '12px', color: '#93c5fd', textTransform: 'uppercase' }}>Prácticas Actuales</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#60a5fa', marginTop: '4px' }}>{actuales.length}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Prácticas Antiguas</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#cbd5e1', marginTop: '4px' }}>{antiguas.length}</div>
            </div>
            {!isEstudiante && (
              <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div style={{ fontSize: '12px', color: '#d4af37', textTransform: 'uppercase' }}>Alumnos Inscritos</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{totalInscritos}</div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#131e3a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 16px',
            flex: '1 1 320px',
          }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar práctica por asignatura o código..."
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '14px',
                width: '100%',
              }}
            />
          </div>

          {/* Tabs Selector */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#131e3a', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => setTabFiltro('TODAS')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: tabFiltro === 'TODAS' ? '#2563eb' : 'transparent',
                color: tabFiltro === 'TODAS' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Todas ({ofertas.length})
            </button>
            <button
              onClick={() => setTabFiltro('ACTUALES')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: tabFiltro === 'ACTUALES' ? '#2563eb' : 'transparent',
                color: tabFiltro === 'ACTUALES' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Actuales ({actuales.length})
            </button>
            <button
              onClick={() => setTabFiltro('ANTIGUAS')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: tabFiltro === 'ANTIGUAS' ? '#2563eb' : 'transparent',
                color: tabFiltro === 'ANTIGUAS' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Antiguas ({antiguas.length})
            </button>
          </div>
        </div>

        {/* Estado de Carga / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <p>Cargando información de prácticas...</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Listado de Prácticas Divididas */}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* ============================================================ */}
            {/* SECCIÓN 1: PRÁCTICAS ACTUALES */}
            {/* ============================================================ */}
            {(tabFiltro === 'TODAS' || tabFiltro === 'ACTUALES') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      color: '#4ade80',
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                      Prácticas Actuales (En Curso)
                    </span>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Año {periodoActual.anio} • {periodoTexto(periodoActual.periodo)}
                    </span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                    {filteredActuales.length} {isEstudiante ? 'práctica(s) activa(s)' : 'oferta(s) activa(s)'}
                  </span>
                </div>

                {filteredActuales.length === 0 ? (
                  <div style={{
                    backgroundColor: '#131e3a',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13.5px'
                  }}>
                    {searchQuery.trim()
                      ? 'No hay prácticas actuales que coincidan con la búsqueda.'
                      : (isEstudiante
                          ? 'No tienes prácticas vigentes para este período académico.'
                          : 'No hay ofertas de práctica vigentes para este período académico.')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredActuales.map((o) => renderPracticaCard(o, true))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* SECCIÓN 2: PRÁCTICAS ANTIGUAS / HISTÓRICAS */}
            {/* ============================================================ */}
            {(tabFiltro === 'TODAS' || tabFiltro === 'ANTIGUAS') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      <Clock size={14} color="#94a3b8" />
                      Prácticas Antiguas (Histórico)
                    </span>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Semestres y Años Anteriores
                    </span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                    {filteredAntiguas.length} práctica(s) histórica(s)
                  </span>
                </div>

                {filteredAntiguas.length === 0 ? (
                  <div style={{
                    backgroundColor: '#131e3a',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13.5px'
                  }}>
                    {searchQuery.trim()
                      ? 'No hay prácticas antiguas que coincidan con la búsqueda.'
                      : (isEstudiante
                          ? 'No registras prácticas finalizadas de períodos anteriores.'
                          : 'No se registran prácticas finalizadas de períodos anteriores.')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredAntiguas.map((o) => renderPracticaCard(o, false))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default ProfesorOfertasPage

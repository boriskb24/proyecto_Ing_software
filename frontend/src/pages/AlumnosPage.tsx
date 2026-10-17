import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getEstudiantesDirectorio, EstudianteDirectorioDto } from '../services/api'
import {
  ArrowLeft,
  Users,
  Search,
  ChevronRight,
  GraduationCap,
  Briefcase,
  UserCheck,
  Mail,
  Calendar,
  Sparkles,
  Clock,
  AlertCircle,
  BookOpen
} from 'lucide-react'

export const AlumnosPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState<EstudianteDirectorioDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'EN_CURSO' | 'FINALIZADA' | 'SIN_PRACTICA'>('TODOS')

  const isProfesor = !!user?.role && (
    user.role.toLowerCase().includes('profesor') ||
    user.role.toLowerCase().includes('administrador') ||
    user.role.toLowerCase().includes('evaluador')
  )

  useEffect(() => {
    if (!user) return
    if (!isProfesor) {
      navigate('/dashboard', { replace: true })
      return
    }

    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getEstudiantesDirectorio(user.email)
        setAlumnos(data || [])
      } catch (e: any) {
        setError(e.response?.data?.message || e.message || 'Error al cargar el directorio de alumnos')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user, isProfesor, navigate])

  // Contadores para métricas
  const { totalEnCurso, totalFinalizada, totalSinPractica } = useMemo(() => {
    let enCurso = 0
    let finalizada = 0
    let sinPractica = 0

    alumnos.forEach((a) => {
      if (a.estado === 'En curso') enCurso++
      else if (a.estado === 'Finalizada') finalizada++
      else sinPractica++
    })

    return { totalEnCurso: enCurso, totalFinalizada: finalizada, totalSinPractica: sinPractica }
  }, [alumnos])

  // Filtrado reactivo
  const filteredAlumnos = useMemo(() => {
    return alumnos.filter((a) => {
      // Filtro por tab de estado
      if (filtroEstado === 'EN_CURSO' && a.estado !== 'En curso') return false
      if (filtroEstado === 'FINALIZADA' && a.estado !== 'Finalizada') return false
      if (filtroEstado === 'SIN_PRACTICA' && a.estado !== 'Sin práctica') return false

      // Filtro por texto
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true

      return (
        a.nombreCompleto.toLowerCase().includes(q) ||
        a.rut.toLowerCase().includes(q) ||
        a.correo.toLowerCase().includes(q) ||
        (a.practicaActual && a.practicaActual.toLowerCase().includes(q)) ||
        (a.codigoPractica && a.codigoPractica.toLowerCase().includes(q))
      )
    })
  }, [alumnos, filtroEstado, searchQuery])

  const getInitials = (name?: string) => {
    if (!name) return 'AL'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleAlumnoClick = (a: EstudianteDirectorioDto) => {
    if (a.ultimaInscripcionId) {
      navigate(`/practicas/inscripciones/${a.ultimaInscripcionId}`)
    } else {
      // Si no tiene inscripción aún, notificamos o dirigimos
      alert(`El estudiante ${a.nombreCompleto} aún no cuenta con una práctica asignada.`)
    }
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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                <Users size={16} />
                <span>Historial de Alumnos</span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>
                Mis <span style={{ color: '#d4af37' }}>Alumnos</span>
              </h1>
              <p style={{ fontSize: '14.5px', color: '#94a3b8', margin: 0, maxWidth: '650px' }}>
                Listado histórico de estudiantes que han cursado o están cursando una práctica con usted. Puedes buscar a cualquier alumno para acceder a su ficha académica y documentos.
              </p>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              padding: '10px 16px',
              borderRadius: '12px',
              color: '#93c5fd',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              <Users size={18} />
              <span>{alumnos.length} Alumnos Históricos</span>
            </div>
          </div>

          {/* Métricas Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Alumnos</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{alumnos.length}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ fontSize: '12px', color: '#86efac', textTransform: 'uppercase' }}>En Curso</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#4ade80', marginTop: '4px' }}>{totalEnCurso}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Históricas / Finalizadas</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#cbd5e1', marginTop: '4px' }}>{totalFinalizada}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '12px', color: '#fcd34d', textTransform: 'uppercase' }}>Sin Práctica</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>{totalSinPractica}</div>
            </div>
          </div>
        </div>

        {/* Buscador y Tabs de Filtro */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#131e3a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 16px',
            flex: '1 1 340px',
          }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nombre, RUT, Correo o Asignatura..."
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

          {/* Selector de Tabs */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#131e3a', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => setFiltroEstado('TODOS')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: filtroEstado === 'TODOS' ? '#2563eb' : 'transparent',
                color: filtroEstado === 'TODOS' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Todos ({alumnos.length})
            </button>
            <button
              onClick={() => setFiltroEstado('EN_CURSO')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: filtroEstado === 'EN_CURSO' ? '#2563eb' : 'transparent',
                color: filtroEstado === 'EN_CURSO' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              En Curso ({totalEnCurso})
            </button>
            <button
              onClick={() => setFiltroEstado('FINALIZADA')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: filtroEstado === 'FINALIZADA' ? '#2563eb' : 'transparent',
                color: filtroEstado === 'FINALIZADA' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Finalizada ({totalFinalizada})
            </button>
          </div>
        </div>

        {/* Estado de Carga / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <p>Cargando alumnos registrados...</p>
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

        {/* Lista de Alumnos */}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredAlumnos.length === 0 ? (
              <div style={{
                backgroundColor: '#131e3a',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '36px',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                {searchQuery.trim()
                  ? 'No se encontraron alumnos que coincidan con la búsqueda.'
                  : 'No hay estudiantes registrados para el filtro seleccionado.'}
              </div>
            ) : (
              filteredAlumnos.map((a) => {
                const initials = getInitials(a.nombreCompleto)
                const isEnCurso = a.estado === 'En curso'

                return (
                  <div
                    key={a.rut}
                    onClick={() => handleAlumnoClick(a)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleAlumnoClick(a)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: '#131e3a',
                      border: isEnCurso ? '1.5px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '18px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#182649'
                      e.currentTarget.style.borderColor = '#2563eb'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#131e3a'
                      e.currentTarget.style.borderColor = isEnCurso ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    title={`Ver ficha completa de ${a.nombreCompleto}`}
                  >
                    {/* Datos del estudiante */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(37, 99, 235, 0.2)',
                        border: '1.5px solid rgba(37, 99, 235, 0.4)',
                        color: '#93c5fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '15px',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>

                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15.5px', color: '#ffffff', marginBottom: '3px' }}>
                          {a.nombreCompleto}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', color: '#94a3b8', fontSize: '12.5px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={13} color="#60a5fa" />
                            RUT: <strong style={{ color: '#e2e8f0' }}>{a.rut}</strong>
                          </span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={13} color="#94a3b8" />
                            <span>{a.correo}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Práctica Asignada */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 240px' }}>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Práctica Asignada
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={15} color="#d4af37" />
                        <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#ffffff' }}>
                          {a.practicaActual || 'Sin práctica'}
                        </span>
                        {a.codigoPractica && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                            {a.codigoPractica}
                          </span>
                        )}
                      </div>
                      {a.anio && (
                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                          Año {a.anio} • {a.periodo === 1 ? 'Primer Semestre' : 'Segundo Semestre'}
                        </div>
                      )}
                    </div>

                    {/* Estado e Interacción */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: isEnCurso ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: isEnCurso ? '#4ade80' : '#cbd5e1',
                        border: `1px solid ${isEnCurso ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.12)'}`
                      }}>
                        {isEnCurso && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />}
                        {a.estado}
                      </span>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#60a5fa'
                      }}>
                        Ver Ficha
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default AlumnosPage


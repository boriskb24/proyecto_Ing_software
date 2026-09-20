import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getInscripcionesForProfesor, getInscripcionesForOferta, getOfertaById, InscripcionDto, OfertaDto } from '../services/api'
import { 
  ArrowLeft, 
  Users, 
  Search, 
  ChevronRight, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  UserCheck,
  BookOpen
} from 'lucide-react'

export const ProfesorInformesPage: React.FC = () => {
  const { user } = useAuth()
  const params = useParams()
  const navigate = useNavigate()
  
  // Soporta :id (nueva ruta /practicas/:id) y :ofertaId (compatibilidad)
  const ofertaIdParam = params.id || params.ofertaId

  const [inscripciones, setInscripciones] = useState<InscripcionDto[]>([])
  const [ofertaInfo, setOfertaInfo] = useState<(OfertaDto & { inscritosCount: number }) | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState<string>('')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user) throw new Error('Usuario no autenticado')
        
        if (ofertaIdParam) {
          const id = Number(ofertaIdParam)
          const [inscripcionesData, ofertaData] = await Promise.all([
            getInscripcionesForOferta(id),
            getOfertaById(id).catch(() => null)
          ])
          setInscripciones(inscripcionesData)
          if (ofertaData) {
            setOfertaInfo(ofertaData)
          }
        } else {
          const data = await getInscripcionesForProfesor(user.email)
          setInscripciones(data)
        }
      } catch (e: any) {
        setError(e.response?.data?.message || e.message || 'Error al obtener la lista de estudiantes')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user, ofertaIdParam])

  const filteredInscripciones = inscripciones.filter((i) => {
    const q = filterQuery.toLowerCase().trim()
    if (!q) return true
    return (
      i.nombreCompleto.toLowerCase().includes(q) ||
      i.estudianteRut.toLowerCase().includes(q) ||
      i.correo.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 20px 60px' }}>
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
          <ArrowLeft size={16} /> Volver a Mis Prácticas
        </button>

        {/* Encabezado Principal */}
        <div style={{
          backgroundColor: '#131e3a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                <Briefcase size={16} />
                <span>Oferta de Práctica</span>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>
                {ofertaInfo ? ofertaInfo.asignaturaNombre : 'Listado de Estudiantes'}
              </h1>
              {ofertaInfo && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', color: '#94a3b8', fontSize: '13.5px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={15} color="#d4af37" />
                    Código: <strong style={{ color: '#e2e8f0' }}>{ofertaInfo.asignaturaCodigo}</strong>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="#94a3b8" />
                    Año <strong>{ofertaInfo.anio}</strong> • Período <strong>{ofertaInfo.periodo}</strong>
                  </span>
                </div>
              )}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              padding: '8px 14px',
              borderRadius: '10px',
              color: '#93c5fd',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              <Users size={18} />
              <span>{inscripciones.length} {inscripciones.length === 1 ? 'estudiante inscrito' : 'estudiantes inscritos'}</span>
            </div>
          </div>
        </div>

        {/* Buscador de Alumnos */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#131e3a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
        }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar alumnos por nombre, RUT o correo..."
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

        {/* Mensajes de Carga / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <p>Cargando información de estudiantes...</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredInscripciones.length === 0 ? (
              <div style={{
                backgroundColor: '#131e3a',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '36px',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                {filterQuery.trim()
                  ? 'No se encontraron alumnos que coincidan con la búsqueda.'
                  : 'No hay estudiantes inscritos en esta práctica actualmente.'}
              </div>
            ) : (
              filteredInscripciones.map((i) => {
                const initials = i.nombreCompleto
                  ? i.nombreCompleto
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'AL'

                return (
                  <div
                    key={i.inscripcionId}
                    onClick={() => navigate(`/practicas/inscripciones/${i.inscripcionId}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/practicas/inscripciones/${i.inscripcionId}`)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: '#131e3a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#182649'
                      e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.4)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#131e3a'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    title={`Ver perfil y prácticas de ${i.nombreCompleto}`}
                  >
                    {/* Datos del estudiante */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(37, 99, 235, 0.2)',
                        border: '1px solid rgba(37, 99, 235, 0.4)',
                        color: '#93c5fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '15px',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>

                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#ffffff', marginBottom: '3px' }}>
                          {i.nombreCompleto}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '12.5px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={13} color="#60a5fa" />
                            RUT: <strong style={{ color: '#cbd5e1' }}>{i.estudianteRut}</strong>
                          </span>
                          <span>•</span>
                          <span>{i.correo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Indicador de Acción interactivo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#60a5fa',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        Ver ficha del alumno
                        <ChevronRight size={18} />
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

export default ProfesorInformesPage

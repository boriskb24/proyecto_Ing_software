import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getOfertasForProfesor, OfertaDto } from '../services/api'
import {
  Search,
  FileText,
  Clock,
  Briefcase,
  Users,
  ChevronRight,
  MoreVertical,
  X,
  Bot,
  MessageCircle,
  CheckCircle,
  GraduationCap
} from 'lucide-react'

const practiceStudents = [
  { name: 'Mariana Tapia', id: '2021-4521', avatar: 'MT', avatarClass: 'avatar-blue', status: 'Convenio Pendiente de Firma', statusClass: 'status-pending', professor: 'Prof. Tapia' },
  { name: 'Marco Valantaz', id: '2020-3312', avatar: 'MV', avatarClass: 'avatar-gold', status: 'Convenio Aprobado', statusClass: 'status-approved', professor: 'Prof. Muñoz' },
  { name: 'Carolina Riquelme', id: '2021-5589', avatar: 'CR', avatarClass: 'avatar-teal', status: 'En Revisión Académica', statusClass: 'status-review', professor: 'Prof. Tapia' },
  { name: 'Felipe Contreras', id: '2020-4103', avatar: 'FC', avatarClass: 'avatar-purple', status: 'Convenio Pendiente de Firma', statusClass: 'status-pending', professor: 'Prof. Tapia' },
  { name: 'Daniela Muñoz', id: '2021-6672', avatar: 'DM', avatarClass: 'avatar-blue', status: 'Convenio Aprobado', statusClass: 'status-approved', professor: 'Prof. Muñoz' },
]


export const HomePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Prácticas / Ofertas para Docente y Administrador
  const [ofertas, setOfertas] = useState<OfertaDto[]>([])
  const [isLoadingOfertas, setIsLoadingOfertas] = useState<boolean>(false)
  const [errorOfertas, setErrorOfertas] = useState<string | null>(null)

  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Usuario')
  const isDocenteOrAdmin = user?.role === 'Administrador' || user?.role === 'Profesor' || user?.role === 'Evaluador'

  useEffect(() => {
    if (user?.email && isDocenteOrAdmin) {
      setIsLoadingOfertas(true)
      setErrorOfertas(null)
      getOfertasForProfesor(user.email)
        .then((data) => {
          setOfertas(data || [])
          setIsLoadingOfertas(false)
        })
        .catch((err) => {
          console.error('Error al obtener prácticas del profesor:', err)
          setErrorOfertas(err.message || 'Error al obtener prácticas')
          setIsLoadingOfertas(false)
        })
    }
  }, [user, isDocenteOrAdmin])

  // Métricas dinámicas para Docente
  const totalOfertas = ofertas.length
  const totalInscritosDocente = ofertas.reduce((acc, o) => acc + (o.inscritosCount || 0), 0)

  const filteredOfertas = ofertas.filter(o => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (o.asignaturaNombre && o.asignaturaNombre.toLowerCase().includes(q)) ||
      (o.asignaturaCodigo && o.asignaturaCodigo.toLowerCase().includes(q)) ||
      String(o.anio).includes(q) ||
      `periodo ${o.periodo}`.includes(q) ||
      `semestre ${o.periodo}`.includes(q)
    )
  })

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />

      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <p style={styles.heroGreeting}>Bienvenido de vuelta, {displayName}</p>
          <h1 style={styles.heroTitle}>
            UBB <span style={styles.goldAccent}>DocHUB</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Gestión de documentos de práctica
          </p>
        </section>

        {/* Search Bar */}
        <div style={styles.searchWrapper}>
          <div style={styles.searchBar}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar documentos por nombre, tipo, profesor o código..."
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.quickAccess}>
          {isDocenteOrAdmin ? (
            <>
              <button 
                onClick={() => navigate('/practicas')}
                style={{ ...styles.quickCard, ...styles.quickCardBlue }}
              >
                <Briefcase size={22} />
                <div style={styles.quickCardTitle}>Mis Prácticas</div>
                <div style={styles.quickCardDesc}>Ver todas las ofertas</div>
              </button>
              <button 
                onClick={() => navigate('/alumnos')}
                style={{ ...styles.quickCard, ...styles.quickCardGold }}
              >
                <Users size={22} />
                <div style={styles.quickCardTitle}>Directorio de Alumnos</div>
                <div style={styles.quickCardDesc}>Estudiantes históricos</div>
              </button>
              <a 
                href="#documentos"
                style={{ ...styles.quickCard, ...styles.quickCardTeal, textDecoration: 'none' }}
              >
                <Clock size={22} />
                <div style={styles.quickCardTitle}>Documentos Recientes</div>
                <div style={styles.quickCardDesc}>Última actividad</div>
              </a>
            </>
          ) : (
            <>
              <a 
                href="#practicas"
                style={{ ...styles.quickCard, ...styles.quickCardBlue, textDecoration: 'none' }}
              >
                <Briefcase size={22} />
                <div style={styles.quickCardTitle}>Prácticas</div>
                <div style={styles.quickCardDesc}>Prácticas en curso</div>
              </a>
              <a 
                href="#documentos"
                style={{ ...styles.quickCard, ...styles.quickCardGold, textDecoration: 'none' }}
              >
                <FileText size={22} />
                <div style={styles.quickCardTitle}>Documentos</div>
                <div style={styles.quickCardDesc}>Syllabus y convenios</div>
              </a>
              <a 
                href="#documentos"
                style={{ ...styles.quickCard, ...styles.quickCardTeal, textDecoration: 'none' }}
              >
                <Clock size={22} />
                <div style={styles.quickCardTitle}>Documentos Recientes</div>
                <div style={styles.quickCardDesc}>Última actividad</div>
              </a>
            </>
          )}
        </div>

        {/* Dashboard Grid */}
        <div style={styles.dashboardGrid}>
          {/* Main Column */}
          <div style={styles.dashboardMain}>
            {isDocenteOrAdmin ? (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Mis Prácticas</h2>
                    <p style={styles.cardSubtitle}>Prácticas profesionales ofrecidas y secciones asignadas</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={styles.badgeBlue}>
                      {filteredOfertas.length} {filteredOfertas.length === 1 ? 'práctica' : 'prácticas'}
                    </span>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  {isLoadingOfertas ? (
                    <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      Cargando prácticas asignadas...
                    </div>
                  ) : errorOfertas ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#f87171', fontSize: '14px' }}>
                      {errorOfertas}
                    </div>
                  ) : filteredOfertas.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      {searchQuery.trim()
                        ? 'No se encontraron prácticas que coincidan con la búsqueda.'
                        : 'No hay ofertas de práctica asociadas a este profesor actualmente.'}
                    </div>
                  ) : (
                    <>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.trHead}>
                            <th style={styles.th}>Asignatura de Práctica</th>
                            <th style={styles.th}>Período Académico</th>
                            <th style={styles.th}>Estudiantes Inscritos</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOfertas.slice(0, 4).map((o) => (
                            <tr
                              key={o.id}
                              onClick={() => navigate(`/practicas/${o.id}`)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  navigate(`/practicas/${o.id}`)
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              style={{
                                ...styles.trBody,
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                              title={`Ver detalles de ${o.asignaturaNombre}`}
                            >
                              <td style={styles.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                                    color: '#60a5fa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Briefcase size={18} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px' }}>
                                      {o.asignaturaNombre}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                      Código: {o.asignaturaCodigo}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={styles.td}>
                                <span style={styles.badgeGold}>
                                  {o.anio} - Semestre {o.periodo}
                                </span>
                              </td>
                              <td style={styles.td}>
                                <span style={{ color: '#e2e8f0', fontWeight: '500' }}>
                                  {o.inscritosCount || 0} alumnos
                                </span>
                              </td>
                              <td style={{ ...styles.td, textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/practicas/${o.id}`)
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Entrar <ChevronRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {filteredOfertas.length > 4 && (
                        <div style={{
                          padding: '12px 20px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)'
                        }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Mostrando 4 de {filteredOfertas.length} prácticas
                          </span>
                          <button
                            onClick={() => navigate('/practicas')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#60a5fa',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Ver todas las prácticas <ChevronRight size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Gestión de Prácticas</h2>
                    <p style={styles.cardSubtitle}>Estado de documentos de prácticas estudiantiles</p>
                  </div>
                  <span style={styles.badgeBlue}>5 activos</span>
                </div>
                <div style={styles.cardBody}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.trHead}>
                        <th style={styles.th}>Estudiante</th>
                        <th style={styles.th}>Estado del Documento</th>
                        <th style={styles.th}>Profesor</th>
                        <th style={styles.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {practiceStudents
                        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.status.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((s, i) => (
                          <tr key={i} style={styles.trBody}>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={styles.studentAvatar}>{s.avatar}</div>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '13.5px' }}>{s.name}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {s.id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <span style={s.statusClass === 'status-approved' ? styles.statusApproved : styles.statusPending}>
                                {s.status}
                              </span>
                            </td>
                            <td style={{ ...styles.td, color: '#94a3b8' }}>{s.professor}</td>
                            <td style={styles.td}>
                              <button style={styles.actionBtn}><MoreVertical size={16} /></button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div style={styles.dashboardSidebar}>
            {isDocenteOrAdmin ? (
              <>
                {/* Stats Administrativas */}
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Briefcase size={18} color="#60a5fa" /></div>
                    <div style={styles.statValue}>{totalOfertas}</div>
                    <div style={styles.statLabel}>Prácticas Ofrecidas</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Users size={18} color="#22c55e" /></div>
                    <div style={styles.statValue}>{totalInscritosDocente}</div>
                    <div style={styles.statLabel}>Estudiantes Inscritos</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Clock size={18} color="#f59e0b" /></div>
                    <div style={styles.statValue}>
                      {ofertas.filter(o => o.anio === new Date().getFullYear()).length || totalOfertas}
                    </div>
                    <div style={styles.statLabel}>Prácticas Vigentes</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><FileText size={18} color="#a855f7" /></div>
                    <div style={styles.statValue}>152</div>
                    <div style={styles.statLabel}>Documentos Activos</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* General Stats */}
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><FileText size={18} color="#60a5fa" /></div>
                    <div style={styles.statValue}>152</div>
                    <div style={styles.statLabel}>Documentos Activos</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Briefcase size={18} color="#f59e0b" /></div>
                    <div style={styles.statValue}>19</div>
                    <div style={styles.statLabel}>Prácticas en Curso</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><CheckCircle size={18} color="#22c55e" /></div>
                    <div style={styles.statValue}>87</div>
                    <div style={styles.statLabel}>Convenios Firmados</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Users size={18} color="#a855f7" /></div>
                    <div style={styles.statValue}>14</div>
                    <div style={styles.statLabel}>Profesores Activos</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>



      {/* Floating Chatbot Assistant */}
      <div style={styles.chatbotWrapper}>
        {chatOpen ? (
          <div style={styles.chatbotWindow}>
            <div style={styles.chatbotHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={20} color="#60a5fa" />
                <span style={{ fontWeight: '600', fontSize: '14px' }}>Asistente UBB</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={styles.chatbotClose}><X size={16} /></button>
            </div>
            <div style={styles.chatbotMessages}>
              <div style={styles.botBubble}>
                Hola {displayName}, soy el asistente del Centro de Documentos UBB. ¿En qué te puedo ayudar hoy?
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setChatOpen(true)} style={styles.chatbotFab}>
            <MessageCircle size={24} color="#ffffff" />
          </button>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  heroSection: {
    marginBottom: '28px',
  },
  heroGreeting: {
    fontSize: '13px',
    color: '#60a5fa',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px',
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 10px 0',
  },
  goldAccent: {
    color: '#d4af37',
  },
  heroSubtitle: {
    fontSize: '15px',
    color: '#94a3b8',
    maxWidth: '650px',
  },
  searchWrapper: {
    marginBottom: '28px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#131e3a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px 18px',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '14px',
    width: '100%',
  },
  quickAccess: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  quickCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: '#131e3a',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    cursor: 'pointer',
    textAlign: 'left',
  },
  quickCardBlue: {
    borderLeft: '4px solid #1d4ed8',
  },
  quickCardGold: {
    borderLeft: '4px solid #d4af37',
  },
  quickCardTeal: {
    borderLeft: '4px solid #0d9488',
  },
  quickCardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '10px',
  },
  quickCardDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    marginBottom: '36px',
  },
  dashboardMain: {
    display: 'flex',
    flexDirection: 'column',
  },
  dashboardSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    backgroundColor: '#131e3a',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  cardBody: {
    overflowX: 'auto',
  },
  badgeBlue: {
    backgroundColor: 'rgba(29, 78, 216, 0.2)',
    color: '#60a5fa',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHead: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  trBody: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  },
  td: {
    padding: '12px 10px',
    fontSize: '13px',
  },
  studentAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '12px',
  },
  statusApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    color: '#facc15',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  statCard: {
    backgroundColor: '#131e3a',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  statIcon: {
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  recentDocItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  },
  techSection: {
    textAlign: 'center',
    padding: '24px',
    backgroundColor: '#131e3a',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  techTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '14px',
  },
  techBadges: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  techBadge: {
    backgroundColor: '#0b1329',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#60a5fa',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusReview: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '12.5px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#131e3a',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    width: '100%',
    maxWidth: '580px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
  },
  modalBody: {
    padding: '20px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '14px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0f1d38',
  },
  modalPrimaryBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  expedienteDocItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: '#0f1d38',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    backgroundColor: '#0b1329',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  chatbotWrapper: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 1000,
  },
  chatbotFab: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: '#1d4ed8',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(29, 78, 216, 0.5)',
  },
  chatbotWindow: {
    width: '320px',
    backgroundColor: '#131e3a',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
  },
  chatbotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#0f1d38',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  chatbotClose: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  chatbotMessages: {
    padding: '16px',
  },
  botBubble: {
    backgroundColor: 'rgba(29, 78, 216, 0.2)',
    color: '#f8fafc',
    fontSize: '13px',
    padding: '10px 14px',
    borderRadius: '10px',
    lineHeight: '1.4',
  },
}

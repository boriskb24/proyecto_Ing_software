import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import {
  Search,
  Upload,
  FileText,
  Clock,
  Briefcase,
  Users,
  MoreVertical,
  ChevronRight,
  ArrowUp,
  Send,
  X,
  Bot,
  MessageCircle,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react'

const practiceStudents = [
  { name: 'Mariana Tapia', id: '2021-4521', avatar: 'MT', avatarClass: 'avatar-blue', status: 'Convenio Pendiente de Firma', statusClass: 'status-pending', professor: 'Prof. Tapia' },
  { name: 'Marco Valantaz', id: '2020-3312', avatar: 'MV', avatarClass: 'avatar-gold', status: 'Convenio Aprobado', statusClass: 'status-approved', professor: 'Prof. Muñoz' },
  { name: 'Carolina Riquelme', id: '2021-5589', avatar: 'CR', avatarClass: 'avatar-teal', status: 'En Revisión Académica', statusClass: 'status-review', professor: 'Prof. Tapia' },
  { name: 'Felipe Contreras', id: '2020-4103', avatar: 'FC', avatarClass: 'avatar-purple', status: 'Convenio Pendiente de Firma', statusClass: 'status-pending', professor: 'Prof. Tapia' },
  { name: 'Daniela Muñoz', id: '2021-6672', avatar: 'DM', avatarClass: 'avatar-blue', status: 'Convenio Aprobado', statusClass: 'status-approved', professor: 'Prof. Muñoz' },
]

const recentDocuments = [
  { name: 'Syllabus Cálculo II (2024-2)', type: 'pdf', date: 'Hace 2 horas' },
  { name: 'Convenio Práctica — M. Tapia', type: 'doc', date: 'Hace 5 horas' },
  { name: 'Planilla Notas Álgebra Lineal', type: 'xls', date: 'Ayer' },
  { name: 'Informe Práctica — F. Contreras', type: 'pdf', date: 'Hace 2 días' },
]

const facultyMembers = [
  { name: 'Prof. Ricardo Tapia', area: 'Análisis Matemático', email: 'rtapia@ubiobio.cl', initials: 'RT', avatarClass: 'avatar-blue' },
  { name: 'Prof. Sandra Muñoz', area: 'Estadística Aplicada', email: 'smunoz@ubiobio.cl', initials: 'SM', avatarClass: 'avatar-gold' },
  { name: 'Prof. Carlos Henríquez', area: 'Álgebra y Geometría', email: 'chenriquez@ubiobio.cl', initials: 'CH', avatarClass: 'avatar-teal' },
]

export const HomePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Usuario')

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />

      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <p style={styles.heroGreeting}>Bienvenido de vuelta, {displayName}</p>
          <h1 style={styles.heroTitle}>
            Centro de Centralización de <span style={styles.goldAccent}>Documentos</span> (UBB)
          </h1>
          <p style={styles.heroSubtitle}>
            Gestiona syllabus, convenios de prácticas y documentación académica del departamento en tiempo real.
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
          <button 
            onClick={() => navigate('/entrega-informe')}
            style={{ ...styles.quickCard, ...styles.quickCardBlue }}
          >
            <Upload size={22} />
            <div style={styles.quickCardTitle}>Entregar Informe Final</div>
            <div style={styles.quickCardDesc}>Subir PDF de Práctica</div>
          </button>
          <button 
            onClick={() => navigate('/planificaciones')}
            style={{ ...styles.quickCard, ...styles.quickCardGold }}
          >
            <FileText size={22} />
            <div style={styles.quickCardTitle}>Planificaciones de Clase</div>
            <div style={styles.quickCardDesc}>Subir y gestionar archivos</div>
          </button>
          <button style={{ ...styles.quickCard, ...styles.quickCardTeal }}>
            <Clock size={22} />
            <div style={styles.quickCardTitle}>Documentos Recientes</div>
            <div style={styles.quickCardDesc}>Última actividad</div>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div style={styles.dashboardGrid}>
          {/* Main Column */}
          <div style={styles.dashboardMain}>
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
          </div>

          {/* Sidebar Column */}
          <div style={styles.dashboardSidebar}>
            {/* Stats */}
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

            {/* Recent Docs */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Documentos Recientes</h3>
              </div>
              <div style={styles.cardBody}>
                {recentDocuments.map((doc, i) => (
                  <div key={i} style={styles.recentDocItem}>
                    <FileText size={18} color="#60a5fa" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#f8fafc' }}>{doc.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{doc.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Banner */}
        <section style={styles.techSection}>
          <div style={styles.techTitle}>⚡ Arquitectura Migrada con Éxito</div>
          <div style={styles.techBadges}>
            <span style={styles.techBadge}>Java 17 (Spring Boot 3)</span>
            <span style={styles.techBadge}>Spring Data JPA</span>
            <span style={styles.techBadge}>React 19 SPA (Vite)</span>
            <span style={styles.techBadge}>MySQL Database</span>
            <span style={styles.techBadge}>REST API</span>
          </div>
        </section>
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

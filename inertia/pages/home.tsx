import { useState } from 'react'

/* ─── SVG Icon Components ─── */
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconFileText() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><line x1="10" y1="9" x2="10" y2="9" /><line x1="10" y1="13" x2="10" y2="13" /><line x1="10" y1="17" x2="10" y2="17" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconDocs() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  )
}



function IconMoreVertical() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function IconArrowUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

function IconBot() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
  )
}

function IconMessageCircle() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  )
}

function IconFilePdf() {
  return <span style={{ fontSize: '18px' }}>📄</span>
}

function IconFileDoc() {
  return <span style={{ fontSize: '18px' }}>📝</span>
}

function IconFileXls() {
  return <span style={{ fontSize: '18px' }}>📊</span>
}

/* ─── Data ─── */
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

import Navbar from '~/components/navbar'

/* ─── Main Component ─── */
export default function Home() {
  const [chatOpen, setChatOpen] = useState(true)

  return (
    <>
      {/* ────── Navbar Dinámico con Auth ────── */}
      <Navbar />

      {/* ────── Page Content ────── */}
      <div className="page-container">

        {/* Hero */}
        <section className="hero-section animate-in">
          <p className="hero-greeting">Bienvenido de vuelta</p>
          <h1 className="hero-title">
            Centro de Centralización de <span className="gold-accent">Documentos</span> (UBB)
          </h1>
          <p className="hero-subtitle">Gestiona syllabus, convenios de prácticas y documentación académica del departamento.</p>
        </section>

        {/* Search */}
        <div className="search-wrapper animate-in animate-delay-1">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar documentos por nombre, tipo, profesor o código..."
              id="search-input"
            />
            <span className="search-icon"><IconSearch /></span>
            <span className="search-shortcut"><kbd>Ctrl</kbd><kbd>K</kbd></span>
          </div>
        </div>

        {/* Quick Access */}
        <div className="quick-access animate-in animate-delay-2">
          <button className="quick-card quick-card-blue" id="btn-upload-syllabus">
            <div className="quick-card-icon"><IconUpload /></div>
            <div className="quick-card-title">Subir Syllabus</div>
            <div className="quick-card-desc">Semestre 2024-2</div>
          </button>
          <button className="quick-card quick-card-gold" id="btn-new-convenio">
            <div className="quick-card-icon"><IconFileText /></div>
            <div className="quick-card-title">Nuevo Convenio</div>
            <div className="quick-card-desc">Convenio de Prácticas</div>
          </button>
          <button className="quick-card quick-card-teal" id="btn-recent-docs">
            <div className="quick-card-icon"><IconClock /></div>
            <div className="quick-card-title">Documentos Recientes</div>
            <div className="quick-card-desc">Última actividad</div>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid" style={{ marginTop: 24 }}>

          {/* Main Column */}
          <div className="dashboard-main">

            {/* Practices Table */}
            <div className="card animate-in animate-delay-3">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Gestión de Prácticas</h2>
                  <p className="card-subtitle">Estado de documentos de prácticas estudiantiles</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select className="filter-select" id="filter-semester" defaultValue="all">
                    <option value="all">Todos los Semestres</option>
                    <option value="2024-2">2024-2</option>
                    <option value="2024-1">2024-1</option>
                  </select>
                  <span className="card-badge card-badge-blue">5 activos</span>
                </div>
              </div>
              <div className="card-body">
                <table className="practices-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Estado del Documento</th>
                      <th>Profesor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {practiceStudents.map((s, i) => (
                      <tr key={i}>
                        <td>
                          <div className="student-cell">
                            <div className={`student-avatar ${s.avatarClass}`}>{s.avatar}</div>
                            <div>
                              <div className="student-name">{s.name}</div>
                              <div className="student-id">ID: {s.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${s.statusClass}`}>
                            <span className="status-dot" />
                            {s.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>{s.professor}</td>
                        <td>
                          <button className="action-btn" aria-label="Más opciones"><IconMoreVertical /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">

            {/* Stats */}
            <div className="stat-grid animate-in animate-delay-3">
              <div className="stat-card">
                <div className="stat-icon stat-icon-blue"><IconDocs /></div>
                <div className="stat-value">152</div>
                <div className="stat-label">Documentos Activos</div>
                <div className="stat-trend stat-trend-up"><IconArrowUp /> +12%</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-gold"><IconBriefcase /></div>
                <div className="stat-value">19</div>
                <div className="stat-label">Prácticas en Curso</div>
                <div className="stat-trend stat-trend-up"><IconArrowUp /> +3</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-green"><IconCheckCircle /></div>
                <div className="stat-value">87</div>
                <div className="stat-label">Convenios Firmados</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-purple"><IconUsers /></div>
                <div className="stat-value">14</div>
                <div className="stat-label">Profesores Activos</div>
              </div>
            </div>

            {/* Recent Docs */}
            <div className="card animate-in animate-delay-4">
              <div className="card-header">
                <h3 className="card-title">Mis Documentos Recientes</h3>
                <button className="view-all">Ver todos <IconChevronRight /></button>
              </div>
              <div className="card-body">
                {recentDocuments.map((doc, i) => (
                  <div className="recent-doc" key={i}>
                    <div className={`doc-icon doc-icon-${doc.type}`}>
                      {doc.type === 'pdf' ? <IconFilePdf /> : doc.type === 'doc' ? <IconFileDoc /> : <IconFileXls />}
                    </div>
                    <div className="doc-info">
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-meta">.{doc.type.toUpperCase()}</div>
                    </div>
                    <span className="doc-time">{doc.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty */}
            <div className="card animate-in animate-delay-5">
              <div className="card-header">
                <h3 className="card-title">Directorio de Profesores</h3>
                <span className="card-badge card-badge-gold">Matemáticas</span>
              </div>
              <div className="card-body">
                {facultyMembers.map((f, i) => (
                  <div className="faculty-item" key={i}>
                    <div className={`faculty-avatar ${f.avatarClass}`}>{f.initials}</div>
                    <div className="faculty-info">
                      <div className="faculty-name">{f.name}</div>
                      <div className="faculty-area">{f.area}</div>
                      <a className="faculty-email" href={`mailto:${f.email}`}>{f.email}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ────── Tech Stack ────── */}
        <section className="tech-section animate-in animate-delay-5">
          <div className="tech-section-title">
            <span>⚡ Arquitectura del Sistema — Powered by</span>
          </div>
          <div className="tech-badges">
            <span className="tech-badge">
              <span className="tech-badge-icon tech-adonis">A</span>
              AdonisJS
            </span>
            <span className="tech-badge">
              <span className="tech-badge-icon tech-inertia">I</span>
              Inertia.js
            </span>
            <span className="tech-badge">
              <span className="tech-badge-icon tech-react">R</span>
              React
            </span>
            <span className="tech-badge">
              <span className="tech-badge-icon tech-typescript">TS</span>
              TypeScript
            </span>
            <span className="tech-badge">
              <span className="tech-badge-icon tech-vite">V</span>
              Vite
            </span>
          </div>
        </section>
      </div>

      {/* ────── Footer ────── */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-text">© 2024 Universidad del Bío-Bío — Depto. de Matemáticas. Todos los derechos reservados.</span>
          <div className="footer-links">
            <a href="#">Política de Privacidad</a>
            <a href="#">Términos de Uso</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </footer>

      {/* ────── Chatbot ────── */}
      <div className="chatbot-wrapper">
        {chatOpen ? (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-avatar"><IconBot /></div>
                <div>
                  <div className="chatbot-title">DOC-HUB Asistente</div>
                  <div className="chatbot-status">
                    <span className="chatbot-status-dot" />
                    En línea
                  </div>
                </div>
              </div>
              <button className="chatbot-close" onClick={() => setChatOpen(false)} aria-label="Cerrar chat">
                <IconX />
              </button>
            </div>
            <div className="chatbot-messages">
              <div className="chat-message chat-message-bot">
                <div className="chat-bubble-avatar chat-bubble-avatar-bot"><IconBot /></div>
                <div className="chat-bubble chat-bubble-bot">
                  Bienvenido, Prof. Muñoz. ¿En qué puedo ayudarle con sus documentos hoy?
                </div>
              </div>
              <div className="chat-message chat-message-user" style={{ animationDelay: '0.2s' }}>
                <div className="chat-bubble-avatar chat-bubble-avatar-user">SM</div>
                <div className="chat-bubble chat-bubble-user">
                  Necesito ver el estado del convenio de Mariana Tapia.
                </div>
              </div>
              <div className="chat-message chat-message-bot" style={{ animationDelay: '0.4s' }}>
                <div className="chat-bubble-avatar chat-bubble-avatar-bot"><IconBot /></div>
                <div className="chat-bubble chat-bubble-bot">
                  El convenio de Mariana Tapia (ID: 2021-4521) está en estado <strong>«Pendiente de Firma»</strong>. ¿Desea que le envíe un recordatorio?
                </div>
              </div>
              <div className="chat-typing" style={{ animationDelay: '0.6s' }}>
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            </div>
            <div className="chatbot-input">
              <input type="text" placeholder="Escriba su consulta aquí..." readOnly />
              <button className="chatbot-send" aria-label="Enviar"><IconSend /></button>
            </div>
          </div>
        ) : (
          <button className="chatbot-fab" onClick={() => setChatOpen(true)} aria-label="Abrir asistente">
            <IconMessageCircle />
            <span className="chatbot-fab-badge">1</span>
          </button>
        )}
      </div>
    </>
  )
}

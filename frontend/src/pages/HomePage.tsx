import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getPlanificaciones, Planificacion } from '../services/api'
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
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  GraduationCap,
  CheckSquare,
  Plus,
  Check,
  Edit3,
  Filter,
  UserPlus,
  FolderOpen,
  Trash2,
  Building
} from 'lucide-react'

export interface PracticeStudent {
  id: string
  name: string
  email?: string
  avatar: string
  avatarClass: string
  status: string
  statusClass: 'status-pending' | 'status-approved' | 'status-review'
  professor: string
  supervisor?: string
  hoursCompleted?: number
  totalHours?: number
  planificacionesCount?: number
}

const INITIAL_PRACTICE_STUDENTS: PracticeStudent[] = [
  { name: 'Mariana Tapia', id: '2021-4521', email: 'mtapia@alumnos.ubiobio.cl', avatar: 'MT', avatarClass: 'avatar-blue', status: 'Convenio Pendiente de Firma', statusClass: 'status-pending', professor: 'Prof. Ricardo Tapia', supervisor: 'Ing. Carlos Mendoza', hoursCompleted: 360, totalHours: 360, planificacionesCount: 2 },
  { name: 'Marco Valantaz', id: '2020-3312', email: 'mvalantaz@alumnos.ubiobio.cl', avatar: 'MV', avatarClass: 'avatar-gold', status: 'Convenio Aprobado', statusClass: 'status-approved', professor: 'Prof. Sandra Muñoz', supervisor: 'Ing. Elena Gómez', hoursCompleted: 360, totalHours: 360, planificacionesCount: 4 },
  { name: 'Carolina Riquelme', id: '2021-5589', email: 'criquelme@alumnos.ubiobio.cl', avatar: 'CR', avatarClass: 'avatar-teal', status: 'En Revisión Académica', statusClass: 'status-review', professor: 'Prof. Ricardo Tapia', supervisor: 'Ing. Roberto Silva', hoursCompleted: 180, totalHours: 360, planificacionesCount: 1 },
  { name: 'Felipe Contreras', id: '2020-4103', email: 'fcontreras@alumnos.ubiobio.cl', avatar: 'FC', avatarClass: 'avatar-purple', status: 'Convenio Pendiente de Firma', statusClass: 'status-pending', professor: 'Prof. Juan Pérez', supervisor: 'Ing. Carlos Mendoza', hoursCompleted: 360, totalHours: 360, planificacionesCount: 3 },
  { name: 'Daniela Muñoz', id: '2021-6672', email: 'dmunoz@alumnos.ubiobio.cl', avatar: 'DM', avatarClass: 'avatar-blue', status: 'Convenio Aprobado', statusClass: 'status-approved', professor: 'Prof. Sandra Muñoz', supervisor: 'Ing. Elena Gómez', hoursCompleted: 360, totalHours: 360, planificacionesCount: 3 },
  { name: 'Matías González (Estudiante)', id: '2021-9988', email: 'estudiante@alumnos.ubiobio.cl', avatar: 'MG', avatarClass: 'avatar-gold', status: 'Convenio Aprobado', statusClass: 'status-approved', professor: 'Prof. Juan Pérez', supervisor: 'Ing. Carlos Mendoza', hoursCompleted: 360, totalHours: 360, planificacionesCount: 2 },
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
  const [userPlanificaciones, setUserPlanificaciones] = useState<Planificacion[]>([])
  const [informeEntregado, setInformeEntregado] = useState<{ nombreArchivo: string; fechaEntrega?: string } | null>(null)
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true)

  const [studentsList, setStudentsList] = useState<PracticeStudent[]>(() => {
    const saved = localStorage.getItem('ubb_practice_students_list')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return INITIAL_PRACTICE_STUDENTS
  })
  const [activeTab, setActiveTab] = useState<'TODOS' | 'PENDIENTE' | 'APROBADO' | 'REVISION'>('TODOS')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [selectedStudentForExpediente, setSelectedStudentForExpediente] = useState<PracticeStudent | null>(null)
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Formulario de nuevo estudiante
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentID, setNewStudentID] = useState('')
  const [newStudentEmail, setNewStudentEmail] = useState('')
  const [newStudentProf, setNewStudentProf] = useState('Prof. Juan Pérez')
  const [newStudentStatus, setNewStudentStatus] = useState('Convenio Pendiente de Firma')

  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Usuario')
  const isDocenteOrAdmin = user?.role === 'Administrador' || user?.role === 'Profesor' || user?.role === 'Evaluador'
  const isAdmin = user?.role === 'Administrador'

  const showFeedback = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const updateStudentStatus = (studentId: string, newStatus: string, newStatusClass: 'status-pending' | 'status-approved' | 'status-review') => {
    const updated = studentsList.map(s => s.id === studentId ? { ...s, status: newStatus, statusClass: newStatusClass } : s)
    setStudentsList(updated)
    localStorage.setItem('ubb_practice_students_list', JSON.stringify(updated))
    setActiveMenuId(null)
    showFeedback(`Estado de convenio actualizado a: "${newStatus}"`)
  }

  const updateStudentProfessor = (studentId: string, newProf: string) => {
    const updated = studentsList.map(s => s.id === studentId ? { ...s, professor: newProf } : s)
    setStudentsList(updated)
    localStorage.setItem('ubb_practice_students_list', JSON.stringify(updated))
    setActiveMenuId(null)
    showFeedback(`Profesor guía reasignado a: "${newProf}"`)
  }

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar a este estudiante del listado de prácticas?')) {
      const updated = studentsList.filter(s => s.id !== studentId)
      setStudentsList(updated)
      localStorage.setItem('ubb_practice_students_list', JSON.stringify(updated))
      setActiveMenuId(null)
      showFeedback('Estudiante eliminado del registro de prácticas.')
    }
  }

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentName.trim() || !newStudentID.trim()) return

    const clean = newStudentName.replace(/^(prof\.?|dr\.?|ing\.?)\s+/i, '').trim()
    const initials = clean.split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase()
    const statusClass: 'status-pending' | 'status-approved' | 'status-review' = 
      newStudentStatus.includes('Aprobado') ? 'status-approved' : 
      newStudentStatus.includes('Revisión') ? 'status-review' : 'status-pending'

    const newStudent: PracticeStudent = {
      id: newStudentID,
      name: newStudentName,
      email: newStudentEmail || `${newStudentID.toLowerCase()}@alumnos.ubiobio.cl`,
      avatar: initials || 'ST',
      avatarClass: 'avatar-blue',
      status: newStudentStatus,
      statusClass,
      professor: newStudentProf,
      supervisor: 'Ing. Carlos Mendoza',
      hoursCompleted: 360,
      totalHours: 360,
      planificacionesCount: 0
    }

    const updated = [newStudent, ...studentsList]
    setStudentsList(updated)
    localStorage.setItem('ubb_practice_students_list', JSON.stringify(updated))
    setIsNewStudentModalOpen(false)
    setNewStudentName('')
    setNewStudentID('')
    setNewStudentEmail('')
    showFeedback(`Estudiante "${newStudentName}" inscrito exitosamente en el módulo de prácticas.`)
  }

  const filteredStudents = studentsList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.status.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (activeTab === 'PENDIENTE') return s.statusClass === 'status-pending'
    if (activeTab === 'APROBADO') return s.statusClass === 'status-approved'
    if (activeTab === 'REVISION') return s.statusClass === 'status-review'
    return true
  })

  useEffect(() => {
    if (user?.id) {
      setIsLoadingData(true)
      // Cargar planificaciones reales sincronizadas desde el backend
      getPlanificaciones(user.id, user.role)
        .then((data) => {
          setUserPlanificaciones(data || [])
        })
        .catch(() => {
          setUserPlanificaciones([])
        })
        .finally(() => {
          setIsLoadingData(false)
        })

      // Verificar entrega real de informe final
      const storedInforme = localStorage.getItem(`ubb_informe_entrega_${user.id}`)
      if (storedInforme) {
        try {
          setInformeEntregado(JSON.parse(storedInforme))
        } catch {
          setInformeEntregado(null)
        }
      }
    }
  }, [user])

  const totalPlanificaciones = userPlanificaciones.length
  const planificacionesAprobadas = userPlanificaciones.filter(p => p.estado === 'APROBADA').length
  const planificacionesPendientes = userPlanificaciones.filter(p => !p.estado || p.estado === 'PENDIENTE').length
  const planificacionesRechazadas = userPlanificaciones.filter(p => p.estado === 'RECHAZADA').length
  const tieneInformeFinal = !!informeEntregado

  // Métricas dinámicas reales para Docente / Evaluador / Administrador
  const totalEstudiantesPractica = studentsList.length
  const conveniosPendientes = studentsList.filter(s => s.statusClass === 'status-pending').length
  const conveniosAprobados = studentsList.filter(s => s.statusClass === 'status-approved').length
  const conveniosRevision = studentsList.filter(s => s.statusClass === 'status-review').length

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
          {!isDocenteOrAdmin ? (
            <button 
              onClick={() => navigate('/entrega-informe')}
              style={{ ...styles.quickCard, ...styles.quickCardBlue }}
            >
              <Upload size={22} />
              <div style={styles.quickCardTitle}>Entregar Informe Final</div>
              <div style={styles.quickCardDesc}>Subir PDF de Práctica</div>
            </button>
          ) : (
            <button 
              onClick={() => showFeedback('Función "Inscribir Alumno" no implementada.')}
              style={{ ...styles.quickCard, ...styles.quickCardBlue }}
            >
              <UserPlus size={22} />
              <div style={styles.quickCardTitle}>Inscribir Alumno</div>
              <div style={styles.quickCardDesc}>No implementada</div>
            </button>
          )}
          <button 
            onClick={() => navigate('/planificaciones')}
            style={{ ...styles.quickCard, ...styles.quickCardGold }}
          >
            <FileText size={22} />
            <div style={styles.quickCardTitle}>Planificaciones de Clase</div>
            <div style={styles.quickCardDesc}>{isDocenteOrAdmin ? 'Revisión y supervisión' : 'Subir y gestionar archivos'}</div>
          </button>
          <button 
            onClick={() => showFeedback('Función "Documentos Recientes" no implementada.')}
            style={{ ...styles.quickCard, ...styles.quickCardTeal }}
          >
            <Clock size={22} />
            <div style={styles.quickCardTitle}>Documentos Recientes</div>
            <div style={styles.quickCardDesc}>No implementada</div>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div style={styles.dashboardGrid}>
          {/* Main Column */}
          <div style={styles.dashboardMain}>
            {isDocenteOrAdmin ? (
              <div style={styles.card}>
                {/* Header con botón de ver todo */}
                <div style={{ ...styles.cardHeader, padding: '12px 16px' }}>
                  <div>
                    <h2 style={{ ...styles.cardTitle, fontSize: '15px', margin: 0 }}>Vista Previa de Planificaciones de Clase</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...styles.badgeBlue, fontSize: '11px', padding: '3px 8px' }}>{userPlanificaciones.length} archivos</span>
                    <button
                      onClick={() => navigate('/planificaciones')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 11px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <FileText size={13} /> Ver Todas y Evaluar →
                    </button>
                  </div>
                </div>

                {/* Resumen de KPIs / Métricas compactas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', padding: '10px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#93c5fd', fontWeight: '600', textTransform: 'uppercase' }}>Total Entregas</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>{userPlanificaciones.length}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#86efac', fontWeight: '600', textTransform: 'uppercase' }}>Aprobadas</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#4ade80', marginTop: '2px' }}>{planificacionesAprobadas}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#fde047', fontWeight: 600, textTransform: 'uppercase' }}>Pendientes</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#fbbf24', marginTop: '2px' }}>{planificacionesPendientes}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#fca5a5', fontWeight: 600, textTransform: 'uppercase' }}>Rechazadas</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#f87171', marginTop: '2px' }}>{planificacionesRechazadas}</div>
                  </div>
                </div>

                {/* Listado / Tabla Preview compacta */}
                <div style={styles.cardBody}>
                  {isLoadingData ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      Cargando vista previa de planificaciones...
                    </div>
                  ) : userPlanificaciones.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      <p style={{ margin: '0 0 10px 0' }}>No hay planificaciones subidas por estudiantes actualmente.</p>
                      <button
                        onClick={() => navigate('/planificaciones')}
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Ir a Planificaciones
                      </button>
                    </div>
                  ) : (
                    <>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.trHead}>
                            <th style={{ ...styles.th, padding: '7px 12px', fontSize: '10.5px' }}>Estudiante</th>
                            <th style={{ ...styles.th, padding: '7px 12px', fontSize: '10.5px' }}>Documento</th>
                            <th style={{ ...styles.th, padding: '7px 12px', fontSize: '10.5px', textAlign: 'center' }}>Estado</th>
                            <th style={{ ...styles.th, padding: '7px 12px', fontSize: '10.5px' }}>Fecha</th>
                            <th style={{ ...styles.th, padding: '7px 12px', fontSize: '10.5px' }}>Retroalimentación</th>
                            <th style={{ ...styles.th, padding: '7px 12px', fontSize: '10.5px', textAlign: 'right' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userPlanificaciones.slice(0, 6).map((item) => {
                            const rawName = item.nombreArchivo || item.archivo?.split('/').pop() || `Planificación #${item.id}`;
                            const cleanName = rawName.replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_/i, '');
                            const initials = (item.usuario?.fullName || 'Estudiante')
                              .replace(/^(prof\.?|dr\.?|ing\.?)\s+/i, '')
                              .split(/\s+/)
                              .map((p: string) => p[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase() || 'ES';

                            return (
                              <tr key={item.id} style={styles.trBody}>
                                <td style={{ ...styles.td, padding: '7px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                      color: '#60a5fa',
                                      border: '1px solid rgba(59, 130, 246, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10.5px',
                                      fontWeight: '700',
                                      flexShrink: 0
                                    }}>
                                      {initials}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '12px', lineHeight: 1.2 }}>
                                        {item.usuario?.fullName || 'Estudiante UBB'}
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                        {item.usuario?.email || `ID: #${item.id}`}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ ...styles.td, padding: '7px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', maxWidth: '180px' }} title={rawName}>
                                    <FileText size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                                    <span style={{
                                      color: '#e2e8f0',
                                      fontWeight: '500',
                                      fontSize: '11.5px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {cleanName}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ ...styles.td, padding: '7px 12px', textAlign: 'center' }}>
                                  <span style={{
                                    ...(item.estado === 'APROBADA'
                                      ? styles.statusApproved
                                      : item.estado === 'RECHAZADA'
                                      ? { ...styles.statusPending, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }
                                      : styles.statusPending),
                                    fontSize: '10px',
                                    padding: '2px 7px',
                                    borderRadius: '5px'
                                  }}>
                                    {item.estado || 'PENDIENTE'}
                                  </span>
                                </td>
                                <td style={{ ...styles.td, padding: '7px 12px', color: '#94a3b8', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                  {item.fecha || item.fechaCreacion
                                    ? new Date(item.fecha || item.fechaCreacion || '').toLocaleDateString('es-CL', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : '-'}
                                </td>
                                <td style={{ ...styles.td, padding: '7px 12px' }}>
                                  {item.retroalimentacion ? (
                                    <div
                                      style={{
                                        maxWidth: '150px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '11px',
                                        color: '#cbd5e1',
                                        fontStyle: 'italic'
                                      }}
                                      title={item.retroalimentacion}
                                    >
                                      💬 "{item.retroalimentacion}"
                                    </div>
                                  ) : (
                                    <span style={{ color: '#64748b', fontSize: '11px' }}>Sin observaciones</span>
                                  )}
                                </td>
                                <td style={{ ...styles.td, padding: '7px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => navigate('/planificaciones')}
                                    style={{
                                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                      color: '#60a5fa',
                                      border: '1px solid rgba(59, 130, 246, 0.3)',
                                      borderRadius: '5px',
                                      padding: '3px 8px',
                                      fontSize: '10.5px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    Revisar →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {userPlanificaciones.length > 6 && (
                        <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <button
                            onClick={() => navigate('/planificaciones')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#60a5fa',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Ver el historial completo ({userPlanificaciones.length} planificaciones) <ChevronRight size={14} />
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
                    <h2 style={styles.cardTitle}>Mi Estado de Práctica</h2>
                    <p style={styles.cardSubtitle}>Seguimiento personal de tu práctica y entregas en tiempo real</p>
                  </div>
                  <span style={styles.badgeBlue}>
                    {tieneInformeFinal && planificacionesAprobadas > 0 ? 'En Evaluación' : totalPlanificaciones > 0 ? 'En Proceso' : 'Convenio Aprobado'}
                  </span>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(59, 130, 246, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '20px' }}>
                    <div style={{ fontSize: '24px' }}>🎓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '15px' }}>{displayName}</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>Estudiante • {user?.email}</div>
                    </div>
                    <span style={{ 
                      backgroundColor: tieneInformeFinal ? '#10b981' : '#f59e0b', 
                      color: '#ffffff', 
                      padding: '4px 12px', 
                      borderRadius: '9999px', 
                      fontSize: '12px', 
                      fontWeight: '600' 
                    }}>
                      {tieneInformeFinal ? 'Informe Entregado' : 'Informe Pendiente'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ background: '#131e3a', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Planificaciones de Clase</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                        {totalPlanificaciones === 0 ? 'Sin archivos subidos' : `${totalPlanificaciones} entregada(s)`}
                      </div>
                      <div style={{ fontSize: '11px', color: planificacionesAprobadas > 0 ? '#4ade80' : '#94a3b8', marginTop: '2px' }}>
                        {planificacionesAprobadas} aprobada(s) • {planificacionesPendientes} en revisión
                      </div>
                    </div>
                    <div style={{ background: '#131e3a', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Informe Final de Práctica</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                        {tieneInformeFinal ? 'Entregado (PDF)' : 'Pendiente de entrega'}
                      </div>
                      <div style={{ fontSize: '11px', color: tieneInformeFinal ? '#60a5fa' : '#f59e0b', marginTop: '2px' }}>
                        {tieneInformeFinal ? `Archivo: ${informeEntregado?.nombreArchivo || 'Informe'}` : 'Plazo máx: 30 de Noviembre'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => navigate('/planificaciones')}
                      style={{ flex: 1, padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <FileText size={16} /> Subir Planificación ({totalPlanificaciones})
                    </button>
                    <button
                      onClick={() => navigate('/entrega-informe')}
                      style={{ flex: 1, padding: '12px', backgroundColor: tieneInformeFinal ? '#059669' : '#334155', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Upload size={16} /> {tieneInformeFinal ? 'Reenviar' : 'Entregar Informe Final'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div style={styles.dashboardSidebar}>
            {isDocenteOrAdmin ? (
              <>
                {/* Stats Administrativas Dinámicas */}
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Users size={18} color="#60a5fa" /></div>
                    <div style={styles.statValue}>{totalEstudiantesPractica}</div>
                    <div style={styles.statLabel}>Prácticas Registradas</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Clock size={18} color="#f59e0b" /></div>
                    <div style={styles.statValue}>{conveniosPendientes}</div>
                    <div style={styles.statLabel}>Pendientes de Firma</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><CheckCircle size={18} color="#22c55e" /></div>
                    <div style={styles.statValue}>{conveniosAprobados}</div>
                    <div style={styles.statLabel}>Convenios Aprobados</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Briefcase size={18} color="#a855f7" /></div>
                    <div style={styles.statValue}>{conveniosRevision}</div>
                    <div style={styles.statLabel}>En Revisión Académica</div>
                  </div>
                </div>

                {/* Tareas y Alertas Académicas */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Supervisión y Tareas Clave</h3>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={{ ...styles.recentDocItem, alignItems: 'flex-start' }}>
                      <AlertCircle size={18} color={conveniosPendientes > 0 ? '#f59e0b' : '#22c55e'} style={{ marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                          Convenios por Validar {conveniosPendientes > 0 ? `(${conveniosPendientes})` : '— Al día'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: conveniosPendientes > 0 ? '#facc15' : '#4ade80', marginTop: '2px' }}>
                          {conveniosPendientes > 0 
                            ? 'Requieren validación o firma del profesor guía' 
                            : 'Todos los convenios han sido aprobados'}
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.recentDocItem, alignItems: 'flex-start' }}>
                      <GraduationCap size={18} color="#60a5fa" style={{ marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                          Informes Finales de Práctica
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                          Revisión de informes técnicos y cumplimiento de 360 hrs
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.recentDocItem, alignItems: 'flex-start' }}>
                      <Briefcase size={18} color="#a855f7" style={{ marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                          Evaluación de Supervisor
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                          Pauta de evaluación técnica del centro de práctica
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.recentDocItem, alignItems: 'flex-start', borderBottom: 'none' }}>
                      <FileSpreadsheet size={18} color="#22c55e" style={{ marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                          Planificaciones y Bitácoras
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                          Supervisión de actividades semanales de estudiantes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Métricas Dinámicas del Estudiante */}
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><Clock size={18} color="#60a5fa" /></div>
                    <div style={styles.statValue}>360h</div>
                    <div style={styles.statLabel}>Horas Registradas</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><CheckCircle size={18} color="#22c55e" /></div>
                    <div style={styles.statValue}>100%</div>
                    <div style={styles.statLabel}>Avance de Horas</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><FileText size={18} color="#f59e0b" /></div>
                    <div style={styles.statValue}>{totalPlanificaciones}</div>
                    <div style={styles.statLabel}>
                      {totalPlanificaciones === 0 ? 'Sin Planificaciones' : planificacionesPendientes > 0 ? `${planificacionesPendientes} Pendiente(s)` : `${planificacionesAprobadas} Aprobada(s)`}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}><GraduationCap size={18} color={tieneInformeFinal ? '#22c55e' : '#a855f7'} /></div>
                    <div style={styles.statValue}>{tieneInformeFinal ? '1' : '0'}</div>
                    <div style={styles.statLabel}>{tieneInformeFinal ? 'Informe Entregado' : 'Informe Pendiente'}</div>
                  </div>
                </div>

                {/* Hitos y Fechas Clave del Estudiante */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Hitos y Fechas Clave</h3>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={{ ...styles.recentDocItem, alignItems: 'flex-start' }}>
                      <Calendar size={18} color={tieneInformeFinal ? '#22c55e' : '#f59e0b'} style={{ marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                          Entrega Informe Final {tieneInformeFinal ? '(Completado)' : '(Pendiente)'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: tieneInformeFinal ? '#4ade80' : '#f59e0b', marginTop: '2px' }}>
                          {tieneInformeFinal ? `Subido: ${informeEntregado?.nombreArchivo || 'PDF'} • En revisión` : 'Plazo máx: 30 de Noviembre'}
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.recentDocItem, alignItems: 'flex-start' }}>
                      <CheckSquare size={18} color={totalPlanificaciones > 0 ? '#22c55e' : '#f59e0b'} style={{ marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                          Planificaciones de Clase {totalPlanificaciones > 0 ? `(${totalPlanificaciones} Subidas)` : '(Pendiente)'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: totalPlanificaciones > 0 ? '#4ade80' : '#f59e0b', marginTop: '2px' }}>
                          {totalPlanificaciones === 0 
                            ? 'No has subido planificaciones aún' 
                            : `${planificacionesAprobadas} aprobada(s) • ${planificacionesPendientes} pendiente(s) de revisión`}
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.recentDocItem, alignItems: 'flex-start' }}>
                      <AlertCircle size={18} color="#60a5fa" style={{ marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>Evaluación de Empresa</div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>Pendiente de emisión por supervisor</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Ver Expediente de Práctica */}
      {selectedStudentForExpediente && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderOpen size={22} color="#60a5fa" />
                <h3 style={styles.modalTitle}>Expediente de Práctica Profesional</h3>
              </div>
              <button
                onClick={() => setSelectedStudentForExpediente(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Info Estudiante Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '20px' }}>
                <div style={{ ...styles.studentAvatar, width: '48px', height: '48px', fontSize: '18px' }}>
                  {selectedStudentForExpediente.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#ffffff' }}>{selectedStudentForExpediente.name}</div>
                  <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>
                    ID: <strong style={{ color: '#e2e8f0' }}>{selectedStudentForExpediente.id}</strong> • {selectedStudentForExpediente.email || `${selectedStudentForExpediente.id.toLowerCase()}@alumnos.ubiobio.cl`}
                  </div>
                </div>
                <span style={selectedStudentForExpediente.statusClass === 'status-approved' ? styles.statusApproved : selectedStudentForExpediente.statusClass === 'status-review' ? styles.statusReview : styles.statusPending}>
                  {selectedStudentForExpediente.status}
                </span>
              </div>

              {/* Grid de Datos Académicos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#101a33', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>Profesor Guía Asignado</div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#f8fafc' }}>{selectedStudentForExpediente.professor}</div>
                  <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>Departamento de Ingeniería de Software</div>
                </div>
                <div style={{ background: '#101a33', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>Supervisor / Evaluador de Práctica</div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#f8fafc' }}>{selectedStudentForExpediente.supervisor || 'Ing. Carlos Mendoza'}</div>
                  <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '4px' }}>Empresa Asignada • Convenio Vigente</div>
                </div>
              </div>

              {/* Horas y Avance */}
              <div style={{ background: '#101a33', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#cbd5e1', fontWeight: '600' }}>Horas de Práctica Cronológicas</span>
                  <span style={{ fontSize: '12.5px', color: '#4ade80', fontWeight: '700' }}>360 / 360 hrs (100%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#22c55e', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Documentos del Expediente */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Documentación Requerida
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={styles.expedienteDocItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="#60a5fa" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Convenio de Práctica Tripartito (PDF)</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Estado actual: {selectedStudentForExpediente.status}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        updateStudentStatus(selectedStudentForExpediente.id, 'Convenio Aprobado', 'status-approved')
                        setSelectedStudentForExpediente({
                          ...selectedStudentForExpediente,
                          status: 'Convenio Aprobado',
                          statusClass: 'status-approved'
                        })
                      }}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: selectedStudentForExpediente.statusClass === 'status-approved' ? 'rgba(34, 197, 94, 0.2)' : '#2563eb',
                        color: selectedStudentForExpediente.statusClass === 'status-approved' ? '#4ade80' : '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedStudentForExpediente.statusClass === 'status-approved' ? '✓ Aprobado' : 'Aprobar'}
                    </button>
                  </div>

                  <div style={styles.expedienteDocItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileSpreadsheet size={18} color="#f59e0b" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Planificaciones de Clase y Bitácoras</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Registros completados y validados</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#4ade80', fontWeight: '600' }}>✓ Verificado</span>
                  </div>

                  <div style={styles.expedienteDocItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <GraduationCap size={18} color="#a855f7" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Informe Final de Práctica Profesional (PDF)</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Disponible para revisión de comisión</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#60a5fa', fontWeight: '600' }}>📄 En Revisión</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setSelectedStudentForExpediente(null)}
                style={styles.modalSecondaryBtn}
              >
                Cerrar Expediente
              </button>
              <button
                onClick={() => {
                  updateStudentStatus(selectedStudentForExpediente.id, 'Convenio Aprobado', 'status-approved')
                  setSelectedStudentForExpediente(null)
                  showFeedback(`Práctica de ${selectedStudentForExpediente.name} aprobada formalmente.`)
                }}
                style={styles.modalPrimaryBtn}
              >
                Aprobar Práctica Completa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inscribir Nuevo Alumno en Práctica */}
      {isNewStudentModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={22} color="#60a5fa" />
                <h3 style={styles.modalTitle}>Inscribir Alumno en Práctica</h3>
              </div>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent}>
              <div style={styles.modalBody}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.formLabel}>Nombre Completo del Estudiante *</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Ej. Constanza Silva Morales"
                    style={styles.formInput}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.formLabel}>ID / Rol Estudiantil *</label>
                  <input
                    type="text"
                    required
                    value={newStudentID}
                    onChange={(e) => setNewStudentID(e.target.value)}
                    placeholder="Ej. 2022-8812"
                    style={styles.formInput}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.formLabel}>Correo Institucional</label>
                  <input
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="Ej. csilva@alumnos.ubiobio.cl"
                    style={styles.formInput}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.formLabel}>Profesor Guía Asignado</label>
                  <select
                    value={newStudentProf}
                    onChange={(e) => setNewStudentProf(e.target.value)}
                    style={styles.formInput}
                  >
                    <option value="Prof. Juan Pérez">Prof. Juan Pérez</option>
                    <option value="Prof. Ricardo Tapia">Prof. Ricardo Tapia</option>
                    <option value="Prof. Sandra Muñoz">Prof. Sandra Muñoz</option>
                    <option value="Prof. Carlos Henríquez">Prof. Carlos Henríquez</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.formLabel}>Estado Inicial del Convenio</label>
                  <select
                    value={newStudentStatus}
                    onChange={(e) => setNewStudentStatus(e.target.value)}
                    style={styles.formInput}
                  >
                    <option value="Convenio Pendiente de Firma">Convenio Pendiente de Firma</option>
                    <option value="En Revisión Académica">En Revisión Académica</option>
                    <option value="Convenio Aprobado">Convenio Aprobado</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  style={styles.modalSecondaryBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.modalPrimaryBtn}
                >
                  Inscribir Alumno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    padding: '24px 24px',
    boxSizing: 'border-box',
  },
  heroSection: {
    marginBottom: '20px',
  },
  heroGreeting: {
    fontSize: '12px',
    color: '#60a5fa',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  heroTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 6px 0',
  },
  goldAccent: {
    color: '#d4af37',
  },
  heroSubtitle: {
    fontSize: '13.5px',
    color: '#94a3b8',
    maxWidth: '650px',
  },
  searchWrapper: {
    marginBottom: '20px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#131e3a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '11px 16px',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '13.5px',
    width: '100%',
  },
  quickAccess: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  quickCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '16px 18px',
    borderRadius: '10px',
    backgroundColor: '#131e3a',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
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
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '6px',
  },
  quickCardDesc: {
    fontSize: '11.5px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 340px',
    gap: '20px',
    marginBottom: '32px',
  },
  dashboardMain: {
    display: 'flex',
    flexDirection: 'column',
  },
  dashboardSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  card: {
    backgroundColor: '#131e3a',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
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

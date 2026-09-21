import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getPlanificaciones, Planificacion, getDetalleEstudianteByCorreo, EstudianteDetalleDto } from '../services/api'
import {
  User,
  Mail,
  Shield,
  GraduationCap,
  Briefcase,
  Building,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  ArrowLeft,
  Award,
  BookOpen
} from 'lucide-react'

export const PerfilPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([])
  const [informeFinal, setInformeFinal] = useState<{ nombreArchivo: string; fechaEntrega?: string } | null>(null)
  const [estudianteDetalle, setEstudianteDetalle] = useState<EstudianteDetalleDto | null>(null)
  const [isLoadingDetalle, setIsLoadingDetalle] = useState<boolean>(false)

  const displayName = user?.fullName || 'Usuario UBB'
  const email = user?.email || 'sin-correo@ubiobio.cl'
  const role = user?.role || 'Estudiante'
  const initials = user?.initials || displayName.slice(0, 2).toUpperCase()
  const isEstudiante = role.toLowerCase().includes('estudiante')

  useEffect(() => {
    if (user?.id) {
      getPlanificaciones(user.id, user.role)
        .then((data) => setPlanificaciones(data || []))
        .catch(() => setPlanificaciones([]))

      const storedInforme = localStorage.getItem(`ubb_informe_entrega_${user.id}`)
      if (storedInforme) {
        try {
          setInformeFinal(JSON.parse(storedInforme))
        } catch {
          setInformeFinal(null)
        }
      }

      if (isEstudiante && user.email) {
        setIsLoadingDetalle(true)
        getDetalleEstudianteByCorreo(user.email, user.email)
          .then((det) => setEstudianteDetalle(det))
          .catch((err) => {
            console.error('Error cargando detalle estudiante:', err)
          })
          .finally(() => setIsLoadingDetalle(false))
      }
    }
  }, [user, isEstudiante])

  const totalPlanif = planificaciones.length
  const aprobadas = planificaciones.filter(p => p.estado === 'APROBADA').length
  const pendientes = planificaciones.filter(p => !p.estado || p.estado === 'PENDIENTE').length

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />

      <div style={styles.container}>
        {/* Back Button */}
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          <ArrowLeft size={16} /> Volver al Inicio
        </button>

        {/* Profile Header Banner */}
        <div style={styles.headerCard}>
          <div style={styles.avatarSection}>
            <div style={styles.avatarLarge}>{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={styles.nameRow}>
                <h1 style={styles.userName}>{displayName}</h1>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: isEstudiante ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: isEstudiante ? '#60a5fa' : '#facc15',
                  borderColor: isEstudiante ? 'rgba(59, 130, 246, 0.4)' : 'rgba(234, 179, 8, 0.4)'
                }}>
                  <Shield size={13} /> {role}
                </span>
              </div>
              <div style={styles.emailRow}>
                <Mail size={14} color="#94a3b8" />
                <span>{email}</span>
                <span style={{ color: '#475569' }}>•</span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} /> Cuenta Activa y Verificada
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Grid */}
        <div style={styles.grid}>
          {/* Column 1: Academic & Institutional Info */}
          <div style={styles.column}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIconWrap}>
                  <GraduationCap size={20} color="#60a5fa" />
                </div>
                <div>
                  <h3 style={styles.cardTitle}>Información Académica</h3>
                  <p style={styles.cardSubtitle}>Datos curriculares registrados en la UBB</p>
                </div>
              </div>

              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Universidad</span>
                  <span style={styles.infoValue}>Universidad del Bío-Bío (UBB)</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Facultad</span>
                  <span style={styles.infoValue}>Facultad de Ciencias Empresariales / Ingeniería</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Carrera / Departamento</span>
                  <span style={styles.infoValue}>Ingeniería Civil en Informática</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Sede Universitaria</span>
                  <span style={styles.infoValue}>Campus Concepción / Chillán</span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Estado Académico</span>
                  <span style={{ ...styles.infoValue, color: '#10b981', fontWeight: '600' }}>
                    Alumno Regular • Práctica Profesional
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Practice & Documents Status */}
          <div style={styles.column}>
            {isEstudiante ? (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.cardIconWrap, backgroundColor: 'rgba(234, 179, 8, 0.15)' }}>
                    <Briefcase size={20} color="#facc15" />
                  </div>
                  <div>
                    <h3 style={styles.cardTitle}>Expediente de Práctica</h3>
                    <p style={styles.cardSubtitle}>Seguimiento de práctica profesional y tutoría</p>
                  </div>
                </div>

                <div style={styles.infoList}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Modalidad de Práctica</span>
                    <span style={styles.infoValue}>Práctica Profesional II (360 Horas)</span>
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Profesor Guía Asignado</span>
                    <span style={styles.infoValue}>
                      {estudianteDetalle?.profesorGuiaNombre
                        ? `${estudianteDetalle.profesorGuiaNombre} (${estudianteDetalle.profesorGuiaCorreo || ''})`
                        : 'Prof. Boris Arenas (boris.profe@ubiobio.cl)'}
                    </span>
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Evaluadores</span>
                    {isLoadingDetalle ? (
                      <span style={{ ...styles.infoValue, color: '#94a3b8' }}>Cargando evaluadores...</span>
                    ) : estudianteDetalle && estudianteDetalle.evaluadores && estudianteDetalle.evaluadores.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {estudianteDetalle.evaluadores.map((ev) => {
                          const nombreEvaluador = ev.primerNombre && ev.primerApellido
                            ? `${ev.primerNombre} ${ev.primerApellido} ${ev.segundoApellido || ''}`.trim()
                            : ev.nombreCompleto;
                          const tipoStr = ev.tipo?.toLowerCase().includes('tutor') ? 'tutor' : 'colaborador';
                          return (
                            <div key={ev.rut || ev.correo} style={{ fontSize: '13.5px', color: '#e2e8f0' }}>
                              <strong style={{ color: '#f8fafc' }}>{nombreEvaluador}</strong>
                              <span style={{ color: '#94a3b8', marginLeft: '6px' }}>({ev.correo})</span>
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: tipoStr === 'tutor' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                color: tipoStr === 'tutor' ? '#60a5fa' : '#c084fc',
                                fontWeight: '600'
                              }}>
                                {tipoStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ ...styles.infoValue, color: '#94a3b8' }}>Sin evaluadores asignados actualmente</span>
                    )}
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Planificaciones Subidas</span>
                    <span style={styles.infoValue}>
                      {totalPlanif > 0 ? `${totalPlanif} archivos (${aprobadas} aprobadas, ${pendientes} en revisión)` : 'Sin planificaciones entregadas'}
                    </span>
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Informe Final de Práctica</span>
                    <span style={{
                      ...styles.infoValue,
                      color: informeFinal ? '#10b981' : '#f59e0b',
                      fontWeight: '600'
                    }}>
                      {informeFinal ? `Entregado (${informeFinal.nombreArchivo || 'PDF'})` : '⏳ Pendiente de entrega'}
                    </span>
                  </div>
                </div>

                <div style={styles.actionsBox}>
                  <button onClick={() => navigate('/planificaciones')} style={styles.btnPrimary}>
                    <FileText size={16} /> Ver Mis Planificaciones
                  </button>
                  <button onClick={() => navigate('/entrega-informe')} style={styles.btnSecondary}>
                    <Upload size={16} /> Subir Informe Final
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.cardIconWrap, backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                    <BookOpen size={20} color="#4ade80" />
                  </div>
                  <div>
                    <h3 style={styles.cardTitle}>Panel Académico Docente</h3>
                    <p style={styles.cardSubtitle}>Privilegios de gestión y evaluación</p>
                  </div>
                </div>

                <div style={styles.infoList}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Departamento</span>
                    <span style={styles.infoValue}>Departamento de Sistemas de Información</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Asignaturas a Cargo</span>
                    <span style={styles.infoValue}>Prácticas Profesionales & Talleres de Software</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Permisos de Evaluación</span>
                    <span style={{ ...styles.infoValue, color: '#10b981', fontWeight: '600' }}>
                      ✓ Aprobación y Retroalimentación de Planificaciones
                    </span>
                  </div>
                </div>

                <div style={styles.actionsBox}>
                  <button onClick={() => navigate('/planificaciones')} style={styles.btnPrimary}>
                    <FileText size={16} /> Supervisar Planificaciones
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: 0,
    transition: 'color 0.2s',
  },
  headerCard: {
    backgroundColor: '#131e3a',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '28px',
    marginBottom: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  avatarLarge: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(29, 78, 216, 0.5)',
    flexShrink: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '6px',
  },
  userName: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid transparent',
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13.5px',
    color: '#94a3b8',
    flexWrap: 'wrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#131e3a',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  cardIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  cardSubtitle: {
    fontSize: '12.5px',
    color: '#94a3b8',
    margin: '2px 0 0 0',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  infoLabel: {
    fontSize: '11.5px',
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '14px',
    color: '#e2e8f0',
  },
  actionsBox: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  btnPrimary: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
  },
  btnSecondary: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#334155',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
  },
}

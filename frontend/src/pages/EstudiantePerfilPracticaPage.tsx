import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { 
  getDetalleInscripcion, 
  uploadInformeForInscripcion, 
  getPlanificaciones,
  evaluarPlanificacion,
  EstudianteDetalleDto, 
  InformeEntregaResponse,
  Planificacion
} from '../services/api'
import { getEvaluacionesProfesor } from '../services/practicaService'
import { EvaluacionesResponse, EvaluacionCLA, EvaluacionSEM } from '../types/evaluacion'
import {
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  X,
  MessageSquare,
  ClipboardCheck,
  Lock
} from 'lucide-react'

export const EstudiantePerfilPracticaPage: React.FC = () => {
  const { inscripcionId } = useParams<{ inscripcionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const esDocente = user?.role === 'Profesor' || user?.role === 'Administrador'

  const [detalle, setDetalle] = useState<EstudianteDetalleDto | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Acciones - Subida de Informe
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Pestañas y Filtro de Práctica
  const [activeTab, setActiveTab] = useState<'planificaciones' | 'evaluaciones'>('planificaciones')
  const [filtroPractica, setFiltroPractica] = useState<string>('ACTUAL') // 'ACTUAL' | 'TODAS' | string(id)

  // Estado Planificaciones
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([])
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false)
  const [filtroEstadoPlan, setFiltroEstadoPlan] = useState<string>('TODOS')
  const [busquedaPlan, setBusquedaPlan] = useState<string>('')

  // Modal Evaluación de Planificación
  const [evalModalOpen, setEvalModalOpen] = useState<boolean>(false)
  const [planAEvaluar, setPlanAEvaluar] = useState<Planificacion | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA')
  const [observacionTexto, setObservacionTexto] = useState<string>('')
  const [isSubmittingEval, setIsSubmittingEval] = useState<boolean>(false)

  // Estado Evaluaciones de Desempeño
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionesResponse | null>(null)
  const [loadingEval, setLoadingEval] = useState<boolean>(false)
  const [filtroTipoEval, setFiltroTipoEval] = useState<'TODAS' | 'CLASE' | 'SEMESTRAL'>('TODAS')
  const [busquedaEval, setBusquedaEval] = useState<string>('')

  const cargarDatos = async () => {
    if (!inscripcionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getDetalleInscripcion(Number(inscripcionId), user?.email)
      setDetalle(data)

      // Verificación de integridad de dominio en cliente
      if (user && data) {
        const emailNorm = user.email.toLowerCase().trim()
        const esAdmin = emailNorm === 'admin@ubiobio.cl' || user.role === 'Administrador'
        const esProfesorDeEstaPractica = data.profesorGuiaCorreo?.toLowerCase().trim() === emailNorm
        const esElMismoEstudiante = data.estudianteCorreo?.toLowerCase().trim() === emailNorm
        const esEvaluadorAsignado = data.evaluadores?.some((e) => e.correo?.toLowerCase().trim() === emailNorm)

        if (!esAdmin && !esProfesorDeEstaPractica && !esElMismoEstudiante && !esEvaluadorAsignado) {
          setError('Acceso denegado: No tienes autorización para consultar la ficha de un estudiante fuera de tu dominio académico.')
          return
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los datos del estudiante')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [inscripcionId, user?.email])

  // Cargar Planificaciones del estudiante
  const cargarPlanificacionesEstudiante = async (targetInscripcionId?: number) => {
    setLoadingPlan(true)
    try {
      if (targetInscripcionId) {
        const data = await getPlanificaciones(undefined, undefined, undefined, targetInscripcionId)
        setPlanificaciones(data)
      } else {
        // Todas las planificaciones del profesor filtradas para este alumno
        const data = await getPlanificaciones(user?.id, user?.role, user?.email)
        if (detalle?.estudianteCorreo) {
          const filtradas = data.filter(
            (p) => p.usuario?.email?.toLowerCase() === detalle.estudianteCorreo.toLowerCase()
          )
          setPlanificaciones(filtradas)
        } else {
          setPlanificaciones(data)
        }
      }
    } catch (err) {
      console.error('Error al cargar planificaciones del estudiante:', err)
    } finally {
      setLoadingPlan(false)
    }
  }

  // Cargar Evaluaciones del estudiante
  const cargarEvaluacionesEstudiante = async (targetInscripcionId?: number) => {
    setLoadingEval(true)
    try {
      const data = await getEvaluacionesProfesor(
        undefined,
        'TODAS',
        user?.role === 'Profesor' ? user.email : undefined,
        detalle?.estudianteRut,
        targetInscripcionId
      )
      setEvaluaciones(data)
    } catch (err) {
      console.error('Error al cargar evaluaciones del estudiante:', err)
    } finally {
      setLoadingEval(false)
    }
  }

  // Sincronizar planificaciones y evaluaciones cuando cambie la ficha o el filtro de práctica
  useEffect(() => {
    if (detalle && inscripcionId) {
      let targetId: number | undefined
      if (filtroPractica === 'ACTUAL') {
        targetId = Number(inscripcionId)
      } else if (filtroPractica === 'TODAS') {
        targetId = undefined
      } else {
        targetId = Number(filtroPractica)
      }

      cargarPlanificacionesEstudiante(targetId)
      cargarEvaluacionesEstudiante(targetId)
    }
  }, [detalle, inscripcionId, filtroPractica])

  // Subida de informe final
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setUploadSuccess(null)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Formato inválido. Por favor selecciona un documento en formato PDF.')
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUploadInforme = async () => {
    if (!inscripcionId || !selectedFile) {
      setUploadError('Por favor selecciona un archivo PDF antes de enviar.')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const res: InformeEntregaResponse = await uploadInformeForInscripcion(Number(inscripcionId), selectedFile)
      setUploadSuccess(`¡Informe "${res.nombreArchivo}" subido exitosamente!`)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      const todayStr = new Date().toISOString().split('T')[0]
      setDetalle((prev) =>
        prev
          ? {
              ...prev,
              informeActual: {
                id: prev.informeActual?.id || 0,
                archivo: res.nombreArchivo,
                nombreArchivo: res.nombreArchivo,
                fecha: res.fechaEntrega ? res.fechaEntrega.split('T')[0] : todayStr,
                emisor: 'PROFESOR',
              },
            }
          : prev
      )
      await cargarDatos()
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Ocurrió un error al subir el informe.')
    } finally {
      setIsUploading(false)
    }
  }

  // Modal para evaluar planificación
  const abrirModalEvaluar = (item: Planificacion, estadoInicial?: 'APROBADA' | 'RECHAZADA') => {
    const estado = estadoInicial || (item.estado === 'RECHAZADA' ? 'RECHAZADA' : 'APROBADA')
    setPlanAEvaluar(item)
    setNuevoEstado(estado)
    setObservacionTexto(
      item.retroalimentacion ||
        (estado === 'APROBADA'
          ? 'Planificación de clase revisada y aprobada correctamente.'
          : 'Se solicitan correcciones en las actividades y objetivos pedagógicos antes de la aprobación.')
    )
    setEvalModalOpen(true)
  }

  const confirmarEvaluacion = async () => {
    if (!planAEvaluar) return
    setIsSubmittingEval(true)
    try {
      const actualizada = await evaluarPlanificacion(
        planAEvaluar.id,
        nuevoEstado,
        observacionTexto.trim(),
        user?.email
      )
      setPlanificaciones((prev) =>
        prev.map((p) =>
          p.id === actualizada.id
            ? { ...p, estado: actualizada.estado, retroalimentacion: actualizada.retroalimentacion }
            : p
        )
      )
      setEvalModalOpen(false)
      setPlanAEvaluar(null)
    } catch (err: any) {
      alert('Error al guardar la evaluación de la planificación.')
    } finally {
      setIsSubmittingEval(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ES'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  // Control de Integridad de Dominio y Autorización
  const esEstudianteNoDuenio =
    user?.role === 'Estudiante' &&
    detalle?.estudianteCorreo &&
    user?.email &&
    detalle.estudianteCorreo.trim().toLowerCase() !== user.email.trim().toLowerCase()

  const esProfesorNoAsignado =
    user?.role === 'Profesor' &&
    detalle?.profesorGuiaCorreo &&
    user?.email &&
    detalle.profesorGuiaCorreo.trim().toLowerCase() !== user.email.trim().toLowerCase()

  const accesoDenegado = !loading && detalle && user && (esEstudianteNoDuenio || esProfesorNoAsignado)

  // Filtros aplicados a Planificaciones
  const planificacionesFiltradas = planificaciones.filter((p) => {
    if (filtroEstadoPlan !== 'TODOS' && p.estado !== filtroEstadoPlan) {
      return false
    }
    if (busquedaPlan.trim()) {
      const q = busquedaPlan.toLowerCase()
      const matchArchivo = p.nombreArchivo?.toLowerCase().includes(q)
      const matchFecha = p.fechaClase?.toLowerCase().includes(q) || p.fecha?.toLowerCase().includes(q)
      const matchObs = p.retroalimentacion?.toLowerCase().includes(q)
      return matchArchivo || matchFecha || matchObs
    }
    return true
  })

  // Evaluaciones procesadas
  const todasEvaluaciones = [
    ...(evaluaciones?.evaluacionesClase || []).map((ec: EvaluacionCLA) => ({
      ...ec,
      categoria: 'CLASE' as const,
    })),
    ...(evaluaciones?.evaluacionesSemestrales || []).map((es: EvaluacionSEM) => ({
      ...es,
      categoria: 'SEMESTRAL' as const,
    })),
  ]

  const evaluacionesFiltradas = todasEvaluaciones.filter((ev) => {
    if (filtroTipoEval !== 'TODAS' && ev.categoria !== filtroTipoEval) {
      return false
    }
    if (busquedaEval.trim()) {
      const q = busquedaEval.toLowerCase()
      const matchEvaluador = ev.evaluadorNombre?.toLowerCase().includes(q)
      const matchAsignatura = ev.asignaturaNombre?.toLowerCase().includes(q)
      const matchTipo = ev.evaluadorTipo?.toLowerCase().includes(q)
      return matchEvaluador || matchAsignatura || matchTipo
    }
    return true
  })

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Botón Volver */}
        <button
          onClick={() => {
            if (user?.role === 'Estudiante') {
              navigate('/practicas')
            } else if (detalle?.ofertaId) {
              navigate(`/practicas/${detalle.ofertaId}`)
            } else {
              navigate(-1)
            }
          }}
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
          <ArrowLeft size={16} /> Volver
        </button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <p style={{ fontSize: '16px' }}>Cargando perfil del estudiante y detalles de práctica...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
              <AlertCircle size={20} />
              <span>No se pudo cargar la información</span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {/* Barrera de Integridad y Dominio de Acceso */}
        {accesoDenegado && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '32px 28px',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: '650px',
              margin: '40px auto',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#f87171',
              }}
            >
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
              Acceso Restringido por Integridad de Dominio
            </h2>
            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '24px' }}>
              {esEstudianteNoDuenio
                ? 'No tienes autorización para acceder a la ficha académica de otros estudiantes.'
                : 'No tienes permisos para visualizar la ficha de estudiantes que no están inscritos en tus prácticas docentes.'}
            </p>
            <button
              onClick={() => navigate(user?.role === 'Estudiante' ? '/practicas' : '/practicas')}
              style={{
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Regresar a mis Prácticas
            </button>
          </div>
        )}

        {!loading && !error && !accesoDenegado && detalle && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 360px',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* ============================================================ */}
            {/* COLUMNA IZQUIERDA: INFORMACIÓN, ASIGNACIÓN, HISTORIAL Y TABS */}
            {/* ============================================================ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Tarjeta 1: Perfil y Datos Personales del Alumno */}
              <div
                style={{
                  backgroundColor: '#131e3a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(37, 99, 235, 0.25)',
                      border: '2px solid #2563eb',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '22px',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(detalle.estudianteNombre)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: '#93c5fd',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Estudiante UBB
                      </span>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0' }}>
                      {detalle.estudianteNombre}
                    </h1>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        color: '#94a3b8',
                        fontSize: '13.5px',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <User size={15} color="#60a5fa" />
                        RUT: <strong style={{ color: '#f1f5f9' }}>{detalle.estudianteRut}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={15} color="#94a3b8" />
                        <span>{detalle.estudianteCorreo}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subdatos académicos */}
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '18px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Carrera</div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#e2e8f0',
                        fontWeight: '600',
                        fontSize: '13.5px',
                      }}
                    >
                      <GraduationCap size={16} color="#d4af37" />
                      <span>{detalle.carrera || 'Ingeniería Civil en Informática'}</span>
                    </div>
                  </div>

                  {detalle.profesorGuiaNombre && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                        Profesor Encargado
                      </div>
                      <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '13.5px' }}>
                        {detalle.profesorGuiaNombre}
                      </div>
                      {detalle.profesorGuiaCorreo && (
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{detalle.profesorGuiaCorreo}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 2: Centro de Práctica / Establecimiento y Evaluadores */}
              <div
                style={{
                  backgroundColor: '#131e3a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Building2 size={20} color="#60a5fa" />
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                    Asignación y Centro de Práctica
                  </h2>
                </div>

                {/* Establecimiento */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      color: '#d4af37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Building2 size={22} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Establecimiento Educacional / Centro
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                      {detalle.establecimiento || 'Liceo Bicentenario de Excelencia Polivalente San Nicolás'}
                    </div>
                  </div>
                </div>

                {/* Evaluadores Asignados */}
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#cbd5e1',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Users size={16} color="#60a5fa" />
                    <span>Evaluadores Asignados</span>
                  </div>

                  {detalle.evaluadores && detalle.evaluadores.length > 0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      {detalle.evaluadores.map((ev, index) => {
                        const isTutor = ev.tipo?.toUpperCase() === 'TUTOR'
                        return (
                          <div
                            key={index}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.025)',
                              border: `1px solid ${isTutor ? 'rgba(37, 99, 235, 0.25)' : 'rgba(168, 85, 247, 0.25)'}`,
                              borderRadius: '10px',
                              padding: '14px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  textTransform: 'uppercase',
                                  backgroundColor: isTutor ? 'rgba(37, 99, 235, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                  color: isTutor ? '#93c5fd' : '#d8b4fe',
                                  border: `1px solid ${isTutor ? 'rgba(37, 99, 235, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
                                }}
                              >
                                {isTutor ? 'Profesor Tutor' : 'Profesor Colaborador'}
                              </span>
                              <ShieldCheck size={16} color={isTutor ? '#60a5fa' : '#c084fc'} />
                            </div>
                            <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
                              {ev.nombreCompleto}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                              RUT: <span style={{ color: '#cbd5e1' }}>{ev.rut}</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                              {ev.correo}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        padding: '10px 0',
                      }}
                    >
                      No se registran evaluadores asignados para esta práctica actualmente.
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 3: Historial de Prácticas del Estudiante */}
              <div
                style={{
                  backgroundColor: '#131e3a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={20} color="#d4af37" />
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                      Historial de Prácticas
                    </h2>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {detalle.historialPracticas?.length || 0} registrada(s)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {detalle.historialPracticas && detalle.historialPracticas.length > 0 ? (
                    detalle.historialPracticas.map((p) => {
                      return (
                        <div
                          key={p.inscripcionId}
                          style={{
                            borderRadius: '12px',
                            padding: '16px 20px',
                            backgroundColor: p.esActual ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.025)',
                            border: p.esActual ? '1.5px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.07)',
                            boxShadow: p.esActual ? '0 0 16px rgba(37, 99, 235, 0.18)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: p.esActual ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                color: p.esActual ? '#60a5fa' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {p.esActual ? <Sparkles size={20} /> : <Calendar size={18} />}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '700', fontSize: '15px', color: '#ffffff' }}>
                                  {p.asignaturaNombre}
                                </span>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  ({p.asignaturaCodigo})
                                </span>
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '3px' }}>
                                Año {p.anio} • Período {p.periodo}
                              </div>
                            </div>
                          </div>

                          <div>
                            {p.esActual ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: '#1d4ed8',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  boxShadow: '0 2px 10px rgba(29, 78, 216, 0.4)',
                                }}
                              >
                                <span
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#4ade80',
                                  }}
                                />
                                Práctica Actual • En Curso
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  color: '#94a3b8',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                <Clock size={12} />
                                Práctica Histórica • Finalizada
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        padding: '10px 0',
                      }}
                    >
                      No se encontraron prácticas anteriores para este alumno.
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================ */}
              {/* TARJETA 4: SEGUIMIENTO HISTÓRICO (PLANIFICACIONES Y EVALUACIONES) */}
              {/* ============================================================ */}
              <div
                style={{
                  backgroundColor: '#131e3a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Header con título y Selector de Práctica */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardCheck size={20} color="#60a5fa" />
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                      Seguimiento Académico del Estudiante
                    </h2>
                  </div>

                  {/* Filtro de Práctica para las pestañas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: '600' }}>
                      Práctica:
                    </span>
                    <select
                      value={filtroPractica}
                      onChange={(e) => setFiltroPractica(e.target.value)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="ACTUAL" style={{ backgroundColor: '#131e3a', color: '#ffffff' }}>
                        Práctica Actual ({detalle.asignaturaNombre || 'En curso'})
                      </option>
                      <option value="TODAS" style={{ backgroundColor: '#131e3a', color: '#ffffff' }}>
                        Todas las prácticas cursadas con el docente
                      </option>
                      {detalle.historialPracticas &&
                        detalle.historialPracticas.map((p) => (
                          <option
                            key={p.inscripcionId}
                            value={String(p.inscripcionId)}
                            style={{ backgroundColor: '#131e3a', color: '#ffffff' }}
                          >
                            {p.asignaturaNombre} ({p.anio}-{p.periodo}) {p.esActual ? '• Actual' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Tabs de navegación */}
                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    gap: '8px',
                    marginBottom: '20px',
                  }}
                >
                  <button
                    onClick={() => setActiveTab('planificaciones')}
                    style={{
                      padding: '12px 18px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'planificaciones' ? '3px solid #2563eb' : '3px solid transparent',
                      color: activeTab === 'planificaciones' ? '#ffffff' : '#94a3b8',
                      fontWeight: activeTab === 'planificaciones' ? '700' : '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FileText size={16} color={activeTab === 'planificaciones' ? '#60a5fa' : '#94a3b8'} />
                    <span>Planificaciones de Clase</span>
                    <span
                      style={{
                        backgroundColor: activeTab === 'planificaciones' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {planificaciones.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('evaluaciones')}
                    style={{
                      padding: '12px 18px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'evaluaciones' ? '3px solid #2563eb' : '3px solid transparent',
                      color: activeTab === 'evaluaciones' ? '#ffffff' : '#94a3b8',
                      fontWeight: activeTab === 'evaluaciones' ? '700' : '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ClipboardCheck size={16} color={activeTab === 'evaluaciones' ? '#60a5fa' : '#94a3b8'} />
                    <span>Evaluaciones de Desempeño</span>
                    <span
                      style={{
                        backgroundColor: activeTab === 'evaluaciones' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {todasEvaluaciones.length}
                    </span>
                  </button>
                </div>

                {/* CONTENIDO TAB 1: PLANIFICACIONES DE CLASE */}
                {activeTab === 'planificaciones' && (
                  <div>
                    {/* Barra de Filtros para Planificaciones */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '16px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Filtro por estado */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['TODOS', 'PENDIENTE', 'APROBADA', 'RECHAZADA'] as const).map((est) => (
                          <button
                            key={est}
                            onClick={() => setFiltroEstadoPlan(est)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: filtroEstadoPlan === est ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                              backgroundColor: filtroEstadoPlan === est ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                              color: filtroEstadoPlan === est ? '#93c5fd' : '#94a3b8',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            {est === 'TODOS' ? 'Todas' : est.charAt(0) + est.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>

                      {/* Búsqueda por texto */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          width: '240px',
                        }}
                      >
                        <Search size={14} color="#94a3b8" />
                        <input
                          type="text"
                          value={busquedaPlan}
                          onChange={(e) => setBusquedaPlan(e.target.value)}
                          placeholder="Buscar fecha o archivo..."
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '12.5px',
                            outline: 'none',
                            width: '100%',
                          }}
                        />
                        {busquedaPlan && (
                          <button
                            onClick={() => setBusquedaPlan('')}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lista de Planificaciones */}
                    {loadingPlan ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13.5px' }}>
                        Cargando planificaciones de clase...
                      </div>
                    ) : planificacionesFiltradas.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '36px 20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '12px',
                          border: '1px dashed rgba(255, 255, 255, 0.08)',
                          color: '#94a3b8',
                        }}
                      >
                        <FileText size={32} color="#64748b" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                          No se encontraron planificaciones registradas
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                          {busquedaPlan || filtroEstadoPlan !== 'TODOS'
                            ? 'Intenta modificando los filtros de búsqueda.'
                            : 'El estudiante aún no ha cargado planificaciones para esta práctica.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {planificacionesFiltradas.map((item) => {
                          const isAprobada = item.estado === 'APROBADA'
                          const isRechazada = item.estado === 'RECHAZADA'
                          return (
                            <div
                              key={item.id}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
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
                                  <Calendar size={16} color="#60a5fa" />
                                  <span style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>
                                    Clase del {item.fechaClase || item.fecha || 'Fecha no registrada'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {/* Estado Badge */}
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '11.5px',
                                      fontWeight: '700',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      backgroundColor: isAprobada
                                        ? 'rgba(34, 197, 94, 0.15)'
                                        : isRechazada
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                      color: isAprobada ? '#4ade80' : isRechazada ? '#f87171' : '#fbbf24',
                                      border: `1px solid ${
                                        isAprobada
                                          ? 'rgba(34, 197, 94, 0.3)'
                                          : isRechazada
                                          ? 'rgba(239, 68, 68, 0.3)'
                                          : 'rgba(245, 158, 11, 0.3)'
                                      }`,
                                    }}
                                  >
                                    {isAprobada ? (
                                      <>
                                        <CheckCircle2 size={12} /> Aprobada
                                      </>
                                    ) : isRechazada ? (
                                      <>
                                        <AlertCircle size={12} /> Requiere Corrección
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={12} /> Pendiente de Revisión
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '12px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px' }}>
                                  <FileText size={15} color="#94a3b8" />
                                  <span style={{ fontWeight: '500' }}>{item.nombreArchivo || 'Planificacion.pdf'}</span>
                                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                                    • Subida: {item.fechaCreacion ? item.fechaCreacion.split('T')[0] : item.fecha || 'Reciente'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {/* Botón Ver PDF */}
                                  <a
                                    href={item.archivoUrl || `/api/planificaciones/${item.id}/archivo`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      backgroundColor: 'rgba(37, 99, 235, 0.2)',
                                      color: '#93c5fd',
                                      border: '1px solid rgba(37, 99, 235, 0.4)',
                                      padding: '5px 12px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <FileText size={13} /> Ver PDF <ExternalLink size={11} />
                                  </a>

                                  {/* Botón Evaluar (Solo docentes) */}
                                  {esDocente && (
                                    <button
                                      onClick={() => abrirModalEvaluar(item)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: '#ffffff',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <MessageSquare size={13} color="#60a5fa" />
                                      {item.estado === 'PENDIENTE' ? 'Evaluar' : 'Modificar'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Retroalimentación / Observaciones si existen */}
                              {item.retroalimentacion && (
                                <div
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    fontSize: '12.5px',
                                    color: '#cbd5e1',
                                    marginTop: '4px',
                                  }}
                                >
                                  <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '2px' }}>
                                    Observación docente:
                                  </strong>
                                  {item.retroalimentacion}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* CONTENIDO TAB 2: EVALUACIONES DE DESEMPEÑO */}
                {activeTab === 'evaluaciones' && (
                  <div>
                    {/* Barra de Filtros para Evaluaciones */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '16px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Filtro por tipo */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['TODAS', 'CLASE', 'SEMESTRAL'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setFiltroTipoEval(t)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: filtroTipoEval === t ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                              backgroundColor: filtroTipoEval === t ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                              color: filtroTipoEval === t ? '#93c5fd' : '#94a3b8',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            {t === 'TODAS' ? 'Todas' : t === 'CLASE' ? 'De Clase' : 'Semestrales'}
                          </button>
                        ))}
                      </div>

                      {/* Búsqueda por texto */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          width: '240px',
                        }}
                      >
                        <Search size={14} color="#94a3b8" />
                        <input
                          type="text"
                          value={busquedaEval}
                          onChange={(e) => setBusquedaEval(e.target.value)}
                          placeholder="Buscar evaluador..."
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '12.5px',
                            outline: 'none',
                            width: '100%',
                          }}
                        />
                        {busquedaEval && (
                          <button
                            onClick={() => setBusquedaEval('')}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lista de Evaluaciones */}
                    {loadingEval ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13.5px' }}>
                        Cargando evaluaciones de desempeño...
                      </div>
                    ) : evaluacionesFiltradas.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '36px 20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '12px',
                          border: '1px dashed rgba(255, 255, 255, 0.08)',
                          color: '#94a3b8',
                        }}
                      >
                        <Award size={32} color="#64748b" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                          No se encontraron evaluaciones registradas
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                          {busquedaEval || filtroTipoEval !== 'TODAS'
                            ? 'Intenta modificando los filtros de búsqueda.'
                            : 'Aún no se han registrado pautas de evaluación para este estudiante.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {evaluacionesFiltradas.map((ev) => {
                          const isClase = ev.categoria === 'CLASE'
                          const isTutor = ev.evaluadorTipo?.toUpperCase().includes('TUTOR')
                          return (
                            <div
                              key={`${ev.categoria}-${ev.id}`}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
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
                                  {/* Badge Tipo Evaluación */}
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      padding: '3px 9px',
                                      borderRadius: '6px',
                                      textTransform: 'uppercase',
                                      backgroundColor: isClase ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                      color: isClase ? '#93c5fd' : '#d8b4fe',
                                      border: `1px solid ${isClase ? 'rgba(59, 130, 246, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    {isClase ? <BookOpen size={12} /> : <Award size={12} />}
                                    {isClase ? 'Pauta de Clase' : 'Evaluación Semestral'}
                                  </span>

                                  <span style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                                    {ev.asignaturaNombre || detalle.asignaturaNombre}
                                    {ev.anio && ev.periodo ? ` (${ev.anio}-${ev.periodo})` : ''}
                                  </span>
                                </div>

                                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Calendar size={13} />
                                  <span>{ev.fecha ? ev.fecha.split('T')[0] : 'Fecha no especificada'}</span>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '12px',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>
                                      {ev.evaluadorNombre || 'Evaluador Asignado'}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        padding: '2px 7px',
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
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                      RUT: {ev.evaluadorRut}
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
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '12.5px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                                  }}
                                >
                                  <FileText size={14} /> Ver Evaluación (PDF) <ExternalLink size={12} />
                                </a>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================ */}
            {/* COLUMNA DERECHA: SECCIÓN "ACCIONES" (SUBIR INFORME SEMESTRAL) */}
            {/* ============================================================ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                style={{
                  backgroundColor: '#131e3a',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 28px rgba(0, 0, 0, 0.3)',
                  position: 'sticky',
                  top: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Award size={20} color="#d4af37" />
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                    Acciones
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
                  Gestión del informe semestral del estudiante para esta práctica.
                </p>

                {/* Estado del Informe Actual */}
                <div
                  style={{
                    backgroundColor: detalle.informeActual ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${detalle.informeActual ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Estado del Informe
                    </span>
                    {detalle.informeActual ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#4ade80',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: 'rgba(34, 197, 94, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        <CheckCircle2 size={13} /> Entregado
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#f59e0b',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        <Clock size={13} /> Pendiente
                      </span>
                    )}
                  </div>

                  {detalle.informeActual ? (
                    <div style={{ marginTop: '10px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '13.5px',
                        }}
                      >
                        <FileText size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                        <span style={{ wordBreak: 'break-all' }}>{detalle.informeActual.nombreArchivo}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Entregado el: {detalle.informeActual.fecha || 'Fecha no registrada'}
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <a
                          href={detalle.informeActual.archivoUrl || `/api/practicas/informes/${detalle.informeActual.id}/archivo`}
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
                            fontSize: '12.5px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1d4ed8'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb'
                          }}
                          title="Abrir el informe PDF en una nueva pestaña"
                        >
                          <FileText size={14} /> Ver Informe (PDF) <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>
                      Aún no se ha cargado el informe semestral para este alumno.
                    </div>
                  )}
                </div>

                {/* Subir / Actualizar Informe (Docentes) */}
                {esDocente && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                      {detalle.informeActual ? 'Reemplazar / Actualizar Informe' : 'Subir Informe Semestral'}
                    </div>

                    {/* Input de archivo estilizado */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      id="informe-upload-input"
                    />

                    <label
                      htmlFor="informe-upload-input"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '20px 16px',
                        borderRadius: '12px',
                        border: '2px dashed rgba(255, 255, 255, 0.15)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb'
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <UploadCloud size={28} color="#60a5fa" />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>
                        {selectedFile ? 'Cambiar archivo seleccionado' : 'Seleccionar informe PDF'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Formato permitido: solo PDF (máx. 25MB)
                      </span>
                    </label>

                    {/* Archivo seleccionado preview */}
                    {selectedFile && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(37, 99, 235, 0.15)',
                          border: '1px solid rgba(37, 99, 235, 0.3)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <FileText size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: '600',
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {selectedFile.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#93c5fd' }}>
                              {formatFileSize(selectedFile.size)}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Quitar archivo"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Feedback: Mensaje de Éxito */}
                    {uploadSuccess && (
                      <div
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.35)',
                          color: '#86efac',
                          fontSize: '12.5px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} />
                        <span>{uploadSuccess}</span>
                      </div>
                    )}

                    {/* Feedback: Mensaje de Error */}
                    {uploadError && (
                      <div
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#fca5a5',
                          fontSize: '12.5px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Botón Acción: Subir Informe */}
                    <button
                      onClick={handleUploadInforme}
                      disabled={!selectedFile || isUploading}
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: !selectedFile || isUploading ? 'rgba(37, 99, 235, 0.3)' : '#2563eb',
                        color: !selectedFile || isUploading ? '#94a3b8' : '#ffffff',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
                        boxShadow: !selectedFile || isUploading ? 'none' : '0 4px 16px rgba(37, 99, 235, 0.35)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <UploadCloud size={18} />
                      <span>{isUploading ? 'Subiendo informe...' : 'Subir Informe Semestral'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para Evaluación de Planificación de Clase */}
        {evalModalOpen && planAEvaluar && (
          <div
            style={{
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
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#131e3a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                maxWidth: '520px',
                width: '100%',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  Evaluar Planificación de Clase
                </h3>
                <button
                  onClick={() => setEvalModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '18px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                Planificación para clase del{' '}
                <strong style={{ color: '#ffffff' }}>
                  {planAEvaluar.fechaClase || planAEvaluar.fecha || 'Fecha'}
                </strong>{' '}
                ({planAEvaluar.nombreArchivo || 'archivo.pdf'})
              </p>

              {/* Botones de Decisión */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setNuevoEstado('APROBADA')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${nuevoEstado === 'APROBADA' ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                    backgroundColor: nuevoEstado === 'APROBADA' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    color: nuevoEstado === 'APROBADA' ? '#4ade80' : '#94a3b8',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} /> Aprobar
                </button>

                <button
                  type="button"
                  onClick={() => setNuevoEstado('RECHAZADA')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${nuevoEstado === 'RECHAZADA' ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                    backgroundColor: nuevoEstado === 'RECHAZADA' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    color: nuevoEstado === 'RECHAZADA' ? '#f87171' : '#94a3b8',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={16} /> Solicitar Corrección
                </button>
              </div>

              {/* Observaciones */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    marginBottom: '6px',
                  }}
                >
                  Observaciones y Retroalimentación Pedagógica
                </label>
                <textarea
                  value={observacionTexto}
                  onChange={(e) => setObservacionTexto(e.target.value)}
                  rows={4}
                  placeholder="Ingrese comentarios pedagógicos para el estudiante..."
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEvalModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEvaluacion}
                  disabled={isSubmittingEval}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: nuevoEstado === 'APROBADA' ? '#16a34a' : '#dc2626',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isSubmittingEval ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmittingEval ? 'Guardando...' : 'Guardar Evaluación'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default EstudiantePerfilPracticaPage

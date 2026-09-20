import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { 
  getDetalleInscripcion, 
  uploadInformeForInscripcion, 
  EstudianteDetalleDto, 
  InformeEntregaResponse 
} from '../services/api'
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
  Sparkles
} from 'lucide-react'

export const EstudiantePerfilPracticaPage: React.FC = () => {
  const { inscripcionId } = useParams<{ inscripcionId: string }>()
  const navigate = useNavigate()

  const [detalle, setDetalle] = useState<EstudianteDetalleDto | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Acciones - Subida de Informe
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const cargarDatos = async () => {
    if (!inscripcionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getDetalleInscripcion(Number(inscripcionId))
      setDetalle(data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los datos del estudiante')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [inscripcionId])

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
      // Actualizar estado optimista inmediatamente para reflejar el nuevo informe
      const todayStr = new Date().toISOString().split('T')[0]
      setDetalle((prev) => prev ? {
        ...prev,
        informeActual: {
          id: prev.informeActual?.id || 0,
          archivo: res.nombreArchivo,
          nombreArchivo: res.nombreArchivo,
          fecha: res.fechaEntrega ? res.fechaEntrega.split('T')[0] : todayStr,
          emisor: 'PROFESOR'
        }
      } : prev)
      // Recargar datos para mostrar el nuevo informe registrado
      await cargarDatos()
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Ocurrió un error al subir el informe.')
    } finally {
      setIsUploading(false)
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

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Botón Volver */}
        <button
          onClick={() => {
            if (detalle?.ofertaId) {
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
          <ArrowLeft size={16} /> Volver a la lista de estudiantes
        </button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <p style={{ fontSize: '16px' }}>Cargando perfil del estudiante y detalles de práctica...</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '18px 24px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
              <AlertCircle size={20} />
              <span>No se pudo cargar la información</span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {!loading && !error && detalle && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '24px',
            alignItems: 'start'
          }}>
            {/* ============================================================ */}
            {/* COLUMNA IZQUIERDA: INFORMACIÓN ACADÉMICA, ASIGNACIÓN Y PRÁCTICAS */}
            {/* ============================================================ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Tarjeta 1: Perfil y Datos Personales del Alumno */}
              <div style={{
                backgroundColor: '#131e3a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{
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
                    flexShrink: 0
                  }}>
                    {getInitials(detalle.estudianteNombre)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        Estudiante UBB
                      </span>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0' }}>
                      {detalle.estudianteNombre}
                    </h1>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#94a3b8', fontSize: '13.5px' }}>
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
                <div style={{
                  marginTop: '20px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Carrera</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0', fontWeight: '600', fontSize: '13.5px' }}>
                      <GraduationCap size={16} color="#d4af37" />
                      <span>{detalle.carrera || 'Ingeniería Civil en Informática'}</span>
                    </div>
                  </div>

                  {detalle.profesorGuiaNombre && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Profesor Encargado</div>
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
              <div style={{
                backgroundColor: '#131e3a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Building2 size={20} color="#60a5fa" />
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                    Asignación y Centro de Práctica
                  </h2>
                </div>

                {/* Establecimiento */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    color: '#d4af37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Building2 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Establecimiento Educacional / Centro
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                      {detalle.establecimiento || 'Liceo Bicentenario de Excelencia San Nicolás'}
                    </div>
                  </div>
                </div>

                {/* Evaluadores Asignados */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="#60a5fa" />
                    <span>Evaluadores Asignados</span>
                  </div>

                  {detalle.evaluadores && detalle.evaluadores.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                backgroundColor: isTutor ? 'rgba(37, 99, 235, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                color: isTutor ? '#93c5fd' : '#d8b4fe',
                                border: `1px solid ${isTutor ? 'rgba(37, 99, 235, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`
                              }}>
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
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>
                      No se registran evaluadores asignados para esta práctica actualmente.
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 3: Historial de Prácticas del Estudiante */}
              <div style={{
                backgroundColor: '#131e3a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
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
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              backgroundColor: p.esActual ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              color: p.esActual ? '#60a5fa' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
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

                          {/* Distinción visual clara entre Actual y Anterior */}
                          <div>
                            {p.esActual ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#1d4ed8',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '700',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                boxShadow: '0 2px 10px rgba(29, 78, 216, 0.4)'
                              }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                                Práctica Actual • En Curso
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                color: '#94a3b8',
                                fontSize: '12px',
                                fontWeight: '600',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}>
                                <Clock size={12} />
                                Práctica Histórica • Finalizada
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>
                      No se encontraron prácticas anteriores para este alumno.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* COLUMNA DERECHA: SECCIÓN "ACCIONES" (SUBIR INFORME SEMESTRAL) */}
            {/* ============================================================ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                backgroundColor: '#131e3a',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 28px rgba(0, 0, 0, 0.3)',
                position: 'sticky',
                top: '24px'
              }}>
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
                <div style={{
                  backgroundColor: detalle.informeActual ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${detalle.informeActual ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Estado del Informe
                    </span>
                    {detalle.informeActual ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#4ade80',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        <CheckCircle2 size={13} /> Entregado
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#f59e0b',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        <Clock size={13} /> Pendiente
                      </span>
                    )}
                  </div>

                  {detalle.informeActual ? (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: '600', fontSize: '13.5px' }}>
                        <FileText size={16} color="#60a5fa" />
                        <span style={{ wordBreak: 'break-all' }}>{detalle.informeActual.nombreArchivo}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Entregado el: {detalle.informeActual.fecha || 'Fecha no registrada'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>
                      Aún no se ha cargado el informe semestral para este alumno.
                    </div>
                  )}
                </div>

                {/* Subir / Actualizar Informe */}
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
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(37, 99, 235, 0.15)',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FileText size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '12.5px',
                            fontWeight: '600',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
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
                    <div style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      color: '#86efac',
                      fontSize: '12.5px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  {/* Feedback: Mensaje de Error */}
                  {uploadError && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      fontSize: '12.5px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default EstudiantePerfilPracticaPage

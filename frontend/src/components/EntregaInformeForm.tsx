import React, { useState, useEffect, useRef } from 'react'
import { uploadInformeFinal, getMiInforme, getOfertasForProfesor, OfertaDto, InformeEntregaResponse } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FileText, CheckCircle2, RefreshCw, AlertTriangle, Upload, X, HardDrive, ExternalLink } from 'lucide-react'

export const EntregaInformeForm: React.FC = () => {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [existingSubmission, setExistingSubmission] = useState<InformeEntregaResponse | null>(null)
  const [practicaActual, setPracticaActual] = useState<OfertaDto | null>(null)
  const [isReplacing, setIsReplacing] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar estado inicial del informe (API y fallback localStorage)
  useEffect(() => {
    const fetchCurrentSubmission = async () => {
      setIsLoadingInitial(true)
      let found: InformeEntregaResponse | null = null

      let backendResponded = false

      // 1. Intentar desde el backend con el correo del estudiante
      if (user?.email) {
        try {
          found = await getMiInforme(user.email)
          backendResponded = true
        } catch (err) {
          console.error('Error al consultar informe en backend:', err)
        }

        try {
          const ofertas = await getOfertasForProfesor(user.email)
          if (ofertas && ofertas.length > 0) {
            setPracticaActual(ofertas[0])
          }
        } catch (err) {
          console.error('Error al resolver práctica actual:', err)
        }
      }

      // Si el backend respondió y el estudiante no tiene informe registrado, limpiar datos residuales
      if (backendResponded && !found && user?.id) {
        localStorage.removeItem(`ubb_informe_entrega_${user.id}`)
        localStorage.removeItem('ubb_ultimo_informe_entregado')
      }

      // 2. Fallback desde localStorage SOLO si el backend no pudo responder (sin conexión)
      if (!backendResponded && !found && user?.id) {
        const local = localStorage.getItem(`ubb_informe_entrega_${user.id}`)
        if (local) {
          try {
            found = JSON.parse(local)
          } catch (e) {
            console.error('Error al parsear informe local:', e)
          }
        }
      }

      if (found) {
        setExistingSubmission(found)
        setIsReplacing(false)
      } else {
        setExistingSubmission(null)
        setIsReplacing(true)
      }
      setIsLoadingInitial(false)
    }

    fetchCurrentSubmission()
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      // Validación estricta en cliente: solo PDF
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Formato no válido. Únicamente se permiten archivos en formato PDF (.pdf).')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // Límite de 20MB
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage('El archivo excede el tamaño máximo permitido de 20MB.')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setErrorMessage('Por favor, selecciona tu archivo PDF antes de enviar.')
      return
    }

    setIsUploading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await uploadInformeFinal(selectedFile, user?.id, user?.email)

      // Guardar y sincronizar por usuario
      setExistingSubmission(response)
      if (user?.id) {
        localStorage.setItem(`ubb_informe_entrega_${user.id}`, JSON.stringify(response))
      }
      localStorage.removeItem('ubb_ultimo_informe_entregado')

      setSuccessMessage(response.mensaje || '¡Informe final de práctica entregado con éxito!')
      setSelectedFile(null)
      setIsReplacing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message || 'Error al conectar con el servidor.'
      setErrorMessage(serverMsg)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatFecha = (isoString?: string): string => {
    if (!isoString) return 'Recientemente'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  if (isLoadingInitial) {
    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          <div style={styles.spinnerDark}></div>
          <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>Cargando estado de entrega...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.badge}>Proceso de Práctica</div>
        <h2 style={styles.title}>Entrega de Informe Final</h2>
        <p style={styles.subtitle}>
          Límite de entrega: <strong>1 archivo</strong>. Si ya has enviado tu informe, puedes visualizarlo y reemplazarlo si necesitas corregirlo.
        </p>

        {practicaActual && (
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px',
            color: '#1e40af',
            textAlign: 'left'
          }}>
            <span>
              <strong>Práctica Actual:</strong> {practicaActual.asignaturaNombre} ({practicaActual.anio}-{practicaActual.periodo})
            </span>
            {practicaActual.profesorNombre && (
              <span style={{ color: '#64748b', fontSize: '11.5px' }}>
                Docente: {practicaActual.profesorNombre}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alerta de Éxito reciente */}
      {successMessage && (
        <div style={styles.successAlert}>
          <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Alerta de Error */}
      {errorMessage && (
        <div style={styles.errorAlert}>
          <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* VISTA 1: Ya existe una entrega y no está en modo reemplazo */}
      {existingSubmission && !isReplacing ? (
        <div style={styles.existingBox}>
          <div style={styles.statusRow}>
            <span style={styles.statusPill}>
              <CheckCircle2 size={15} /> Entrega Realizada (1/1)
            </span>
            <span style={styles.limitTag}>Límite alcanzado</span>
          </div>

          <div style={styles.fileDetailCard}>
            <div style={styles.fileIconWrap}>
              <FileText size={32} color="#2563eb" />
            </div>
            <div style={styles.fileMetaWrap}>
              <div style={styles.existingFileName}>
                {existingSubmission.nombreArchivo}
              </div>
              <div style={styles.fileMetaDetails}>
                <span style={styles.metaItem}>
                  <HardDrive size={14} /> {formatFileSize(existingSubmission.tamanoBytes)}
                </span>
                <span style={styles.metaDivider}>•</span>
                <span>Entregado: {formatFecha(existingSubmission.fechaEntrega)}</span>
              </div>
            </div>
          </div>

          {/* Acciones para el informe actual */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            {existingSubmission.archivoUrl && (
              <a
                href={existingSubmission.archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.viewPdfButton}
              >
                <ExternalLink size={16} /> Ver Mi Informe (PDF)
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setIsReplacing(true)
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
              style={styles.replaceButton}
            >
              <RefreshCw size={16} /> Reemplazar Entrega de Informe
            </button>
          </div>

          <div style={styles.infoNote}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d', lineHeight: 1.5 }}>
              💡 Si necesitas realizar una corrección o subir una versión actualizada, presiona <strong>"Reemplazar Entrega de Informe"</strong>.
            </p>
          </div>
        </div>
      ) : (
        /* VISTA 2: Formulario de Subida o Reemplazo */
        <form onSubmit={handleSubmit} style={styles.form}>
          {existingSubmission && (
            <div style={styles.replaceWarning}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#92400e', lineHeight: 1.5 }}>
                ⚠️ <strong>Modo de reemplazo activo:</strong> Al subir un nuevo archivo, este reemplazará tu entrega previa (<em>{existingSubmission.nombreArchivo}</em>).
              </p>
            </div>
          )}

          {/* Zona Drag & Drop */}
          <div
            style={{
              ...styles.dropzone,
              borderColor: selectedFile ? '#2563eb' : '#cbd5e1',
              backgroundColor: selectedFile ? '#eff6ff' : '#f8fafc',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf,.pdf"
              style={{ display: 'none' }}
            />

            <div style={styles.iconContainer}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: selectedFile ? '#dbeafe' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                {selectedFile ? (
                  <FileText size={24} color="#2563eb" />
                ) : (
                  <Upload size={24} color="#64748b" />
                )}
              </div>
            </div>

            {selectedFile ? (
              <div>
                <p style={styles.fileName}>📄 {selectedFile.name}</p>
                <p style={styles.fileSize}>{formatFileSize(selectedFile.size)} - Listo para guardar</p>
                <span style={styles.changeFileBtn}>Hacer clic para elegir otro archivo</span>
              </div>
            ) : (
              <div>
                <p style={styles.uploadPrompt}>
                  <strong>Haz clic aquí</strong> o arrastra tu archivo PDF
                </p>
                <p style={styles.fileHint}>Formato permitido: solo .pdf (Máx. 20MB)</p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div style={styles.actionRow}>
            {existingSubmission && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  setIsReplacing(false)
                  setErrorMessage(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                style={styles.cancelButton}
                disabled={isUploading}
              >
                <X size={16} /> Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              style={{
                ...styles.button,
                flex: existingSubmission ? 2 : 1,
                opacity: (!selectedFile || isUploading) ? 0.6 : 1,
                cursor: (!selectedFile || isUploading) ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? (
                <span style={styles.loadingWrapper}>
                  <span style={styles.spinner}></span>
                  {existingSubmission ? 'Reemplazando informe...' : 'Entregando informe...'}
                </span>
              ) : existingSubmission ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <RefreshCw size={18} /> Confirmar y Reemplazar Informe
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Upload size={18} /> Entregar Informe Final
                </span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    maxWidth: '620px',
    margin: '30px auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  title: {
    fontSize: '1.5rem',
    color: '#0f172a',
    margin: '0 0 8px 0',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '0.92rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  existingBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  limitTag: {
    fontSize: '0.8rem',
    color: '#64748b',
    backgroundColor: '#f8fafc',
    padding: '4px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  fileDetailCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  fileIconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileMetaWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
  },
  existingFileName: {
    fontWeight: 600,
    color: '#1e293b',
    fontSize: '1rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileMetaDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '0.83rem',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  metaDivider: {
    color: '#cbd5e1',
  },
  infoNote: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  viewPdfButton: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    color: '#2563eb',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '14px 18px',
    fontSize: '0.95rem',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  replaceButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 18px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  replaceWarning: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  dropzone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '36px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  iconContainer: {
    marginBottom: '8px',
  },
  uploadPrompt: {
    margin: '0 0 4px 0',
    color: '#334155',
    fontSize: '1rem',
  },
  fileHint: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  fileName: {
    margin: '0 0 4px 0',
    fontWeight: 600,
    color: '#1e293b',
    fontSize: '1rem',
  },
  fileSize: {
    margin: '0 0 8px 0',
    fontSize: '0.85rem',
    color: '#64748b',
  },
  changeFileBtn: {
    fontSize: '0.82rem',
    color: '#2563eb',
    textDecoration: 'underline',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '14px 18px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 20px',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'background-color 0.2s ease',
  },
  loadingWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#ffffff',
    animation: 'spin 1s ease-in-out infinite',
  },
  spinnerDark: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    border: '3px solid rgba(37, 99, 235, 0.2)',
    borderRadius: '50%',
    borderTopColor: '#2563eb',
    animation: 'spin 1s ease-in-out infinite',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.9rem',
    marginBottom: '16px',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
    fontSize: '0.95rem',
    marginBottom: '16px',
  },
}

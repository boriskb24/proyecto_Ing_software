import React, { useState, useRef } from 'react'
import { uploadInformeFinal, InformeEntregaResponse } from '../services/api'
import { useAuth } from '../context/AuthContext'

export const EntregaInformeForm: React.FC = () => {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<InformeEntregaResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    setSuccessData(null)

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validación en cliente: formato estricto PDF
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Formato no válido. Únicamente se permiten archivos en formato PDF (.pdf).')
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
      setErrorMessage('Por favor, selecciona tu informe final en PDF antes de enviar.')
      return
    }

    setIsUploading(true)
    setErrorMessage(null)
    setSuccessData(null)

    try {
      const response = await uploadInformeFinal(selectedFile)
      setSuccessData(response)
      if (user?.id) {
        localStorage.setItem(`ubb_informe_entrega_${user.id}`, JSON.stringify(response))
      }
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message || 'Error al conectar con el servidor.'
      setErrorMessage(serverMsg)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.badge}>Proceso de Práctica</div>
        <h2 style={styles.title}>Entrega de Informe Final</h2>
        <p style={styles.subtitle}>
          Sube tu informe final de práctica profesional en formato <strong>PDF</strong> para completar formalmente tu proceso.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Input file area */}
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>

          {selectedFile ? (
            <div>
              <p style={styles.fileName}>📄 {selectedFile.name}</p>
              <p style={styles.fileSize}>{formatFileSize(selectedFile.size)} - Listo para entregar</p>
              <span style={styles.changeFileBtn}>Hacer clic para cambiar archivo</span>
            </div>
          ) : (
            <div>
              <p style={styles.uploadPrompt}>
                <strong>Haz clic aquí</strong> para seleccionar tu archivo PDF
              </p>
              <p style={styles.fileHint}>Solo archivos .pdf (Máx 20MB)</p>
            </div>
          )}
        </div>

        {/* Feedback: Error */}
        {errorMessage && (
          <div style={styles.errorAlert}>
            <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Feedback: Exito */}
        {successData && (
          <div style={styles.successAlert}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>✅</div>
            <strong>{successData.mensaje}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Archivo recibido: <em>{successData.nombreArchivo}</em> ({formatFileSize(successData.tamanoBytes)})
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          style={{
            ...styles.button,
            opacity: (!selectedFile || isUploading) ? 0.6 : 1,
            cursor: (!selectedFile || isUploading) ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? (
            <span style={styles.loadingWrapper}>
              <span style={styles.spinner}></span> Enviando informe...
            </span>
          ) : (
            'Entregar Informe Final'
          )}
        </button>
      </form>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    maxWidth: '560px',
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
  },
  title: {
    fontSize: '1.5rem',
    color: '#0f172a',
    margin: '0 0 8px 0',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  dropzone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '32px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  iconContainer: {
    marginBottom: '12px',
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
    fontSize: '0.8rem',
    color: '#2563eb',
    textDecoration: 'underline',
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
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.9rem',
  },
  successAlert: {
    textAlign: 'center',
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
    fontSize: '0.95rem',
  },
}

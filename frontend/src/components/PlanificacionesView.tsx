import React, { useState, useEffect, useRef } from 'react';
import { uploadPlanificacion, getPlanificaciones, Planificacion } from '../services/api';

export const PlanificacionesView: React.FC = () => {
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar historial de planificaciones al montar el componente
  const cargarPlanificaciones = async () => {
    try {
      setIsLoadingList(true);
      const data = await getPlanificaciones();
      setPlanificaciones(data);
    } catch (err: any) {
      setErrorMessage('No se pudo cargar el historial de planificaciones.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    cargarPlanificaciones();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validación estricta de formato PDF en cliente
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Formato no válido. Únicamente se permiten archivos en formato PDF (.pdf).');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setErrorMessage('Por favor, selecciona un archivo antes de presionar subir.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nuevaPlanificacion = await uploadPlanificacion(selectedFile);
      setSuccessMessage(`¡Planificación "${nuevaPlanificacion.nombreArchivo}" subida con éxito!`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Actualización automática e inmediata de la UI
      setPlanificaciones((prev) => [nuevaPlanificacion, ...prev]);
    } catch (err: any) {
      const msg = err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Error al intentar subir el archivo.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '-';
    const date = new Date(fechaStr);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <span style={styles.badge}>Centro de Documentos</span>
        <h1 style={styles.title}>Mis Planificaciones de Clase</h1>
        <p style={styles.subtitle}>
          Sube tus archivos de planificación en un solo lugar y accede a tu historial completo cuando lo necesites.
        </p>
      </header>

      {/* Sección de Subida */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Subir Nueva Planificación</h2>
        <form onSubmit={handleUpload} style={styles.form}>
          <div
            style={{
              ...styles.dropzone,
              borderColor: selectedFile ? '#3b82f6' : '#cbd5e1',
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
            <div style={styles.uploadIcon}>📁</div>
            {selectedFile ? (
              <div>
                <p style={styles.selectedFileName}>📄 {selectedFile.name}</p>
                <span style={styles.changeText}>Hacer clic para cambiar archivo</span>
              </div>
            ) : (
              <div>
                <p style={styles.dropzonePrompt}>
                  <strong>Haz clic aquí</strong> para seleccionar tu archivo de planificación en PDF
                </p>
                <p style={styles.dropzoneHint}>Solo se admiten documentos en formato PDF (.pdf)</p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div style={styles.errorAlert}>
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={styles.successAlert}>
              ✅ {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            style={{
              ...styles.submitBtn,
              opacity: !selectedFile || isUploading ? 0.6 : 1,
              cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            {isUploading ? 'Subiendo archivo...' : 'Subir Planificación'}
          </button>
        </form>
      </section>

      {/* Sección de Historial */}
      <section style={styles.card}>
        <div style={styles.historyHeader}>
          <h2 style={styles.cardTitle}>Historial de Planificaciones Subidas</h2>
          <span style={styles.countBadge}>{planificaciones.length} archivos</span>
        </div>

        {isLoadingList ? (
          <div style={styles.emptyState}>Cargando planificaciones...</div>
        ) : planificaciones.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#64748b' }}>
              No has subido ninguna planificación aún.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre del Archivo</th>
                  <th style={styles.th}>Tipo / Formato</th>
                  <th style={styles.th}>Fecha de Subida</th>
                </tr>
              </thead>
              <tbody>
                {planificaciones.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.tdPrimary}>
                      <span style={{ marginRight: '8px' }}>📄</span>
                      <strong>{item.nombreArchivo}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>{item.tipoArchivo || 'Documento'}</span>
                    </td>
                    <td style={styles.td}>{formatearFecha(item.fechaCreacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
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
    fontSize: '1.85rem',
    color: '#0f172a',
    margin: '0 0 8px 0',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '28px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#1e293b',
    marginTop: 0,
    marginBottom: '16px',
    fontWeight: 600,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dropzone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '28px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  uploadIcon: {
    fontSize: '2.5rem',
    marginBottom: '8px',
  },
  dropzonePrompt: {
    margin: '0 0 4px 0',
    color: '#334155',
  },
  dropzoneHint: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  selectedFileName: {
    margin: '0 0 4px 0',
    fontWeight: 600,
    color: '#1e293b',
  },
  changeText: {
    fontSize: '0.8rem',
    color: '#2563eb',
    textDecoration: 'underline',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    border: '1px solid #fecaca',
  },
  successAlert: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    border: '1px solid #bbf7d0',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  countBadge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    color: '#94a3b8',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    padding: '12px 16px',
    fontSize: '0.85rem',
    fontWeight: 600,
    borderBottom: '1px solid #e2e8f0',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '0.9rem',
    color: '#475569',
  },
  tdPrimary: {
    padding: '14px 16px',
    fontSize: '0.95rem',
    color: '#0f172a',
  },
  typeBadge: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
};

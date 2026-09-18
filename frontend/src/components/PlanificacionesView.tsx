import React, { useState, useEffect, useRef } from 'react';
import { uploadPlanificacion, getPlanificaciones, evaluarPlanificacion, Planificacion } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PlanificacionesView: React.FC = () => {
  const { user } = useAuth();

  // Roles y permisos RBAC
  const esDocente = user?.role === 'Profesor' || user?.role === 'Administrador' || user?.role === 'Evaluador';
  const esEstudiante = user?.role === 'Estudiante' || !esDocente;

  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar historial con filtro RBAC (userId y role)
  const cargarPlanificaciones = async () => {
    try {
      setIsLoadingList(true);
      const data = await getPlanificaciones(user?.id, user?.role);
      setPlanificaciones(data);
    } catch (err: any) {
      setErrorMessage('No se pudo cargar el historial de planificaciones.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) {
      cargarPlanificaciones();
    }
  }, [user]);

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
      const nuevaPlanificacion = await uploadPlanificacion(selectedFile, user?.id);
      setSuccessMessage(`¡Planificación "${nuevaPlanificacion.nombreArchivo || 'PDF'}" subida con éxito!`);
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

  // Acción para Profesores/Evaluadores: Aprobar o Rechazar
  const handleEvaluar = async (id: number, estado: 'APROBADA' | 'RECHAZADA') => {
    const retro = prompt(`Ingrese observaciones o retroalimentación para marcar como ${estado}:`) || '';
    try {
      setEvaluatingId(id);
      const actualizada = await evaluarPlanificacion(id, estado, retro);
      setPlanificaciones((prev) =>
        prev.map((item) => (item.id === id ? actualizada : item))
      );
      setSuccessMessage(`Planificación #${id} marcada como ${estado}.`);
    } catch (err: any) {
      setErrorMessage('Error al actualizar el estado de la planificación.');
    } finally {
      setEvaluatingId(null);
    }
  };

  // Formateador dinámico y preciso con Intl.DateTimeFormat
  const formatearFecha = (fechaStr?: string): string => {
    if (!fechaStr) return '-';
    try {
      const date = new Date(fechaStr);
      if (isNaN(date.getTime())) return fechaStr;

      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return fechaStr;
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <span style={styles.badge}>Centro de Documentos</span>
        <h1 style={styles.title}>
          {esDocente ? 'Gestión y Revisión de Planificaciones' : 'Mis Planificaciones de Clase'}
        </h1>
        <p style={styles.subtitle}>
          {esDocente
            ? `Panel docente de supervisión. Conectado como: ${user?.fullName} (${user?.role})`
            : `Sube tus archivos de planificación en PDF y revisa su estado de aprobación.`}
        </p>
      </header>

      {/* Sección de Subida: Solo para Estudiantes */}
      {esEstudiante && (
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
      )}

      {/* Sección de Historial RBAC */}
      <section style={styles.card}>
        <div style={styles.historyHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              {esDocente ? 'Todas las Planificaciones de Estudiantes' : 'Historial de Planificaciones Subidas'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {esDocente
                ? 'Listado general con privilegios de evaluación y retroalimentación.'
                : 'Mostrando únicamente los archivos subidos por tu cuenta.'}
            </p>
          </div>
          <span style={styles.countBadge}>{planificaciones.length} archivos</span>
        </div>

        {isLoadingList ? (
          <div style={styles.emptyState}>Cargando planificaciones...</div>
        ) : planificaciones.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#64748b' }}>
              {esDocente
                ? 'No hay planificaciones entregadas por estudiantes aún.'
                : 'No has subido ninguna planificación aún.'}
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Nombre del Archivo</th>
                  {esDocente && <th style={styles.th}>Estudiante</th>}
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha y Hora</th>
                  <th style={styles.th}>Retroalimentación</th>
                  {esDocente && <th style={styles.th}>Acciones Docente</th>}
                </tr>
              </thead>
              <tbody>
                {planificaciones.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>#{item.id}</td>
                    <td style={styles.tdPrimary}>
                      <span style={{ marginRight: '8px' }}>📄</span>
                      <strong>{item.nombreArchivo || item.archivo?.split('/').pop() || `Planificación #${item.id}`}</strong>
                    </td>
                    {esDocente && (
                      <td style={styles.td}>
                        {item.usuario ? (
                          <div>
                            <strong>{item.usuario.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.usuario.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Estudiante UBB</span>
                        )}
                      </td>
                    )}
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: item.estado === 'APROBADA' ? '#dcfce7' : item.estado === 'RECHAZADA' ? '#fee2e2' : '#fef3c7',
                        color: item.estado === 'APROBADA' ? '#166534' : item.estado === 'RECHAZADA' ? '#991b1b' : '#92400e',
                      }}>
                        {item.estado || 'PENDIENTE'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatearFecha(item.fecha || item.fechaCreacion || '')}</td>
                    <td style={styles.td}>
                      {item.retroalimentacion ? (
                        <span style={{ color: '#334155', fontStyle: 'italic' }}>💬 "{item.retroalimentacion}"</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Sin observaciones</span>
                      )}
                    </td>

                    {/* Botones de acción exclusivos para Profesor / Evaluador */}
                    {esDocente && (
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={evaluatingId === item.id}
                            onClick={() => handleEvaluar(item.id, 'APROBADA')}
                            style={{ ...styles.actionBtn, backgroundColor: '#16a34a' }}
                            title="Aprobar planificación"
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={evaluatingId === item.id}
                            onClick={() => handleEvaluar(item.id, 'RECHAZADA')}
                            style={{ ...styles.actionBtn, backgroundColor: '#dc2626' }}
                            title="Rechazar planificación"
                          >
                            ✗ Rechazar
                          </button>
                        </div>
                      </td>
                    )}
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
    maxWidth: '1050px',
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
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#1e293b',
    margin: '0 0 16px 0',
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
    padding: '32px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  uploadIcon: {
    fontSize: '2.5rem',
    marginBottom: '8px',
  },
  dropzonePrompt: {
    fontSize: '1rem',
    color: '#334155',
    margin: '0 0 4px 0',
  },
  dropzoneHint: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: 0,
  },
  selectedFileName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 4px 0',
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
  actionBtn: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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
    fontSize: '0.9rem',
    color: '#0f172a',
  },
  typeBadge: {
    display: 'inline-block',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
};

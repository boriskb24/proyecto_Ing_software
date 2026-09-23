import React, { useState, useEffect, useRef } from 'react';
import { uploadPlanificacion, getPlanificaciones, evaluarPlanificacion, Planificacion } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Users, Filter, X, ExternalLink } from 'lucide-react';

export const PlanificacionesView: React.FC = () => {
  const { user } = useAuth();

  // Roles y permisos RBAC
  const esDocente = user?.role === 'Profesor' || user?.role === 'Administrador' || user?.role === 'Evaluador';
  const esEstudiante = user?.role === 'Estudiante' || !esDocente;

  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fechaClase, setFechaClase] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para filtros
  const [filtroEstudiante, setFiltroEstudiante] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // Estados para modal de evaluación y observaciones
  const [evalModalOpen, setEvalModalOpen] = useState<boolean>(false);
  const [planificacionAEvaluar, setPlanificacionAEvaluar] = useState<Planificacion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [observacionTexto, setObservacionTexto] = useState<string>('');
  const [isSubmittingEval, setIsSubmittingEval] = useState<boolean>(false);

  // Cargar historial con filtro RBAC (userId, role y email)
  const cargarPlanificaciones = async () => {
    try {
      setIsLoadingList(true);
      const data = await getPlanificaciones(user?.id, user?.role, user?.email);
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

    if (!fechaClase) {
      setErrorMessage('Por favor, ingresa la fecha de la clase que estás planificando.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nuevaPlanificacion = await uploadPlanificacion(selectedFile, user?.id, fechaClase);
      setSuccessMessage(`¡Planificación "${nuevaPlanificacion.nombreArchivo || 'PDF'}" subida con éxito!`);
      setSelectedFile(null);
      setFechaClase('');
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

  // Abrir ventana modal para dar observación y evaluar
  const abrirModalEvaluar = (item: Planificacion, estadoInicial?: 'APROBADA' | 'RECHAZADA') => {
    const estado = estadoInicial || (item.estado === 'RECHAZADA' ? 'RECHAZADA' : 'APROBADA');
    setPlanificacionAEvaluar(item);
    setNuevoEstado(estado);
    setObservacionTexto(
      item.retroalimentacion ||
      (estado === 'APROBADA'
        ? 'Planificación revisada y aprobada conforme a los objetivos de la asignatura.'
        : 'Se solicitan correcciones en el cronograma y actividades antes de la aprobación.')
    );
    setEvalModalOpen(true);
  };

  const cerrarModalEvaluar = () => {
    setEvalModalOpen(false);
    setPlanificacionAEvaluar(null);
    setObservacionTexto('');
  };

  const confirmarEvaluacion = async () => {
    if (!planificacionAEvaluar) return;
    setIsSubmittingEval(true);
    try {
      const actualizada = await evaluarPlanificacion(
        planificacionAEvaluar.id,
        nuevoEstado,
        observacionTexto.trim(),
        user?.email
      );
      setPlanificaciones((prev) =>
        prev.map((item) =>
          item.id === planificacionAEvaluar.id
            ? { ...item, estado: actualizada.estado, retroalimentacion: actualizada.retroalimentacion }
            : item
        )
      );
      setSuccessMessage(`Planificación #${planificacionAEvaluar.id} marcada como ${nuevoEstado} con su retroalimentación.`);
      cerrarModalEvaluar();
      await cargarPlanificaciones();
    } catch (err: any) {
      setErrorMessage('Error al registrar la evaluación y observaciones.');
    } finally {
      setIsSubmittingEval(false);
    }
  };

  // Limpiar el prefijo UUID para una presentación limpia del archivo
  const limpiarNombreArchivo = (nombre?: string): string => {
    if (!nombre) return '';
    return nombre.replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_/i, '');
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

  // Formateador de fecha de la clase (LocalDate YYYY-MM-DD)
  const formatearFechaClase = (fechaStr?: string): string => {
    if (!fechaStr) return 'No definida';
    try {
      const parts = fechaStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return new Intl.DateTimeFormat('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(date);
      }
      const date = new Date(fechaStr);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(date);
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  };

  // Extraer lista única de estudiantes para el filtro
  const listaEstudiantesUnicos = Array.from(
    new Set(
      planificaciones
        .map((p) => p.usuario?.fullName)
        .filter((name): name is string => Boolean(name && name.trim()))
    )
  ).sort();

  // Filtrado reactivo en tiempo real
  const planificacionesFiltradas = planificaciones.filter((item) => {
    // 1. Filtro por selector de estudiante
    if (filtroEstudiante !== 'TODOS') {
      if (item.usuario?.fullName !== filtroEstudiante) {
        return false;
      }
    }

    // 2. Filtro por selector de estado
    if (filtroEstado !== 'TODOS') {
      const estadoActual = item.estado || 'PENDIENTE';
      if (estadoActual !== filtroEstado) {
        return false;
      }
    }

    // 3. Filtro por texto de búsqueda (nombre, correo, nombre archivo, retroalimentación)
    if (busquedaTexto.trim()) {
      const q = busquedaTexto.toLowerCase();
      const matchNombre = (item.usuario?.fullName || '').toLowerCase().includes(q);
      const matchEmail = (item.usuario?.email || '').toLowerCase().includes(q);
      const matchArchivo = (item.nombreArchivo || item.archivo || '').toLowerCase().includes(q);
      const matchRetro = (item.retroalimentacion || '').toLowerCase().includes(q);
      if (!matchNombre && !matchEmail && !matchArchivo && !matchRetro) {
        return false;
      }
    }

    return true;
  });

  const hayFiltrosActivos = filtroEstudiante !== 'TODOS' || filtroEstado !== 'TODOS' || busquedaTexto.trim().length > 0;

  return (
    <div style={{ ...styles.container, maxWidth: esDocente ? '1440px' : '1200px' }}>
      <header style={styles.header}>
        <span style={styles.badge}>Centro de Documentos</span>
        <h1 style={styles.title}>
          {esDocente ? 'Gestión y Revisión de Planificaciones' : 'Mis Planificaciones de Clase'}
        </h1>
        <p style={styles.subtitle}>
          {esDocente ? (
            <>
              Panel docente de supervisión. Conectado como:{' '}
              <strong style={{ color: '#fbbf24', fontWeight: 600 }}>{user?.fullName}</strong>{' '}
              <span style={{ color: '#93c5fd', backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                {user?.role}
              </span>
            </>
          ) : (
            'Sube tus archivos de planificación en PDF y revisa su estado de aprobación.'
          )}
        </p>
      </header>

      {/* Sección de Subida: Solo para Estudiantes */}
      {esEstudiante && (
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Subir Nueva Planificación</h2>
          <form onSubmit={handleUpload} style={styles.form}>
            {/* Campo obligatorio: Fecha de la clase planificada */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📅 Fecha de la Clase Planificada:</span>
                <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>* Obligatorio</span>
              </label>
              <input
                type="date"
                required
                value={fechaClase}
                onChange={(e) => setFechaClase(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  maxWidth: '260px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Ingresa la fecha en la que se impartirá esta clase. El botón de subida permanecerá desactivado hasta que indiques la fecha y selecciones el archivo.
              </span>
            </div>

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
              disabled={!selectedFile || !fechaClase || isUploading}
              style={{
                ...styles.submitBtn,
                opacity: !selectedFile || !fechaClase || isUploading ? 0.6 : 1,
                cursor: !selectedFile || !fechaClase || isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? 'Subiendo archivo...' : 'Subir Planificación'}
            </button>
          </form>
        </section>
      )}

      {/* Sección de Historial RBAC */}
      <section style={styles.card}>
        {/* Barra de Filtros interactiva */}
        {!isLoadingList && planificaciones.length > 0 && (
          <div style={styles.filterToolbar}>
            {/* Buscador de texto */}
            <div style={styles.searchBox}>
              <Search size={16} color="#64748b" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar por estudiante, archivo o nota..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                style={styles.searchInput}
              />
              {busquedaTexto && (
                <button
                  type="button"
                  onClick={() => setBusquedaTexto('')}
                  style={styles.clearSearchBtn}
                  title="Borrar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtro por Estudiante (Visible para roles docentes o cuando hay múltiples estudiantes) */}
            {esDocente && listaEstudiantesUnicos.length > 0 && (
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <Users size={14} style={{ marginRight: '4px' }} /> Estudiante:
                </label>
                <select
                  value={filtroEstudiante}
                  onChange={(e) => setFiltroEstudiante(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="TODOS">Todos los Estudiantes ({listaEstudiantesUnicos.length})</option>
                  {listaEstudiantesUnicos.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Estado */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                <Filter size={14} style={{ marginRight: '4px' }} /> Estado:
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={styles.selectInput}
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE">⏳ Pendientes</option>
                <option value="APROBADA">✅ Aprobadas</option>
                <option value="RECHAZADA">❌ Rechazadas</option>
              </select>
            </div>

            {/* Botón para resetear filtros si hay alguno activo */}
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={() => {
                  setFiltroEstudiante('TODOS');
                  setFiltroEstado('TODOS');
                  setBusquedaTexto('');
                }}
                style={styles.resetFiltersBtn}
                title="Restablecer todos los filtros"
              >
                Limpiar filtros
              </button>
            )}

            {/* Contador de resultados */}
            <div style={{ marginLeft: 'auto' }}>
              <span style={styles.countBadge}>
                {planificacionesFiltradas.length} de {planificaciones.length} archivos
              </span>
            </div>
          </div>
        )}

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
        ) : planificacionesFiltradas.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#64748b' }}>
              No se encontraron planificaciones que coincidan con los filtros aplicados.
            </p>
            <button
              type="button"
              onClick={() => {
                setFiltroEstudiante('TODOS');
                setFiltroEstado('TODOS');
                setBusquedaTexto('');
              }}
              style={{ ...styles.submitBtn, marginTop: '12px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, minWidth: esDocente ? '180px' : '220px' }}>Archivo</th>
                  {esDocente && <th style={{ ...styles.th, minWidth: '180px' }}>Estudiante</th>}
                  <th style={{ ...styles.th, width: '110px', textAlign: 'center' }}>Estado</th>
                  <th style={{ ...styles.th, width: '135px' }}>Fecha de Clase</th>
                  <th style={{ ...styles.th, width: '130px' }}>Fecha de Subida</th>
                  <th style={{ ...styles.th, minWidth: esDocente ? '240px' : '200px' }}>Retroalimentación</th>
                  {esDocente && <th style={{ ...styles.th, width: '100px', textAlign: 'center' }}>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {planificacionesFiltradas.map((item) => {
                  const rawName = item.nombreArchivo || item.archivo?.split('/').pop() || `Planificación #${item.id}`;
                  const displayName = limpiarNombreArchivo(rawName);

                  return (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.tdPrimary}>
                        <a
                          href={item.archivoUrl || `/api/planificaciones/${item.id}/archivo`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                            color: '#1d4ed8',
                            cursor: 'pointer',
                          }}
                          title={`Haga clic para ver o descargar la planificación "${rawName}"`}
                        >
                          <span style={{ flexShrink: 0, fontSize: '1rem' }}>📄</span>
                          <span style={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: esDocente ? '230px' : '280px',
                            display: 'inline-block',
                            textDecoration: 'underline',
                          }}>
                            {displayName}
                          </span>
                          <ExternalLink size={13} style={{ flexShrink: 0, color: '#2563eb' }} />
                        </a>
                      </td>
                      {esDocente && (
                        <td style={styles.td}>
                          {item.usuario?.fullName ? (
                            <div style={{ maxWidth: '240px' }}>
                              <div
                                style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title={item.usuario.fullName}
                              >
                                {item.usuario.fullName}
                              </div>
                              {item.usuario.email && (
                                <div
                                  style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                  title={item.usuario.email}
                                >
                                  {item.usuario.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 500 }}>
                              {item.usuario?.email || 'Estudiante'}
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: item.estado === 'APROBADA' ? '#dcfce7' : item.estado === 'RECHAZADA' ? '#fee2e2' : '#fef3c7',
                          color: item.estado === 'APROBADA' ? '#166534' : item.estado === 'RECHAZADA' ? '#991b1b' : '#92400e',
                        }}>
                          {item.estado || 'PENDIENTE'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                        {item.fechaClase ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 600,
                            color: '#1d4ed8',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                          }}>
                            {formatearFechaClase(item.fechaClase)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            No asignada
                          </span>
                        )}
                      </td>
                      <td style={{ ...styles.td, fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatearFecha(item.fecha || item.fechaCreacion || '')}
                      </td>
                      <td style={styles.td}>
                        {item.retroalimentacion ? (
                          <div
                            style={{
                              maxWidth: esDocente ? '280px' : '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#334155',
                              fontStyle: 'italic',
                              fontSize: '0.8rem',
                            }}
                            title={item.retroalimentacion}
                          >
                            💬 "{item.retroalimentacion}"
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sin observaciones</span>
                        )}
                      </td>

                      {/* Botón de acción único para Profesor / Evaluador */}
                      {esDocente && (
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => abrirModalEvaluar(item)}
                            style={{
                              ...styles.actionBtn,
                              backgroundColor: '#2563eb',
                              padding: '6px 14px',
                            }}
                            title="Revisar, ingresar observaciones y evaluar planificación"
                          >
                            Evaluar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Ventana Emergente de Evaluación y Observaciones */}
      {evalModalOpen && planificacionAEvaluar && (
        <div style={styles.modalBackdrop} onClick={cerrarModalEvaluar}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.35rem' }}>📝</span>
                <div>
                  <h3 style={styles.modalTitle}>Revisión y Observaciones</h3>
                  <p style={styles.modalSubtitle}>Planificación #{planificacionAEvaluar.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarModalEvaluar}
                style={styles.modalCloseBtn}
                title="Cerrar ventana"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Modal */}
            <div style={styles.modalBody}>
              {/* Resumen del documento */}
              <div style={styles.modalInfoBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Estudiante:</span>
                  <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>
                    {planificacionAEvaluar.usuario?.fullName || 'Estudiante'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Correo:</span>
                  <span style={{ color: '#2563eb', fontSize: '0.8rem' }}>
                    {planificacionAEvaluar.usuario?.email || '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Documento:</span>
                  <a
                    href={planificacionAEvaluar.archivoUrl || `/api/planificaciones/${planificacionAEvaluar.id}/archivo`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#2563eb',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      maxWidth: '260px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline',
                    }}
                    title={`Abrir "${planificacionAEvaluar.nombreArchivo || planificacionAEvaluar.archivo || ''}" en nueva pestaña`}
                  >
                    📄 {limpiarNombreArchivo(planificacionAEvaluar.nombreArchivo || planificacionAEvaluar.archivo || '')} <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Selector de Estado */}
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.modalInputLabel}>Decisión de Evaluación:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('APROBADA')}
                    style={{
                      ...styles.modalStateOption,
                      backgroundColor: nuevoEstado === 'APROBADA' ? '#dcfce7' : '#f8fafc',
                      borderColor: nuevoEstado === 'APROBADA' ? '#16a34a' : '#cbd5e1',
                      color: nuevoEstado === 'APROBADA' ? '#166534' : '#475569',
                      fontWeight: nuevoEstado === 'APROBADA' ? 700 : 500,
                    }}
                  >
                    <span>✓</span> Aprobar Planificación
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('RECHAZADA')}
                    style={{
                      ...styles.modalStateOption,
                      backgroundColor: nuevoEstado === 'RECHAZADA' ? '#fee2e2' : '#f8fafc',
                      borderColor: nuevoEstado === 'RECHAZADA' ? '#dc2626' : '#cbd5e1',
                      color: nuevoEstado === 'RECHAZADA' ? '#991b1b' : '#475569',
                      fontWeight: nuevoEstado === 'RECHAZADA' ? 700 : 500,
                    }}
                  >
                    <span>✗</span> Rechazar Planificación
                  </button>
                </div>
              </div>

              {/* Plantillas Rápidas */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ ...styles.modalInputLabel, fontSize: '0.78rem', color: '#64748b' }}>
                  Plantillas rápidas de observaciones:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Planificación aprobada conforme a los objetivos.',
                    'Excelente formulación y cronograma claro.',
                    'Favor corregir fechas y objetivos específicos.',
                    'Detallar la metodología de evaluación aplicada.',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setObservacionTexto(tpl)}
                      style={styles.templateChip}
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo Textarea de Observaciones */}
              <div>
                <label style={styles.modalInputLabel}>
                  Observaciones y Retroalimentación para el Estudiante:
                </label>
                <textarea
                  rows={4}
                  value={observacionTexto}
                  onChange={(e) => setObservacionTexto(e.target.value)}
                  placeholder="Escribe comentarios, recomendaciones o justificación del estado..."
                  style={styles.modalTextarea}
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={cerrarModalEvaluar}
                disabled={isSubmittingEval}
                style={styles.modalCancelBtn}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEvaluacion}
                disabled={isSubmittingEval}
                style={{
                  ...styles.modalSaveBtn,
                  backgroundColor: nuevoEstado === 'APROBADA' ? '#16a34a' : '#dc2626',
                  opacity: isSubmittingEval ? 0.7 : 1,
                }}
              >
                {isSubmittingEval ? 'Guardando...' : `Guardar como ${nuevoEstado}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '24px 24px 48px 24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  badge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: '20px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '2rem',
    color: '#ffffff',
    margin: '0 0 10px 0',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.98rem',
    color: '#cbd5e1',
    margin: 0,
    lineHeight: 1.5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px 24px',
    marginBottom: '28px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: '1.2rem',
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
    padding: '28px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  uploadIcon: {
    fontSize: '2.5rem',
    marginBottom: '8px',
  },
  dropzonePrompt: {
    fontSize: '0.95rem',
    color: '#334155',
    margin: '0 0 4px 0',
  },
  dropzoneHint: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: 0,
  },
  selectedFileName: {
    fontSize: '0.95rem',
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
    padding: '10px 18px',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  actionBtn: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 9px',
    fontSize: '0.74rem',
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
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  filterToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '6px 12px',
    flex: '1 1 220px',
    minWidth: '200px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.84rem',
    color: '#1e293b',
    width: '100%',
    backgroundColor: 'transparent',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#475569',
    whiteSpace: 'nowrap',
  },
  selectInput: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '0.84rem',
    color: '#1e293b',
    cursor: 'pointer',
    outline: 'none',
    fontWeight: 500,
  },
  resetFiltersBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    color: '#94a3b8',
  },
  tableWrapper: {
    width: '100%',
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
    padding: '10px 10px',
    fontSize: '0.78rem',
    fontWeight: 600,
    borderBottom: '1px solid #e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '10px 10px',
    fontSize: '0.84rem',
    color: '#475569',
    verticalAlign: 'middle',
  },
  tdPrimary: {
    padding: '10px 10px',
    fontSize: '0.84rem',
    color: '#0f172a',
    verticalAlign: 'middle',
  },
  typeBadge: {
    display: 'inline-block',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 500,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 19, 41, 0.75)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '540px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  modalSubtitle: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#64748b',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '20px 22px',
  },
  modalInfoBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  },
  modalInputLabel: {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
  },
  modalStateOption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  templateChip: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '14px',
    padding: '4px 10px',
    fontSize: '0.74rem',
    color: '#334155',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.15s',
  },
  modalTextarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.88rem',
    color: '#1e293b',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '14px 22px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
  },
  modalCancelBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalSaveBtn: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

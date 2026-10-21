import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPlanificaciones,
  uploadPlanificacion,
  evaluarPlanificacion,
  formalizarPlanificacion,
  initChatSession,
  sendChatMessage,
  Planificacion,
  ChatSessionDto,
  ChatMessageDto,
  getAuthFileUrl,
} from '../services/api';
import {
  Sparkles,
  Send,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Upload,
  ExternalLink,
  Bot,
  User as UserIcon,
  Lightbulb,
  RefreshCw,
  Search,
  Filter,
  X,
  Plus,
  BookOpen,
  Target,
  Award,
  Layers,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  '¿Cómo puedo mejorar el inicio para activar conocimientos previos?',
  '¿Mi propuesta cumple con los principios del DUA (Decreto 83)?',
  '¿Qué errores didácticos o conceptuales típicos debo anticipar en este tema?',
  '¿Los tiempos de la matriz tienen coherencia con las actividades de cierre?',
  '¿Qué técnica o instrumento de evaluación formativa me recomiendas?',
];

export const PlanificacionesWorkspace: React.FC = () => {
  const { user } = useAuth();
  const esDocente = user?.role === 'Profesor' || user?.role === 'Administrador' || user?.role === 'Evaluador';
  const esEstudiante = !esDocente;

  // Estado general de planificaciones
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | 'NEW' | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  // Filtros de la lista
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroEstudiante, setFiltroEstudiante] = useState<string>('TODOS');

  // Control de paneles colapsables
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [docPanelOpen, setDocPanelOpen] = useState<boolean>(true);
  const [docActiveTab, setDocActiveTab] = useState<'pdf' | 'dictamen' | 'dimensiones'>('pdf');

  // Estado de subida de nueva planificación
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFechaClase, setNewFechaClase] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Estado del chat socrático con RetroPlani
  const [chatSession, setChatSession] = useState<ChatSessionDto | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageDto[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [isBusyLimit, setIsBusyLimit] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Formalización de entrega
  const [isFormalizing, setIsFormalizing] = useState<boolean>(false);

  // Evaluación docente
  const [evalNuevoEstado, setEvalNuevoEstado] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [evalRetroalimentacion, setEvalRetroalimentacion] = useState<string>('');
  const [isSubmittingEval, setIsSubmittingEval] = useState<boolean>(false);
  const [evalSuccessMsg, setEvalSuccessMsg] = useState<string | null>(null);

  // Cargar lista de planificaciones
  const cargarPlanificaciones = async (selectIdToFocus?: number) => {
    try {
      setIsLoadingList(true);
      setListError(null);
      const data = await getPlanificaciones(user?.id, user?.role, user?.email);
      setPlanificaciones(data);

      if (data.length > 0) {
        if (selectIdToFocus) {
          setSelectedPlanId(selectIdToFocus);
        } else if (selectedPlanId === null || selectedPlanId === 'NEW') {
          // Mantener o seleccionar la primera
          setSelectedPlanId((prev) => (prev === 'NEW' ? 'NEW' : data[0].id));
        }
      } else {
        setSelectedPlanId('NEW');
      }
    } catch (err: any) {
      setListError('No se pudo cargar el historial de planificaciones.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) {
      cargarPlanificaciones();
    }
  }, [user]);

  // Planificación actualmente activa
  const planificacionActiva =
    selectedPlanId && selectedPlanId !== 'NEW'
      ? planificaciones.find((p) => p.id === selectedPlanId) || null
      : null;

  // Cargar sesión de chat al cambiar la planificación activa
  useEffect(() => {
    if (!planificacionActiva) {
      setChatSession(null);
      setChatMessages([]);
      setChatError(null);
      return;
    }

    const cargarSesion = async () => {
      setIsLoadingChat(true);
      setChatError(null);
      setIsBusyLimit(false);
      try {
        const ses = await initChatSession(planificacionActiva.id);
        setChatSession(ses);
        setChatMessages(ses.messages || []);
      } catch (err: any) {
        const status = err.response?.status;
        const msg =
          err.response?.data?.message ||
          (typeof err.response?.data === 'string' ? err.response?.data : null) ||
          err.message ||
          'Error al conectar con RetroPlani Mate V3.';
        if (status === 503) {
          setIsBusyLimit(true);
          setChatError('Servidor de IA ocupado. Espera unos segundos y pulsa Reintentar.');
        } else {
          setChatError(msg);
        }
      } finally {
        setIsLoadingChat(false);
      }
    };

    cargarSesion();
  }, [planificacionActiva?.id]);

  // Scroll automático en el chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingMsg]);

  // Enviar mensaje al bot
  const handleSendMessage = async (textCustom?: string) => {
    const text = (textCustom !== undefined ? textCustom : chatInput).trim();
    if (!text || !chatSession || isSendingMsg) return;

    setChatError(null);
    setIsBusyLimit(false);

    const optimisticMsg: ChatMessageDto = {
      id: Date.now(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, optimisticMsg]);
    setChatInput('');
    setIsSendingMsg(true);

    try {
      const resp = await sendChatMessage(chatSession.sessionId, text);
      setChatMessages((prev) => [...prev, resp]);
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Error al procesar la respuesta pedagógica.';
      if (status === 503) {
        setIsBusyLimit(true);
        setChatError('El servidor de IA está atendiendo consultas concurrentes. Reintenta en breves momentos.');
      } else {
        setChatError(msg);
      }
    } finally {
      setIsSendingMsg(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  };

  // Subir nueva planificación
  const handleUploadNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) {
      setUploadError('Por favor selecciona un archivo PDF de planificación.');
      return;
    }
    if (!newFechaClase) {
      setUploadError('Por favor indica la fecha de la clase planificada.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const nueva = await uploadPlanificacion(newFile, user?.id, newFechaClase);
      setNewFile(null);
      setNewFechaClase('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      setPlanificaciones((prev) => [nueva, ...prev]);
      setSelectedPlanId(nueva.id);
      setDocActiveTab('pdf');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Error al subir la planificación.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Reemplazar archivo de planificación existente
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !planificacionActiva) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se admiten archivos PDF (.pdf)');
      return;
    }

    try {
      setIsUploading(true);
      const fecha = planificacionActiva.fechaClase || new Date().toISOString().split('T')[0];
      const actualizada = await uploadPlanificacion(file, user?.id, fecha);
      setPlanificaciones((prev) =>
        prev.map((p) => (p.id === planificacionActiva.id ? actualizada : p))
      );
      alert('¡Nueva versión del PDF subida con éxito!');
    } catch (err: any) {
      alert('Error al actualizar el archivo: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // Formalizar entrega
  const handleFormalizar = async () => {
    if (!planificacionActiva || isFormalizing) return;
    setIsFormalizing(true);
    try {
      const formalizada = await formalizarPlanificacion(planificacionActiva.id, user?.email);
      setPlanificaciones((prev) =>
        prev.map((p) => (p.id === formalizada.id ? formalizada : p))
      );
      alert('¡Planificación formalizada! Ahora se encuentra en revisión docente.');
    } catch (err: any) {
      alert('Error al formalizar: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsFormalizing(false);
    }
  };

  // Evaluar docente
  const handleEvaluarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planificacionActiva || isSubmittingEval) return;

    if (evalNuevoEstado === 'RECHAZADA' && !evalRetroalimentacion.trim()) {
      alert('Debes ingresar una retroalimentación cualitativa al rechazar una planificación.');
      return;
    }

    setIsSubmittingEval(true);
    setEvalSuccessMsg(null);

    try {
      const evaluada = await evaluarPlanificacion(
        planificacionActiva.id,
        evalNuevoEstado,
        evalRetroalimentacion,
        user?.email
      );

      setPlanificaciones((prev) =>
        prev.map((p) => (p.id === evaluada.id ? { ...p, estado: evaluada.estado, retroalimentacion: evaluada.retroalimentacion } : p))
      );
      setEvalSuccessMsg('¡Evaluación guardada exitosamente!');
      setTimeout(() => setEvalSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Error al guardar la evaluación: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingEval(false);
    }
  };

  // Filtro de lista
  const estudiantesUnicos = Array.from(
    new Set(planificaciones.map((p) => p.usuario?.fullName).filter(Boolean))
  ) as string[];

  const planificacionesFiltradas = planificaciones.filter((p) => {
    if (filtroEstado !== 'TODOS' && (p.estado || 'PENDIENTE') !== filtroEstado) return false;
    if (filtroEstudiante !== 'TODOS' && p.usuario?.fullName !== filtroEstudiante) return false;
    if (busquedaTexto.trim()) {
      const q = busquedaTexto.toLowerCase();
      const matchTema = (p.nombreArchivo || p.archivo || '').toLowerCase().includes(q);
      const matchUser = (p.usuario?.fullName || '').toLowerCase().includes(q);
      if (!matchTema && !matchUser) return false;
    }
    return true;
  });

  // Helper de badges de estado
  const getBadgeInfo = (estado?: string) => {
    switch (estado) {
      case 'APROBADA':
        return { label: 'Aprobada', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', color: '#4ade80', icon: CheckCircle2 };
      case 'RECHAZADA':
        return { label: 'Rechazada', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', color: '#f87171', icon: XCircle };
      case 'EN_REVISION_IA':
        return { label: 'En Revisión IA', bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.45)', color: '#c084fc', icon: Sparkles };
      case 'PENDIENTE':
      default:
        return { label: 'Pendiente Docente', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)', color: '#facc15', icon: Clock };
    }
  };

  return (
    <div style={styles.workspaceContainer}>
      {/* ======================================================== */}
      {/* 1. SIDEBAR IZQUIERDA: HISTORIAL DE PLANIFICACIONES */}
      {/* ======================================================== */}
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarOpen ? '300px' : '0px',
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
        }}
      >
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#60a5fa" />
              <h2 style={styles.sidebarTitle}>
                {esDocente ? 'Planificaciones' : 'Mis Clases'}
              </h2>
            </div>
            <span style={styles.countBadge}>{planificacionesFiltradas.length}</span>
          </div>

          {/* Botón Nueva Planificación (Solo estudiante) */}
          {esEstudiante && (
            <button
              onClick={() => setSelectedPlanId('NEW')}
              style={{
                ...styles.btnNuevaPlanif,
                backgroundColor: selectedPlanId === 'NEW' ? '#1d4ed8' : '#2563eb',
              }}
            >
              <Plus size={16} />
              <span>Subir Nueva Planificación</span>
            </button>
          )}

          {/* Buscador Rápido */}
          <div style={styles.searchBox}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder={esDocente ? 'Buscar por alumno o tema...' : 'Buscar planificación...'}
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              style={styles.searchInput}
            />
            {busquedaTexto && (
              <button onClick={() => setBusquedaTexto('')} style={styles.iconClearBtn}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filtros para Docente */}
          {esDocente && estudiantesUnicos.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <select
                value={filtroEstudiante}
                onChange={(e) => setFiltroEstudiante(e.target.value)}
                style={styles.selectFilter}
              >
                <option value="TODOS">Todos los alumnos ({estudiantesUnicos.length})</option>
                {estudiantesUnicos.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Estado */}
          <div style={styles.filterPillsRow}>
            {['TODOS', 'PENDIENTE', 'APROBADA', 'RECHAZADA'].map((st) => (
              <button
                key={st}
                onClick={() => setFiltroEstado(st)}
                style={{
                  ...styles.pillBtn,
                  backgroundColor: filtroEstado === st ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                  color: filtroEstado === st ? '#ffffff' : '#94a3b8',
                }}
              >
                {st === 'TODOS' ? 'Todos' : st === 'PENDIENTE' ? 'Pendientes' : st === 'APROBADA' ? 'Aprobadas' : 'Rechazadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Tarjetas */}
        <div style={styles.sidebarList}>
          {isLoadingList ? (
            <div style={styles.sidebarEmpty}>Cargando planificaciones...</div>
          ) : planificacionesFiltradas.length === 0 ? (
            <div style={styles.sidebarEmpty}>No hay planificaciones en esta vista.</div>
          ) : (
            planificacionesFiltradas.map((item) => {
              const isSelected = selectedPlanId === item.id;
              const badge = getBadgeInfo(item.estado);
              const BadgeIcon = badge.icon;
              const tema = item.nombreArchivo || item.archivo?.split('/').pop() || `Planificación #${item.id}`;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedPlanId(item.id)}
                  style={{
                    ...styles.planifCard,
                    backgroundColor: isSelected ? '#1e293b' : 'rgba(19, 30, 58, 0.6)',
                    borderColor: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={styles.planifCardTitle}>{tema}</span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: badge.bg,
                        borderColor: badge.border,
                        color: badge.color,
                      }}
                    >
                      <BadgeIcon size={10} style={{ marginRight: '3px' }} />
                      {badge.label}
                    </span>
                  </div>

                  {esDocente && item.usuario?.fullName && (
                    <div style={styles.planifCardStudent}>
                      <UserIcon size={12} color="#60a5fa" />
                      <span>{item.usuario.fullName}</span>
                    </div>
                  )}

                  <div style={styles.planifCardFooter}>
                    <span style={styles.planifCardDate}>
                      <Calendar size={11} style={{ marginRight: '3px' }} />
                      {item.fechaClase || 'Sin fecha'}
                    </span>
                    {item.retroalimentacion && (
                      <span style={styles.hasFeedbackIndicator} title="Tiene observaciones docentes">
                        💬 Feedback
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. PANEL CENTRAL: CHAT CON RETROPLANI MATE (CHATGPT-STYLE) */}
      {/* ======================================================== */}
      <main style={styles.chatPanel}>
        {/* Header superior del chat */}
        <header style={styles.chatHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={styles.iconToggleBtn}
              title={sidebarOpen ? 'Ocultar historial' : 'Mostrar historial'}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.sparkleWrap}>
                  <Sparkles size={16} color="#ffffff" />
                </div>
                <h1 style={styles.chatTitle}>
                  {selectedPlanId === 'NEW'
                    ? 'Nueva Planificación de Clase'
                    : planificacionActiva
                    ? planificacionActiva.nombreArchivo || planificacionActiva.archivo?.split('/').pop() || `Planificación #${planificacionActiva.id}`
                    : 'Selecciona una Planificación'}
                </h1>

                {planificacionActiva && (
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getBadgeInfo(planificacionActiva.estado),
                      backgroundColor: getBadgeInfo(planificacionActiva.estado).bg,
                      borderColor: getBadgeInfo(planificacionActiva.estado).border,
                      color: getBadgeInfo(planificacionActiva.estado).color,
                    }}
                  >
                    {getBadgeInfo(planificacionActiva.estado).label}
                  </span>
                )}
              </div>
              <p style={styles.chatSubtitle}>
                RetroPlani Mate V3 • Tutoría Socrática en Didáctica de la Matemática UBB
              </p>
            </div>
          </div>

          {/* Acciones del Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Si está en revisión IA y es estudiante: Botón de Formalizar */}
            {esEstudiante && planificacionActiva?.estado === 'EN_REVISION_IA' && (
              <button
                onClick={handleFormalizar}
                disabled={isFormalizing}
                style={styles.btnFormalizarHeader}
                title="Formalizar entrega para que tu profesor la evalúe"
              >
                <Sparkles size={14} />
                <span>{isFormalizing ? 'Formalizando...' : 'Confirmar Entrega al Profesor'}</span>
              </button>
            )}

            {/* Alternador de Panel Derecho (Visor PDF / Dictamen) */}
            {planificacionActiva && (
              <button
                onClick={() => setDocPanelOpen((prev) => !prev)}
                style={{
                  ...styles.btnToggleDocPanel,
                  backgroundColor: docPanelOpen ? '#1e293b' : 'rgba(255,255,255,0.06)',
                  color: docPanelOpen ? '#60a5fa' : '#94a3b8',
                }}
                title={docPanelOpen ? 'Ocultar visor de documento' : 'Abrir visor de documento'}
              >
                {docPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {docPanelOpen ? 'Ocultar Documento' : 'Ver Documento & Dictamen'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Banner de estado pedagógico */}
        {planificacionActiva?.estado === 'EN_REVISION_IA' && (
          <div style={styles.aiReviewBanner}>
            <Sparkles size={16} color="#a855f7" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '13px', color: '#c084fc' }}>
              <strong>Modo Revisión Formativa:</strong> Esta versión aún no es visible para tu profesor. Reflexiona con el bot, realiza las mejoras pedagógicas pertinentes y pulsa <strong>"Confirmar Entrega al Profesor"</strong> cuando estés listo.
            </div>
          </div>
        )}

        {/* Área scrolleable de mensajes */}
        <div style={styles.chatMessagesArea}>
          {selectedPlanId === 'NEW' ? (
            /* ======================================================== */
            /* PANTALLA INICIAL: SUBIDA CHATGPT-LIKE */
            /* ======================================================== */
            <div style={styles.newPlanifWelcome}>
              <div style={styles.welcomeHero}>
                <div style={styles.heroSparkle}>
                  <Sparkles size={32} color="#ffffff" />
                </div>
                <h2 style={styles.heroTitle}>Sube tu Planificación de Clase</h2>
                <p style={styles.heroSubtitle}>
                  El Tutor IA RetroPlani Mate analizará tu documento en los 4 ejes pedagógicos UBB (Inicio, Desarrollo, Cierre, DUA y Evaluación) y te entregará retroalimentación formativa en tiempo real.
                </p>
              </div>

              {/* Formulario de Subida Integrado */}
              <form onSubmit={handleUploadNew} style={styles.uploadCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  <label style={styles.inputLabel}>
                    <Calendar size={14} color="#60a5fa" />
                    <span>Fecha en que realizarás la clase:</span>
                    <span style={{ color: '#f87171', fontSize: '11px' }}>* Obligatorio</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newFechaClase}
                    onChange={(e) => setNewFechaClase(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>

                {/* Dropzone PDF */}
                <div
                  style={{
                    ...styles.dropzoneBox,
                    borderColor: newFile ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: newFile ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const f = e.target.files[0];
                        if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
                          setNewFile(f);
                          setUploadError(null);
                        } else {
                          setUploadError('Únicamente se permiten archivos PDF (.pdf)');
                        }
                      }
                    }}
                  />
                  <div style={styles.dropzoneIconWrap}>
                    <Upload size={24} color={newFile ? '#60a5fa' : '#94a3b8'} />
                  </div>
                  {newFile ? (
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#60a5fa', fontSize: '14px' }}>
                        📄 {newFile.name}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Clic para cambiar archivo PDF</span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 650, color: '#f8fafc', fontSize: '14px' }}>
                        Arrastra tu archivo PDF o haz clic aquí para seleccionarlo
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Formatos soportados: Documentos de planificación en PDF (Máx 50MB)
                      </span>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div style={styles.errorNotice}>
                    <AlertCircle size={15} color="#ef4444" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!newFile || !newFechaClase || isUploading}
                  style={{
                    ...styles.btnSubmitUpload,
                    opacity: !newFile || !newFechaClase || isUploading ? 0.6 : 1,
                  }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Subiendo y activando análisis IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Subir Planificación y Comenzar Tutoría IA</span>
                    </>
                  )}
                </button>
              </form>

              {/* 4 Ejes Didácticos Informativos */}
              <div style={styles.gridEjesInfo}>
                <div style={styles.cardEjeMini}>
                  <Target size={16} color="#60a5fa" />
                  <strong>Coherencia Curricular</strong>
                  <p>Alineación de Objetivos de Aprendizaje, Inicio, Desarrollo y Cierre.</p>
                </div>
                <div style={styles.cardEjeMini}>
                  <Layers size={16} color="#34d399" />
                  <strong>Metodología Activa</strong>
                  <p>Didáctica de la matemática, problematización y razonamiento.</p>
                </div>
                <div style={styles.cardEjeMini}>
                  <Award size={16} color="#fbbf24" />
                  <strong>DUA (Decreto 83)</strong>
                  <p>Múltiples formas de representación, expresión y motivación.</p>
                </div>
                <div style={styles.cardEjeMini}>
                  <CheckCircle2 size={16} color="#c084fc" />
                  <strong>Evaluación Formativa</strong>
                  <p>Instrumentos para verificar el aprendizaje clase a clase.</p>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* CONVERSACIÓN CON EL ASISTENTE PEDAGÓGICO */
            /* ======================================================== */
            <div style={styles.messagesContainer}>
              {isLoadingChat ? (
                <div style={styles.chatLoadingState}>
                  <div style={styles.spinner} />
                  <h3 style={{ margin: '12px 0 4px 0', fontSize: '15px', color: '#f8fafc' }}>
                    Recuperando sesión pedagógica...
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                    Sincronizando observaciones con el motor de inferencia UBB
                  </p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={styles.emptyPromptState}>
                  <Lightbulb size={32} color="#818cf8" />
                  <p style={{ margin: '12px 0 4px 0', fontWeight: 650, color: '#f8fafc', fontSize: '15px' }}>
                    Sesión pedagógica lista
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '380px' }}>
                    Escribe tu consulta o haz clic en alguna de las preguntas sugeridas para profundizar en la didáctica de tu clase.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isUser = msg.role === 'USER';
                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        ...styles.messageRow,
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {!isUser && (
                        <div style={styles.avatarBot} title="RetroPlani Mate V3">
                          <Bot size={18} color="#ffffff" />
                        </div>
                      )}

                      <div
                        style={{
                          ...styles.bubble,
                          ...(isUser ? styles.bubbleUser : styles.bubbleBot),
                        }}
                      >
                        <div style={styles.bubbleHeader}>
                          <span style={styles.senderName}>{isUser ? 'Tú' : 'RetroPlani Mate'}</span>
                          {msg.createdAt && (
                            <span style={styles.timestamp}>
                              <Clock size={11} style={{ marginRight: '3px' }} />
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {/* Renderizado formateado de texto */}
                        <div style={styles.bubbleContent}>
                          <FormattedText content={msg.content} isUser={isUser} />
                        </div>
                      </div>

                      {isUser && (
                        <div style={styles.avatarUser} title="Tú">
                          <UserIcon size={18} color="#ffffff" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Indicador de typing */}
              {isSendingMsg && (
                <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                  <div style={styles.avatarBot}>
                    <Bot size={18} color="#ffffff" />
                  </div>
                  <div style={{ ...styles.bubble, ...styles.bubbleBot, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={styles.typingDot} />
                    <div style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                    <div style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                    <span style={{ fontSize: '12.5px', color: '#818cf8', marginLeft: '6px' }}>
                      RetroPlani está reflexionando pedagógicamente...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Alerta de error en chat */}
        {chatError && (
          <div style={styles.chatErrorBanner}>
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '13px', color: '#fca5a5' }}>{chatError}</span>
            {isBusyLimit && (
              <button
                onClick={() => handleSendMessage()}
                style={styles.btnRetryChat}
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {/* Sugerencias Rápidas (Chips) */}
        {selectedPlanId !== 'NEW' && (
          <div style={styles.chipsSection}>
            <div style={styles.chipsScroll}>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  disabled={isSendingMsg || isLoadingChat}
                  onClick={() => handleSendMessage(prompt)}
                  style={styles.promptChip}
                >
                  <Sparkles size={12} color="#818cf8" style={{ marginRight: '4px' }} />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Barra de Entrada Inferior Flotante (ChatGPT Style) */}
        {selectedPlanId !== 'NEW' && (
          <div style={styles.chatInputWrapper}>
            <div style={styles.chatInputBox}>
              {/* Botón para subir nueva versión de PDF */}
              {esEstudiante && (
                <>
                  <input
                    type="file"
                    ref={replaceFileInputRef}
                    accept="application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleReplaceFile}
                  />
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    style={styles.clipBtn}
                    title="Actualizar o subir versión corregida del PDF"
                  >
                    <Paperclip size={18} />
                  </button>
                </>
              )}

              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  esDocente
                    ? 'Escribe una pregunta para supervisar la reflexión pedagógica del alumno...'
                    : 'Pregúntale a RetroPlani sobre tu clase, momentos, DUA o evaluación...'
                }
                style={styles.chatTextarea}
                rows={1}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || isSendingMsg}
                style={{
                  ...styles.sendBtn,
                  opacity: !chatInput.trim() || isSendingMsg ? 0.5 : 1,
                }}
                title="Enviar mensaje (Enter)"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 3. PANEL DERECHO: VISOR DE DOCUMENTO & DICTAMEN DOCENTE */}
      {/* ======================================================== */}
      {planificacionActiva && (
        <aside
          style={{
            ...styles.docPanel,
            width: docPanelOpen ? '440px' : '0px',
            opacity: docPanelOpen ? 1 : 0,
            pointerEvents: docPanelOpen ? 'auto' : 'none',
          }}
        >
          {/* Header con Pestañas */}
          <div style={styles.docPanelHeader}>
            <div style={styles.docTabsRow}>
              <button
                onClick={() => setDocActiveTab('pdf')}
                style={{
                  ...styles.docTabBtn,
                  borderBottomColor: docActiveTab === 'pdf' ? '#3b82f6' : 'transparent',
                  color: docActiveTab === 'pdf' ? '#ffffff' : '#94a3b8',
                }}
              >
                <FileText size={14} />
                <span>Documento PDF</span>
              </button>

              <button
                onClick={() => setDocActiveTab('dictamen')}
                style={{
                  ...styles.docTabBtn,
                  borderBottomColor: docActiveTab === 'dictamen' ? '#3b82f6' : 'transparent',
                  color: docActiveTab === 'dictamen' ? '#ffffff' : '#94a3b8',
                }}
              >
                <Award size={14} />
                <span>Dictamen Docente</span>
              </button>

              <button
                onClick={() => setDocActiveTab('dimensiones')}
                style={{
                  ...styles.docTabBtn,
                  borderBottomColor: docActiveTab === 'dimensiones' ? '#3b82f6' : 'transparent',
                  color: docActiveTab === 'dimensiones' ? '#ffffff' : '#94a3b8',
                }}
              >
                <Target size={14} />
                <span>Ejes UBB</span>
              </button>
            </div>

            <button
              onClick={() => setDocPanelOpen(false)}
              style={styles.iconCloseDocBtn}
              title="Cerrar panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contenido según pestaña */}
          <div style={styles.docPanelContent}>
            {docActiveTab === 'pdf' && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={styles.pdfToolbar}>
                  <span style={styles.pdfFileName}>
                    📄 {planificacionActiva.nombreArchivo || planificacionActiva.archivo?.split('/').pop() || 'Planificacion.pdf'}
                  </span>
                  <a
                    href={getAuthFileUrl(planificacionActiva.archivoUrl || `/api/planificaciones/${planificacionActiva.id}/archivo`)}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.openExternalBtn}
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink size={13} />
                    <span>Abrir PDF</span>
                  </a>
                </div>

                <div style={styles.iframeWrapper}>
                  <iframe
                    src={getAuthFileUrl(planificacionActiva.archivoUrl || `/api/planificaciones/${planificacionActiva.id}/archivo`)}
                    title="Visor de Planificación PDF"
                    style={styles.pdfIframe}
                  />
                </div>
              </div>
            )}

            {docActiveTab === 'dictamen' && (
              <div style={styles.dictamenTabContent}>
                {/* Si es docente: Formulario de Evaluación */}
                {esDocente ? (
                  <form onSubmit={handleEvaluarSubmit} style={styles.evalFormBox}>
                    <h3 style={styles.dictamenSectionTitle}>Resolución de la Planificación</h3>
                    <p style={styles.dictamenSectionDesc}>
                      Evalúa la propuesta del estudiante. Al rechazar, debes ingresar obligatoriamente una retroalimentación formativa cualitativa.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', margin: '14px 0' }}>
                      <button
                        type="button"
                        onClick={() => setEvalNuevoEstado('APROBADA')}
                        style={{
                          ...styles.btnDecision,
                          backgroundColor: evalNuevoEstado === 'APROBADA' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.05)',
                          borderColor: evalNuevoEstado === 'APROBADA' ? '#22c55e' : 'rgba(255,255,255,0.1)',
                          color: evalNuevoEstado === 'APROBADA' ? '#4ade80' : '#94a3b8',
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Aprobar Clase</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEvalNuevoEstado('RECHAZADA')}
                        style={{
                          ...styles.btnDecision,
                          backgroundColor: evalNuevoEstado === 'RECHAZADA' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)',
                          borderColor: evalNuevoEstado === 'RECHAZADA' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                          color: evalNuevoEstado === 'RECHAZADA' ? '#f87171' : '#94a3b8',
                        }}
                      >
                        <XCircle size={16} />
                        <span>Rechazar Clase</span>
                      </button>
                    </div>

                    <label style={styles.inputLabel}>
                      <span>Retroalimentación Formativa (Obligatorio en Rechazo):</span>
                    </label>
                    <textarea
                      rows={5}
                      value={evalRetroalimentacion}
                      onChange={(e) => setEvalRetroalimentacion(e.target.value)}
                      placeholder="Indica observaciones pedagógicas sobre la activación de conocimientos, DUA, tiempos o instrumento de evaluación..."
                      style={styles.textareaFeedback}
                    />

                    {evalSuccessMsg && (
                      <div style={styles.evalSuccessAlert}>
                        <CheckCircle2 size={16} color="#22c55e" />
                        <span>{evalSuccessMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingEval}
                      style={{
                        ...styles.btnGuardarEval,
                        opacity: isSubmittingEval ? 0.6 : 1,
                      }}
                    >
                      {isSubmittingEval ? 'Guardando dictamen...' : 'Guardar y Notificar al Estudiante'}
                    </button>
                  </form>
                ) : (
                  /* Vista de estudiante del dictamen */
                  <div style={styles.studentDictamenCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Award size={20} color="#fbbf24" />
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', fontWeight: 700 }}>
                        Dictamen del Profesor Guía
                      </h3>
                    </div>

                    <div style={styles.dictamenStatusRow}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Estado de la Clase:</span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...getBadgeInfo(planificacionActiva.estado),
                          backgroundColor: getBadgeInfo(planificacionActiva.estado).bg,
                          borderColor: getBadgeInfo(planificacionActiva.estado).border,
                          color: getBadgeInfo(planificacionActiva.estado).color,
                        }}
                      >
                        {getBadgeInfo(planificacionActiva.estado).label}
                      </span>
                    </div>

                    <div style={{ margin: '14px 0' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Observaciones del Docente:
                      </span>
                      <div style={styles.retroalimentacionBox}>
                        {planificacionActiva.retroalimentacion ? (
                          <p style={{ margin: 0, fontSize: '13.5px', color: '#e2e8f0', lineHeight: '1.5' }}>
                            {planificacionActiva.retroalimentacion}
                          </p>
                        ) : (
                          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Aún no se ha registrado una retroalimentación formal por parte del docente evaluador.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {docActiveTab === 'dimensiones' && (
              <div style={styles.dimensionesTabContent}>
                <h3 style={styles.dictamenSectionTitle}>Los 4 Ejes Curriculares UBB</h3>
                <p style={styles.dictamenSectionDesc}>
                  Pauta de aseguramiento didáctico para la carrera de Pedagogía en Educación Matemática:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                  <div style={styles.ejeCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={16} color="#60a5fa" />
                      <strong style={{ fontSize: '13.5px', color: '#93c5fd' }}>1. Coherencia Curricular</strong>
                    </div>
                    <p style={styles.ejeCardText}>
                      Alineación estricta entre el Objetivo de Aprendizaje (OA), los tres momentos de la clase (Inicio, Desarrollo, Cierre) y los tiempos programados.
                    </p>
                  </div>

                  <div style={styles.ejeCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={16} color="#34d399" />
                      <strong style={{ fontSize: '13.5px', color: '#6ee7b7' }}>2. Metodología Activa</strong>
                    </div>
                    <p style={styles.ejeCardText}>
                      Estrategias pedagógicas orientadas a la didáctica de la matemática, resolución de problemas y rol protagónico del estudiante.
                    </p>
                  </div>

                  <div style={styles.ejeCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} color="#fbbf24" />
                      <strong style={{ fontSize: '13.5px', color: '#fde047' }}>3. Diversificación DUA (Decreto 83)</strong>
                    </div>
                    <p style={styles.ejeCardText}>
                      Principios del Diseño Universal para el Aprendizaje: múltiples formas de representación visual/simbólica, acción/expresión y motivación.
                    </p>
                  </div>

                  <div style={styles.ejeCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#c084fc" />
                      <strong style={{ fontSize: '13.5px', color: '#d8b4fe' }}>4. Evaluación Formativa</strong>
                    </div>
                    <p style={styles.ejeCardText}>
                      Estrategias clase a clase (ticket de salida, pauta de cotejo, preguntas socráticas) para monitorear el progreso del aprendizaje.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

// ========================================================
// COMPONENTE AUXILIAR PARA FORMATO DE TEXTO MARKDOWN (CON SOPORTE DE TABLAS Y ENLACES)
// ========================================================

type ContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; num: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'paragraph'; text: string }
  | { type: 'spacer' };

function parseTableRow(line: string): string[] {
  let cleaned = line.trim();
  if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
  if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);
  return cleaned.split('|').map((c) => c.trim());
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return false;
  const pipes = (trimmed.match(/\|/g) || []).length;
  return pipes >= 2;
}

function isTableSeparator(line: string): boolean {
  const cells = parseTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}

function parseContentToBlocks(content: string): ContentBlock[] {
  const rawLines = content.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Detección de tablas Markdown (incluyendo tablas con líneas intermedias vacías)
    if (isTableRow(trimmed)) {
      const tableLines: string[] = [trimmed];
      let j = i + 1;

      while (j < rawLines.length) {
        const nextTrimmed = rawLines[j].trim();
        if (isTableRow(nextTrimmed)) {
          tableLines.push(nextTrimmed);
          j++;
        } else if (nextTrimmed === '') {
          // Si hay una línea vacía intermedia, revisamos si la siguiente línea no vacía sigue siendo tabla
          let k = j + 1;
          while (k < rawLines.length && rawLines[k].trim() === '') {
            k++;
          }
          if (k < rawLines.length && isTableRow(rawLines[k].trim())) {
            j = k; // Saltamos los espacios en blanco intermedios y continuamos la tabla
          } else {
            break;
          }
        } else {
          break;
        }
      }

      let headers: string[] = [];
      const rows: string[][] = [];

      if (tableLines.length >= 2 && isTableSeparator(tableLines[1])) {
        headers = parseTableRow(tableLines[0]);
        for (let r = 2; r < tableLines.length; r++) {
          if (!isTableSeparator(tableLines[r])) {
            rows.push(parseTableRow(tableLines[r]));
          }
        }
      } else if (tableLines.length >= 1) {
        const nonSep = tableLines.filter((l) => !isTableSeparator(l));
        if (nonSep.length > 0) {
          headers = parseTableRow(nonSep[0]);
          for (let r = 1; r < nonSep.length; r++) {
            rows.push(parseTableRow(nonSep[r]));
          }
        }
      }

      if (headers.length > 0 || rows.length > 0) {
        blocks.push({ type: 'table', headers, rows });
      }

      i = j;
      continue;
    }

    if (!trimmed) {
      // Evitar acumular espaciadores vacíos consecutivos
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer' });
      }
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: trimmed.replace(/^###\s+/, '') });
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: trimmed.replace(/^##\s+/, '') });
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: trimmed.replace(/^#\s+/, '') });
      i++;
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ type: 'bullet', text: trimmed.replace(/^[-*]\s+/, '') });
      i++;
      continue;
    }

    const matchNum = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (matchNum) {
      blocks.push({ type: 'numbered', num: matchNum[1], text: matchNum[2] });
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.replace(/^>\s+/, '') });
      i++;
      continue;
    }

    blocks.push({ type: 'paragraph', text: trimmed });
    i++;
  }

  return blocks;
}

const FormattedText: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  const blocks = parseContentToBlocks(content);

  return (
    <div style={{ lineHeight: '1.6', fontSize: '13.5px' }}>
      {blocks.map((block, idx) => {
        if (block.type === 'spacer') {
          return <div key={idx} style={{ height: '6px' }} />;
        }

        if (block.type === 'heading') {
          if (block.level === 3) {
            return (
              <h4
                key={idx}
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: isUser ? '#ffffff' : '#93c5fd',
                  margin: '12px 0 4px 0',
                }}
              >
                {renderInlineStyles(block.text, isUser)}
              </h4>
            );
          }
          return (
            <h3
              key={idx}
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isUser ? '#ffffff' : '#60a5fa',
                margin: '14px 0 6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '4px',
              }}
            >
              {renderInlineStyles(block.text, isUser)}
            </h3>
          );
        }

        if (block.type === 'bullet') {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                margin: '2px 0 2px 4px',
              }}
            >
              <span style={{ color: isUser ? '#ffffff' : '#818cf8', fontSize: '14px', lineHeight: '1.4' }}>•</span>
              <span style={{ flex: 1 }}>{renderInlineStyles(block.text, isUser)}</span>
            </div>
          );
        }

        if (block.type === 'numbered') {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                margin: '3px 0 3px 4px',
              }}
            >
              <span style={{ fontWeight: 700, color: isUser ? '#ffffff' : '#818cf8', minWidth: '18px' }}>
                {block.num}.
              </span>
              <span style={{ flex: 1 }}>{renderInlineStyles(block.text, isUser)}</span>
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <div
              key={idx}
              style={{
                borderLeft: '3px solid #818cf8',
                paddingLeft: '10px',
                color: isUser ? '#e0e7ff' : '#cbd5e1',
                fontStyle: 'italic',
                margin: '8px 0',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '0 4px 4px 0',
                padding: '4px 8px',
              }}
            >
              {renderInlineStyles(block.text, isUser)}
            </div>
          );
        }

        if (block.type === 'table') {
          const colCount = Math.max(
            block.headers.length,
            ...block.rows.map((r) => r.length)
          );

          return (
            <div
              key={idx}
              style={{
                margin: '12px 0',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                overflowX: 'auto',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                maxWidth: '100%',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13px',
                }}
              >
                {block.headers.length > 0 && (
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        borderBottom: '2px solid rgba(96, 165, 250, 0.35)',
                      }}
                    >
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          style={{
                            padding: '10px 14px',
                            fontWeight: 650,
                            color: '#93c5fd',
                            whiteSpace: 'nowrap',
                            fontSize: '12.5px',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {renderInlineStyles(h, isUser)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom:
                          rIdx < block.rows.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                        backgroundColor: rIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      }}
                    >
                      {Array.from({ length: colCount }).map((_, cIdx) => {
                        const cell = row[cIdx] || '';
                        const isOk = cell.includes('✔️') || cell.includes('Disponible') || cell.includes('Existe');
                        const isFail = cell.includes('❌') || cell.includes('Falta') || cell.includes('Ausente');

                        return (
                          <td
                            key={cIdx}
                            style={{
                              padding: '9px 14px',
                              color: isFail ? '#fca5a5' : isOk ? '#86efac' : isUser ? '#ffffff' : '#e2e8f0',
                              verticalAlign: 'middle',
                              lineHeight: '1.45',
                            }}
                          >
                            {renderInlineStyles(cell, isUser)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Párrafo normal
        return (
          <p key={idx} style={{ margin: '3px 0', color: isUser ? '#ffffff' : '#e2e8f0' }}>
            {renderInlineStyles(block.text, isUser)}
          </p>
        );
      })}
    </div>
  );
};

function renderInlineStyles(text: string, isUser = false): React.ReactNode {
  // Regex para enlaces Markdown, URLs directas, negrita (**...**) y código (`...`)
  const regex = /(\[.*?\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s)\]<>"']+|\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Enlace Markdown [Texto](url)
    const mdLinkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (mdLinkMatch) {
      const linkText = mdLinkMatch[1];
      const linkUrl = mdLinkMatch[2];
      return (
        <a
          key={i}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={linkUrl}
          style={{
            color: '#60a5fa',
            textDecoration: 'underline',
            fontWeight: 500,
            wordBreak: 'break-all',
          }}
        >
          {linkText} <span style={{ fontSize: '10px' }}>↗</span>
        </a>
      );
    }

    // URL Directa (Google Docs, Drive u otras)
    if (part.startsWith('http://') || part.startsWith('https://')) {
      let label = part;
      if (part.includes('docs.google.com/document')) {
        label = '📄 Ver Google Doc';
      } else if (part.includes('docs.google.com/spreadsheets')) {
        label = '📊 Ver Hoja de Cálculo';
      } else if (part.includes('docs.google.com/presentation')) {
        label = '📽️ Ver Google Slides';
      } else if (part.includes('drive.google.com')) {
        label = '📁 Ver Archivo Drive';
      } else if (part.length > 38) {
        label = `${part.substring(0, 35)}...`;
      }

      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          title={part}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            color: '#93c5fd',
            fontSize: '11.5px',
            fontWeight: 500,
            textDecoration: 'none',
            verticalAlign: 'middle',
            margin: '1px 2px',
            cursor: 'pointer',
          }}
        >
          <span>{label}</span>
          <span style={{ fontSize: '9px' }}>↗</span>
        </a>
      );
    }

    // Negrita
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: isUser ? '#ffffff' : '#f8fafc' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Código inline
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '0.9em',
            color: '#93c5fd',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Texto normal
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

// ========================================================
// ESTILOS EN LÍNEA
// ========================================================
const styles: { [key: string]: React.CSSProperties } = {
  workspaceContainer: {
    display: 'flex',
    height: 'calc(100vh - 64px)',
    backgroundColor: '#0b1329',
    color: '#f8fafc',
    overflow: 'hidden',
  },
  sidebar: {
    backgroundColor: '#0f172a',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s ease, opacity 0.2s ease',
    overflow: 'hidden',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '16px 14px 12px 14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    padding: '2px 7px',
    borderRadius: '10px',
  },
  btnNuevaPlanif: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 12px',
    borderRadius: '8px',
    border: 'none',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 650,
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'background-color 0.15s ease',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '7px',
    padding: '6px 10px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '12.5px',
  },
  iconClearBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  selectFilter: {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  },
  filterPillsRow: {
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
    marginTop: '8px',
    paddingBottom: '2px',
  },
  pillBtn: {
    border: 'none',
    borderRadius: '12px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  sidebarList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sidebarEmpty: {
    textAlign: 'center',
    padding: '24px 10px',
    fontSize: '12.5px',
    color: '#64748b',
  },
  planifCard: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  planifCardTitle: {
    fontSize: '13px',
    fontWeight: 650,
    color: '#f1f5f9',
    lineHeight: '1.3',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  planifCardStudent: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    color: '#93c5fd',
    marginTop: '4px',
  },
  planifCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '6px',
  },
  planifCardDate: {
    fontSize: '11px',
    color: '#94a3b8',
    display: 'inline-flex',
    alignItems: 'center',
  },
  hasFeedbackIndicator: {
    fontSize: '10.5px',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '10.5px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '10px',
    border: '1px solid',
    whiteSpace: 'nowrap',
  },

  // Panel Central del Chat
  chatPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0c1322',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  chatHeader: {
    height: '56px',
    padding: '0 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    flexShrink: 0,
  },
  chatTitle: {
    margin: 0,
    fontSize: '14.5px',
    fontWeight: 700,
    color: '#ffffff',
  },
  chatSubtitle: {
    margin: '1px 0 0 0',
    fontSize: '11px',
    color: '#94a3b8',
  },
  sparkleWrap: {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconToggleBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
  },
  btnFormalizarHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '7px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: 650,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
  },
  btnToggleDocPanel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '7px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  aiReviewBanner: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderBottom: '1px solid rgba(124, 58, 237, 0.3)',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },

  // Área de Mensajes
  chatMessagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  messagesContainer: {
    maxWidth: '820px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  avatarBot: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
  },
  avatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
  },
  bubbleBot: {
    backgroundColor: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  bubbleUser: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  bubbleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  senderName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#94a3b8',
  },
  timestamp: {
    fontSize: '11px',
    color: '#64748b',
    display: 'inline-flex',
    alignItems: 'center',
  },
  bubbleContent: {
    wordBreak: 'break-word',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#818cf8',
    animation: 'pulse 1s infinite',
  },
  chatLoadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#6366f1',
    animation: 'spin 0.8s linear infinite',
  },
  emptyPromptState: {
    textAlign: 'center',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  chatErrorBanner: {
    maxWidth: '820px',
    margin: '0 auto 8px auto',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  btnRetryChat: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: 650,
    cursor: 'pointer',
  },

  // Chips de preguntas sugeridas
  chipsSection: {
    padding: '4px 20px',
    maxWidth: '820px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  chipsScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  promptChip: {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    borderRadius: '16px',
    padding: '4px 10px',
    fontSize: '11.5px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Input Box Flotante ChatGPT-like
  chatInputWrapper: {
    padding: '10px 20px 14px 20px',
    maxWidth: '860px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  chatInputBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#131e3a',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '14px',
    padding: '8px 12px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  },
  clipBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s ease',
  },
  chatTextarea: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '13.5px',
    lineHeight: '1.4',
    resize: 'none',
    maxHeight: '120px',
  },
  sendBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
  },

  // Pantalla Inicial "Nueva Planificación"
  newPlanifWelcome: {
    maxWidth: '720px',
    margin: '20px auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  welcomeHero: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroSparkle: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)',
  },
  heroTitle: {
    margin: '0 0 6px 0',
    fontSize: '22px',
    fontWeight: 800,
    color: '#ffffff',
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '13.5px',
    color: '#94a3b8',
    lineHeight: '1.5',
    maxWidth: '560px',
  },
  uploadCard: {
    backgroundColor: '#131e3a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: 650,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#ffffff',
    fontSize: '13.5px',
    outline: 'none',
    maxWidth: '220px',
    cursor: 'pointer',
  },
  dropzoneBox: {
    border: '2px dashed',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    margin: '12px 0 16px 0',
    transition: 'all 0.15s ease',
  },
  dropzoneIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 10px auto',
  },
  errorNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ef4444',
    fontSize: '12.5px',
    marginBottom: '12px',
  },
  btnSubmitUpload: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
    transition: 'background-color 0.15s ease',
  },
  gridEjesInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  cardEjeMini: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  // Panel Derecho (NotebookLM style)
  docPanel: {
    backgroundColor: '#0f172a',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s ease, opacity 0.2s ease',
    overflow: 'hidden',
    flexShrink: 0,
  },
  docPanelHeader: {
    height: '56px',
    padding: '0 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  docTabsRow: {
    display: 'flex',
    gap: '4px',
  },
  docTabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 10px',
    fontSize: '12.5px',
    fontWeight: 650,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  iconCloseDocBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  docPanelContent: {
    flex: 1,
    overflowY: 'auto',
  },
  pdfToolbar: {
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pdfFileName: {
    fontSize: '12px',
    color: '#cbd5e1',
    maxWidth: '280px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  openExternalBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#60a5fa',
    textDecoration: 'none',
    padding: '3px 7px',
    borderRadius: '4px',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  iframeWrapper: {
    flex: 1,
    height: '100%',
    backgroundColor: '#ffffff',
  },
  pdfIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },

  // Dictamen Docente
  dictamenTabContent: {
    padding: '16px',
  },
  dictamenSectionTitle: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
  },
  dictamenSectionDesc: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  evalFormBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  btnDecision: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    borderRadius: '8px',
    border: '1.5px solid',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  textareaFeedback: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.45',
  },
  evalSuccessAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    fontSize: '12.5px',
    fontWeight: 600,
  },
  btnGuardarEval: {
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '6px',
  },
  studentDictamenCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '16px',
  },
  dictamenStatusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  retroalimentacionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '6px',
  },

  // Ejes UBB
  dimensionesTabContent: {
    padding: '16px',
  },
  ejeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  ejeCardText: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.45',
  },
};

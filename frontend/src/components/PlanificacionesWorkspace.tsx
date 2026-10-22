import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  Plus,
  BookOpen,
  Target,
  Award,
  Layers,
  Copy,
  Check,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  '¿Cómo puedo mejorar el inicio para activar conocimientos previos?',
  '¿Mi propuesta cumple con los principios del DUA (Decreto 83)?',
  '¿Qué errores didácticos o conceptuales típicos debo anticipar en este tema?',
  '¿Los tiempos de la matriz tienen coherencia con las actividades de cierre?',
  '¿Qué técnica o instrumento de evaluación formativa me recomiendas?',
];

export const PlanificacionesWorkspace: React.FC = () => {
  const navigate = useNavigate();
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

  // Control de paneles: Sidebar izquierda y Drawer flotante derecho para PDF
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [docPanelOpen, setDocPanelOpen] = useState<boolean>(false); // En ChatGPT puro, el visor es bajo demanda
  const [docActiveTab, setDocActiveTab] = useState<'pdf' | 'dictamen' | 'dimensiones'>('pdf');

  // Control de tamaño y arrastre manual del Drawer de PDF
  const [drawerWidth, setDrawerWidth] = useState<number>(580);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const prevWidthRef = useRef<number>(580);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const minW = 380;
      const maxW = Math.max(window.innerWidth - 60, 500);
      const clamped = Math.min(Math.max(newWidth, minW), maxW);
      setDrawerWidth(clamped);
      if (clamped >= maxW - 20) {
        setIsMaximized(true);
      } else {
        setIsMaximized(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [isDragging]);

  const toggleMaximizeDrawer = () => {
    if (isMaximized) {
      setDrawerWidth(prevWidthRef.current || 580);
      setIsMaximized(false);
    } else {
      prevWidthRef.current = drawerWidth;
      setDrawerWidth(Math.min(window.innerWidth - 60, 1280));
      setIsMaximized(true);
    }
  };

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
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Formalización de entrega
  const [isFormalizing, setIsFormalizing] = useState<boolean>(false);

  // Evaluación docente (si un docente accede a la vista)
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

  // Manejo del cambio de texto con auto-expand en textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  // Copiar respuesta del bot
  const handleCopyMessage = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
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
    if (!window.confirm('¿Deseas enviar esta planificación a revisión de tu profesor guía? Una vez confirmada, quedará en estado de entrega formal.')) {
      return;
    }

    setIsFormalizing(true);
    try {
      const formalizada = await formalizarPlanificacion(planificacionActiva.id, user?.email);
      setPlanificaciones((prev) =>
        prev.map((p) => (p.id === formalizada.id ? formalizada : p))
      );
      alert('¡Planificación formalizada! Ahora se encuentra disponible para evaluación docente.');
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

  // Filtros de búsqueda
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

  const primerNombre = user?.fullName ? user.fullName.split(' ')[0] : 'Profesor(a) en Formación';

  return (
    <div style={styles.workspaceContainer}>
      {/* ======================================================== */}
      {/* 1. SIDEBAR IZQUIERDA: HISTORIAL DE CLASES ESTILO CHATGPT */}
      {/* ======================================================== */}
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarOpen ? '280px' : '0px',
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
        }}
      >
        <div style={styles.sidebarHeader}>
          {/* Botón Principal: Nueva Planificación */}
          {esEstudiante && (
            <button
              onClick={() => setSelectedPlanId('NEW')}
              style={{
                ...styles.btnNuevaPlanif,
                backgroundColor: selectedPlanId === 'NEW' ? '#1d4ed8' : '#2563eb',
              }}
            >
              <Plus size={16} />
              <span>Nueva Planificación</span>
            </button>
          )}

          {/* Buscador Rápido */}
          <div style={styles.searchBox}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder={esDocente ? 'Buscar por alumno o tema...' : 'Buscar en mis clases...'}
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

        {/* Lista de Clases / Sesiones */}
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
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                    borderColor: isSelected ? '#3b82f6' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
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

        {/* Footer del Sidebar: Perfil y Dashboard */}
        <div style={styles.sidebarFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={styles.userAvatarMini}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.userNameMini}>{user?.fullName || 'Estudiante'}</div>
              <div style={styles.userEmailMini}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={styles.btnVolverDashboard}
            title="Volver al Dashboard principal"
          >
            <ArrowLeft size={14} />
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. ÁREA CENTRAL: CANVAS CONVERSACIONAL PURO (CHATGPT-STYLE) */}
      {/* ======================================================== */}
      <main style={styles.chatPanel}>
        {/* Header Superior Flotante y Limpio */}
        <header style={styles.chatHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={styles.iconToggleBtn}
              title={sidebarOpen ? 'Ocultar barra lateral' : 'Mostrar historial de clases'}
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
                    ? 'Nueva Planificación'
                    : planificacionActiva
                    ? planificacionActiva.nombreArchivo || planificacionActiva.archivo?.split('/').pop() || `Planificación #${planificacionActiva.id}`
                    : 'RetroPlani Mate V3'}
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
            </div>
          </div>

          {/* Acciones del Header Superior */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Si está en revisión formativa: Botón de Formalizar Entrega */}
            {esEstudiante && planificacionActiva?.estado === 'EN_REVISION_IA' && (
              <button
                onClick={handleFormalizar}
                disabled={isFormalizing}
                style={styles.btnFormalizarHeader}
                title="Confirmar entrega para que tu profesor la evalúe formalmente"
              >
                <Sparkles size={14} />
                <span>{isFormalizing ? 'Formalizando...' : 'Confirmar Entrega al Profesor'}</span>
              </button>
            )}

            {/* Botón para abrir el Visor de Documento PDF en Drawer Deslizante */}
            {planificacionActiva && (
              <button
                onClick={() => setDocPanelOpen(true)}
                style={styles.btnVerDocumento}
                title="Abrir visor de planificación PDF y dictamen"
              >
                <FileText size={16} color="#60a5fa" />
                <span>Ver Documento PDF</span>
              </button>
            )}
          </div>
        </header>

        {/* Banner de Estado Pedagógico (si está en revisión IA) */}
        {planificacionActiva?.estado === 'EN_REVISION_IA' && (
          <div style={styles.aiReviewBanner}>
            <Sparkles size={15} color="#a855f7" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '12.5px', color: '#c084fc' }}>
              <strong>Modo Revisión Formativa:</strong> Tu clase está siendo retroalimentada por RetroPlani Mate V3. Dialoga con el bot, revisa tus anexos y pulsa <strong>"Confirmar Entrega al Profesor"</strong> cuando desees que el docente la califique.
            </div>
          </div>
        )}

        {/* Contenedor Scrolleable de Mensajes */}
        <div style={styles.chatMessagesArea}>
          {selectedPlanId === 'NEW' ? (
            /* ======================================================== */
            /* PANTALLA INICIAL: BIENVENIDA Y CARGA DE CLASE (CHATGPT) */
            /* ======================================================== */
            <div style={styles.newPlanifWelcome}>
              <div style={styles.welcomeHero}>
                <div style={styles.heroSparkle}>
                  <Sparkles size={30} color="#ffffff" />
                </div>
                <h2 style={styles.heroTitle}>Hola, {primerNombre}</h2>
                <p style={styles.heroSubtitle}>
                  ¿Qué clase de matemática prepararemos hoy? Sube tu planificación en PDF y RetroPlani Mate V3 analizará tu Inicio, Desarrollo, Cierre, DUA y Evaluación Formativa.
                </p>
              </div>

              {/* Tarjeta de Subida Centrada */}
              <form onSubmit={handleUploadNew} style={styles.uploadCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <label style={styles.inputLabel}>
                    <Calendar size={14} color="#60a5fa" />
                    <span>Fecha programada de la clase:</span>
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
                    borderColor: newFile ? '#3b82f6' : 'rgba(255, 255, 255, 0.18)',
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
                    <Upload size={22} color={newFile ? '#60a5fa' : '#94a3b8'} />
                  </div>
                  {newFile ? (
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#60a5fa', fontSize: '14px' }}>
                        📄 {newFile.name}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Clic para cambiar archivo</span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 650, color: '#f8fafc', fontSize: '14px' }}>
                        Arrastra tu archivo PDF o haz clic aquí
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Formatos soportados: Planificación pedagógica en PDF (Máx 50MB)
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
                      <span>Analizando planificación didáctica...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Comenzar Tutoría Didáctica</span>
                    </>
                  )}
                </button>
              </form>

              {/* 4 Ejes Didácticos UBB */}
              <div style={styles.gridEjesInfo}>
                <div style={styles.cardEjeMini}>
                  <Target size={16} color="#60a5fa" />
                  <strong>Coherencia Curricular</strong>
                  <p>Alineación de Objetivos de Aprendizaje, Inicio, Desarrollo y Cierre.</p>
                </div>
                <div style={styles.cardEjeMini}>
                  <Layers size={16} color="#34d399" />
                  <strong>Metodología Activa</strong>
                  <p>Didáctica de la matemática, problematización y razonamiento activo.</p>
                </div>
                <div style={styles.cardEjeMini}>
                  <Award size={16} color="#fbbf24" />
                  <strong>DUA (Decreto 83)</strong>
                  <p>Múltiples formas de representación, expresión y motivación escolar.</p>
                </div>
                <div style={styles.cardEjeMini}>
                  <CheckCircle2 size={16} color="#c084fc" />
                  <strong>Evaluación Formativa</strong>
                  <p>Instrumentos para verificar el aprendizaje clase a clase y anticipar errores.</p>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* HISTORIAL DE DIÁLOGO PEDAGÓGICO CENTRADO (CHATGPT) */
            /* ======================================================== */
            <div style={styles.messagesContainer}>
              {isLoadingChat ? (
                <div style={styles.chatLoadingState}>
                  <div style={styles.spinner} />
                  <h3 style={{ margin: '12px 0 4px 0', fontSize: '15px', color: '#f8fafc' }}>
                    Recuperando sesión pedagógica...
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                    Sincronizando observaciones formativas con el motor de inferencia UBB
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
                          <span style={styles.senderName}>{isUser ? 'Tú' : 'RetroPlani Mate V3'}</span>
                          {msg.createdAt && (
                            <span style={styles.timestamp}>
                              <Clock size={11} style={{ marginRight: '3px' }} />
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {/* Renderizado formateado con tablas y enlaces limpios */}
                        <div style={styles.bubbleContent}>
                          <FormattedText content={msg.content} isUser={isUser} />
                        </div>

                        {/* Botón Copiar al pie de la respuesta del bot */}
                        {!isUser && (
                          <div style={styles.msgFooterActions}>
                            <button
                              onClick={() => handleCopyMessage(msg.id || idx, msg.content)}
                              style={styles.copyBtn}
                              title="Copiar respuesta pedagógica"
                            >
                              {copiedMsgId === (msg.id || idx) ? (
                                <>
                                  <Check size={12} color="#4ade80" />
                                  <span style={{ color: '#4ade80', fontSize: '11px' }}>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} color="#94a3b8" />
                                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
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

              {/* Indicador de reflexión activa */}
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

        {/* Sugerencias Rápidas (Chips Socráticos) */}
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

        {/* ======================================================== */}
        {/* BARRA DE ENTRADA INFERIOR FLOTANTE (ESTILO CHATGPT PURO) */}
        {/* ======================================================== */}
        {selectedPlanId !== 'NEW' && (
          <div style={styles.chatInputWrapper}>
            <div style={styles.chatInputBox}>
              {/* Botón de Adjuntar Versión PDF */}
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
                onChange={handleTextareaChange}
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
                  opacity: !chatInput.trim() || isSendingMsg ? 0.4 : 1,
                }}
                title="Enviar mensaje (Enter)"
              >
                <Send size={15} />
              </button>
            </div>

            {/* Disclaimer pedagógico al pie */}
            <div style={styles.disclaimerText}>
              RetroPlani Mate V3 apoya tu diseño didáctico. Valida siempre las propuestas con tu Profesor Guía y las Bases Curriculares.
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 3. SLIDE-OVER DRAWER: VISOR PDF & DICTAMEN (BAJO DEMANDA) */}
      {/* ======================================================== */}
      {docPanelOpen && (
        <div
          onClick={() => setDocPanelOpen(false)}
          style={styles.drawerBackdrop}
        />
      )}

      {planificacionActiva && (
        <aside
          style={{
            ...styles.slideOverDrawer,
            width: `${drawerWidth}px`,
            maxWidth: '96vw',
            transform: docPanelOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.2s ease',
          }}
        >
          {/* Manija de Arrastre / Redimensionamiento Manual */}
          <div
            onMouseDown={handleMouseDownResize}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '10px',
              cursor: 'col-resize',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.4)' : 'transparent',
              transition: 'background-color 0.15s ease',
            }}
            title="Arrastra horizontalmente para ajustar el ancho del visor"
          >
            <div
              style={{
                width: '3px',
                height: '36px',
                borderRadius: '2px',
                backgroundColor: isDragging ? '#60a5fa' : 'rgba(255, 255, 255, 0.2)',
              }}
            />
          </div>

          {/* Header del Drawer */}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Botón Maximizar / Restaurar */}
              <button
                onClick={toggleMaximizeDrawer}
                style={styles.iconCloseDocBtn}
                title={isMaximized ? 'Restaurar tamaño normal' : 'Maximizar ancho'}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                onClick={() => setDocPanelOpen(false)}
                style={styles.iconCloseDocBtn}
                title="Cerrar visor"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Contenido del Drawer */}
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
                    <span>Abrir PDF Completo</span>
                  </a>
                </div>

                <div style={{ ...styles.iframeWrapper, position: 'relative' }}>
                  {/* Escudo protector transparente para no perder eventos del mouse durante arrastre */}
                  {isDragging && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 20,
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                      }}
                    />
                  )}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  <div style={styles.ejeCard}>
                    <strong style={{ color: '#60a5fa' }}>1. Coherencia Curricular</strong>
                    <p style={styles.ejeCardText}>
                      Alineación estricta entre Objetivos de Aprendizaje (OA), indicadores de logro y actividades de los tres momentos de la clase (Inicio, Desarrollo y Cierre).
                    </p>
                  </div>
                  <div style={styles.ejeCard}>
                    <strong style={{ color: '#34d399' }}>2. Metodología Activa</strong>
                    <p style={styles.ejeCardText}>
                      Enfoque centrado en la resolución de problemas, conjeturación, argumentación y rol protagónico del estudiante escolar.
                    </p>
                  </div>
                  <div style={styles.ejeCard}>
                    <strong style={{ color: '#fbbf24' }}>3. DUA e Inclusión (Decreto 83)</strong>
                    <p style={styles.ejeCardText}>
                      Garantía de múltiples formas de representación (concreto, pictórico, simbólico), acción y expresión, y motivación.
                    </p>
                  </div>
                  <div style={styles.ejeCard}>
                    <strong style={{ color: '#c084fc' }}>4. Evaluación Formativa</strong>
                    <p style={styles.ejeCardText}>
                      Estrategias continuas de comprobación del aprendizaje (tickets de salida, rúbricas) y anticipación explícita de obstáculos didácticos.
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
// COMPONENTE AUXILIAR PARA FORMATO MARKDOWN, TABLAS Y PILLS DE ENLACE
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

    // Detección de tablas Markdown con tolerancia a saltos dobles
    if (isTableRow(trimmed)) {
      const tableLines: string[] = [trimmed];
      let j = i + 1;

      while (j < rawLines.length) {
        const nextTrimmed = rawLines[j].trim();
        if (isTableRow(nextTrimmed)) {
          tableLines.push(nextTrimmed);
          j++;
        } else if (nextTrimmed === '') {
          let k = j + 1;
          while (k < rawLines.length && rawLines[k].trim() === '') k++;
          if (k < rawLines.length && isTableRow(rawLines[k].trim())) {
            j = k;
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
    <div style={{ lineHeight: '1.65', fontSize: '14px' }}>
      {blocks.map((block, idx) => {
        if (block.type === 'spacer') {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        if (block.type === 'heading') {
          if (block.level === 3) {
            return (
              <h4
                key={idx}
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: isUser ? '#ffffff' : '#93c5fd',
                  margin: '14px 0 4px 0',
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
                fontSize: '16px',
                fontWeight: 700,
                color: isUser ? '#ffffff' : '#60a5fa',
                margin: '16px 0 6px 0',
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
                margin: '3px 0 3px 6px',
              }}
            >
              <span style={{ color: isUser ? '#ffffff' : '#818cf8', fontSize: '15px', lineHeight: '1.4' }}>•</span>
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
                margin: '4px 0 4px 6px',
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
                paddingLeft: '12px',
                color: isUser ? '#e0e7ff' : '#cbd5e1',
                fontStyle: 'italic',
                margin: '10px 0',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '0 6px 6px 0',
                padding: '6px 10px',
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
                margin: '14px 0',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                overflowX: 'auto',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
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

        return (
          <p key={idx} style={{ margin: '4px 0', color: isUser ? '#ffffff' : '#e2e8f0' }}>
            {renderInlineStyles(block.text, isUser)}
          </p>
        );
      })}
    </div>
  );
};

function renderInlineStyles(text: string, isUser = false): React.ReactNode {
  const regex = /(\[.*?\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s)\]<>"']+|\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

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

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: isUser ? '#ffffff' : '#f8fafc' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

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

    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

// ========================================================
// ESTILOS EN LÍNEA (CHATGPT PURO CONVERGENCE)
// ========================================================
const styles: { [key: string]: React.CSSProperties } = {
  workspaceContainer: {
    display: 'flex',
    height: 'calc(100vh - 64px)',
    backgroundColor: '#0b1329',
    color: '#f8fafc',
    overflow: 'hidden',
    position: 'relative',
  },

  // 1. Sidebar Izquierda
  sidebar: {
    backgroundColor: '#0f172a',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
    overflow: 'hidden',
    flexShrink: 0,
    zIndex: 20,
  },
  sidebarHeader: {
    padding: '16px 14px 12px 14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  btnNuevaPlanif: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    color: '#ffffff',
    fontSize: '13.5px',
    fontWeight: 650,
    cursor: 'pointer',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.15s ease',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
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
    gap: '4px',
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
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  planifCardTitle: {
    fontSize: '13px',
    fontWeight: 650,
    color: '#f1f5f9',
    lineHeight: '1.3',
    maxWidth: '150px',
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
  sidebarFooter: {
    padding: '12px 14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  userAvatarMini: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '13px',
    flexShrink: 0,
  },
  userNameMini: {
    fontSize: '12.5px',
    fontWeight: 650,
    color: '#f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userEmailMini: {
    fontSize: '11px',
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  btnVolverDashboard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'none',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#94a3b8',
    padding: '6px',
    fontSize: '11.5px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // 2. Área Central (Canvas ChatGPT Puro)
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
    padding: '0 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    flexShrink: 0,
    zIndex: 10,
  },
  chatTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    maxWidth: '340px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    borderRadius: '8px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: 650,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
  },
  btnVerDocumento: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    color: '#93c5fd',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  aiReviewBanner: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderBottom: '1px solid rgba(124, 58, 237, 0.25)',
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },

  // Área Scrolleable y Contenedor Centrado
  chatMessagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 20px 10px 20px',
  },
  messagesContainer: {
    maxWidth: '820px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  avatarBot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
    marginTop: '2px',
  },
  avatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  bubble: {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '14px',
  },
  bubbleBot: {
    backgroundColor: '#162036',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  bubbleUser: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
  },
  bubbleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
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
  msgFooterActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: '8px',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'background-color 0.15s ease',
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
    padding: '60px 20px',
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
    padding: '60px 20px',
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

  // Chips Socráticos
  chipsSection: {
    padding: '0 20px 8px 20px',
    maxWidth: '820px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  chipsScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  promptChip: {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    borderRadius: '16px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Input Box Flotante ChatGPT Omnipresente
  chatInputWrapper: {
    padding: '0 20px 14px 20px',
    maxWidth: '860px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  chatInputBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#162036',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '24px',
    padding: '10px 14px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
  },
  clipBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
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
    fontSize: '14px',
    lineHeight: '1.45',
    resize: 'none',
    maxHeight: '150px',
  },
  sendBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
    flexShrink: 0,
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#64748b',
    marginTop: '6px',
  },

  // Pantalla Inicial "Nueva Planificación"
  newPlanifWelcome: {
    maxWidth: '720px',
    margin: '30px auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  welcomeHero: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroSparkle: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
  },
  heroTitle: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    fontWeight: 800,
    color: '#ffffff',
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.5',
    maxWidth: '580px',
  },
  uploadCard: {
    backgroundColor: '#131e3a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    padding: '22px',
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
    padding: '26px',
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

  // 3. Slide-Over Drawer para PDF & Dictamen
  drawerBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(3px)',
    zIndex: 40,
  },
  slideOverDrawer: {
    position: 'fixed',
    top: '64px',
    bottom: 0,
    right: 0,
    width: 'min(580px, 92vw)',
    backgroundColor: '#0f172a',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.65)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: 'hidden',
  },
  docPanelHeader: {
    height: '56px',
    padding: '0 14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    backgroundColor: '#0b1329',
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
    padding: '8px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pdfFileName: {
    fontSize: '12px',
    color: '#cbd5e1',
    maxWidth: '320px',
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
    padding: '3px 8px',
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

  // Dictamen y Ejes en Drawer
  dictamenTabContent: {
    padding: '20px',
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
  dimensionesTabContent: {
    padding: '20px',
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

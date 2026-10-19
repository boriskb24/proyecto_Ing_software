import React, { useState, useEffect, useRef } from 'react';
import {
  initChatSession,
  sendChatMessage,
  ChatSessionDto,
  ChatMessageDto,
  Planificacion,
} from '../services/api';
import {
  Sparkles,
  Send,
  X,
  RefreshCw,
  AlertCircle,
  Bot,
  User,
  Lightbulb,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface RetroPlaniChatDrawerProps {
  planificacion: Planificacion | null;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  '¿Cómo puedo mejorar el inicio para activar conocimientos previos?',
  '¿Mi propuesta cumple con los principios del DUA (Decreto 83)?',
  '¿Qué errores didácticos o conceptuales típicos debo anticipar?',
  '¿Los recursos y guías tienen coherencia con los tiempos de la matriz?',
  '¿Qué técnica o instrumento de evaluación formativa me recomiendas?',
];

export const RetroPlaniChatDrawer: React.FC<RetroPlaniChatDrawerProps> = ({
  planificacion,
  onClose,
}) => {
  const [session, setSession] = useState<ChatSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusyLimit, setIsBusyLimit] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al final del historial de mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Cargar o inicializar sesión pedagógica al abrir el drawer
  const inicializarSesion = async () => {
    if (!planificacion) return;

    setIsLoadingSession(true);
    setErrorMessage(null);
    setIsBusyLimit(false);

    try {
      const data = await initChatSession(planificacion.id);
      setSession(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Error al conectar con el tutor pedagógico IA.';

      if (status === 503 || msg.includes('límite') || msg.includes('concurrencia')) {
        setIsBusyLimit(true);
        setErrorMessage(
          'El servidor de inferencia pedagógica está temporalmente saturado atendiendo otras consultas concurrentes. Por favor, espera unos segundos y pulsa "Reintentar".'
        );
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    if (planificacion) {
      inicializarSesion();
    } else {
      setSession(null);
      setMessages([]);
      setInputValue('');
      setErrorMessage(null);
      setIsBusyLimit(false);
    }
  }, [planificacion?.id]);

  // Enviar mensaje al backend
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!text || !session || isSending) return;

    setErrorMessage(null);
    setIsBusyLimit(false);

    // Mensaje optimista en la UI
    const tempUserMsg: ChatMessageDto = {
      id: Date.now(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const responseMsg = await sendChatMessage(session.sessionId, text);
      setMessages((prev) => [...prev, responseMsg]);
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'No se pudo procesar la consulta pedagógica.';

      if (status === 503 || msg.includes('límite') || msg.includes('concurrencia')) {
        setIsBusyLimit(true);
        setErrorMessage(
          'El motor de IA está procesando solicitudes en paralelo al límite. Tu mensaje no se perdió, pulsa "Reintentar" en breve.'
        );
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!planificacion) return null;

  const planName =
    planificacion.nombreArchivo ||
    planificacion.archivo?.split('/').pop() ||
    `Planificación #${planificacion.id}`;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <aside
        style={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        aria-label="Tutor IA RetroPlani Mate V3"
      >
        {/* Cabecera del Drawer */}
        <header style={styles.header}>
          <div style={styles.headerTitleRow}>
            <div style={styles.titleWithIcon}>
              <div style={styles.sparkleBadge}>
                <Sparkles size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={styles.title}>RetroPlani Mate V3</h2>
                  <span style={styles.versionTag}>UBB IA</span>
                </div>
                <p style={styles.subtitle}>
                  Tutor Pedagógico Socrático • Didáctica de la Matemática
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={styles.closeBtn}
              title="Cerrar panel de tutoría"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Ficha contextual del documento analizado */}
          <div style={styles.docContextCard}>
            <div style={styles.docContextRow}>
              <FileText size={15} color="#4338ca" />
              <span style={styles.docName} title={planName}>
                {planName}
              </span>
              {session?.totalPaginas ? (
                <span style={styles.pageBadge}>
                  📄 {session.totalPaginas} {session.totalPaginas === 1 ? 'pág.' : 'págs.'} analizadas
                </span>
              ) : null}
            </div>
            <div style={styles.dimensionPillsRow}>
              <span style={styles.dimensionPill}>🎯 Coherencia Curricular</span>
              <span style={styles.dimensionPill}>⚙️ Metodología Activa</span>
              <span style={styles.dimensionPill}>🤝 DUA / Decreto 83</span>
              <span style={styles.dimensionPill}>📊 Eval. Formativa</span>
            </div>
          </div>
        </header>

        {/* Cuerpo de Mensajes */}
        <div style={styles.messagesContainer}>
          {isLoadingSession ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <h3 style={styles.loadingTitle}>Analizando documento pedagógico...</h3>
              <p style={styles.loadingDesc}>
                Extrayendo matriz didáctica, diapositivas de clase y guías de trabajo para
                evaluar los 4 ejes pedagógicos UBB.
              </p>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div style={styles.emptyPromptState}>
                  <Lightbulb size={32} color="#818cf8" />
                  <p style={styles.emptyPromptTitle}>Sesión iniciada sin mensajes previos</p>
                  <p style={styles.emptyPromptSubtitle}>
                    Escribe tu consulta o selecciona uno de los temas sugeridos abajo para
                    reflexionar sobre tu planificación.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === 'USER';
                  return (
                    <div
                      key={msg.id || index}
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
                        {/* Remitente y timestamp */}
                        <div style={styles.bubbleMeta}>
                          <span style={isUser ? styles.senderUser : styles.senderBot}>
                            {isUser ? 'Tú (Docente en Formación)' : 'RetroPlani Mate (Tutor IA)'}
                          </span>
                          {msg.createdAt && (
                            <span style={styles.timestamp}>
                              <Clock size={11} style={{ marginRight: '3px' }} />
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        {/* Contenido con formateo limpio de párrafos y markdown */}
                        <div style={styles.bubbleContent}>
                          <FormattedContent content={msg.content} isUser={isUser} />
                        </div>

                        {/* Auditoría de tokens pedagógicos */}
                        {!isUser && (msg.promptTokens || msg.completionTokens) ? (
                          <div style={styles.tokenFooter}>
                            <ShieldCheck size={12} color="#94a3b8" />
                            <span>
                              Evaluado con modelo socrático UBB •{' '}
                              {(msg.completionTokens || 0) + (msg.promptTokens || 0)} tokens
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {isUser && (
                        <div style={styles.avatarUser} title="Tú">
                          <User size={18} color="#ffffff" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Indicador de reflexión en curso */}
              {isSending && (
                <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                  <div style={styles.avatarBot}>
                    <Bot size={18} color="#ffffff" />
                  </div>
                  <div style={{ ...styles.bubble, ...styles.bubbleBot, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={styles.typingDot} />
                    <div style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                    <div style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                    <span style={{ fontSize: '0.82rem', color: '#6366f1', marginLeft: '6px', fontWeight: 500 }}>
                      RetroPlani está reflexionando pedagógicamente...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Alerta de Error o Saturación de Concurrencia */}
        {errorMessage && (
          <div
            style={{
              ...styles.errorBanner,
              backgroundColor: isBusyLimit ? '#fffbeb' : '#fef2f2',
              borderColor: isBusyLimit ? '#fcd34d' : '#fca5a5',
            }}
          >
            <AlertCircle size={18} color={isBusyLimit ? '#d97706' : '#dc2626'} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '0.82rem', color: isBusyLimit ? '#92400e' : '#991b1b' }}>
              {errorMessage}
            </div>
            {isBusyLimit && (
              <button
                type="button"
                onClick={() => (session ? handleSendMessage(inputValue) : inicializarSesion())}
                style={styles.retryBtn}
              >
                <RefreshCw size={13} style={{ marginRight: '4px' }} />
                Reintentar
              </button>
            )}
          </div>
        )}

        {/* Chips de Preguntas Pedagógicas Sugeridas */}
        {!isLoadingSession && (
          <div style={styles.suggestionsContainer}>
            <div style={styles.suggestionsHeader}>
              <Lightbulb size={13} color="#4f46e5" />
              <span>Sugerencias para profundizar tu reflexión:</span>
            </div>
            <div style={styles.chipsScroll}>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isSending || isLoadingSession}
                  style={styles.promptChip}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Área de Entrada del Chat */}
        <footer style={styles.footer}>
          <div style={styles.inputWrapper}>
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoadingSession || isSending}
              placeholder={
                isLoadingSession
                  ? 'Iniciando sesión con el tutor...'
                  : 'Formula una pregunta sobre tu clase, DUA o evaluación (Enter para enviar)...'
              }
              style={styles.textarea}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isSending || isLoadingSession}
              style={{
                ...styles.sendBtn,
                opacity: !inputValue.trim() || isSending || isLoadingSession ? 0.45 : 1,
                cursor: !inputValue.trim() || isSending || isLoadingSession ? 'not-allowed' : 'pointer',
              }}
              title="Enviar consulta (Enter)"
            >
              <Send size={18} color="#ffffff" />
            </button>
          </div>
          <div style={styles.inputFooterText}>
            <span>Shift + Enter para salto de línea • Enter para enviar</span>
            <span>Dochub AI v3.2</span>
          </div>
        </footer>
      </aside>
    </div>
  );
};

/**
 * Componente liviano para renderizar el contenido pedagógico con formato
 * estructurado (títulos, negritas, listas ordenadas y desordenadas) sin librerías pesadas.
 */
const FormattedContent: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{content}</div>;
  }

  const lines = content.split('\n');

  return (
    <div style={{ lineHeight: '1.6', fontSize: '0.88rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Línea vacía
        if (!trimmed) {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        // Títulos de secciones pedagógicas: ### o ## o #
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              style={{
                fontSize: '0.96rem',
                fontWeight: 700,
                color: '#1e1b4b',
                marginTop: '12px',
                marginBottom: '4px',
              }}
            >
              {renderFormattedText(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3
              key={idx}
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#312e81',
                marginTop: '14px',
                marginBottom: '6px',
                borderBottom: '1px solid #e0e7ff',
                paddingBottom: '4px',
              }}
            >
              {renderFormattedText(trimmed.replace(/^#{1,2}\s+/, ''))}
            </h3>
          );
        }

        // Elementos de lista desordenada (- o *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
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
              <span style={{ color: '#6366f1', fontSize: '0.9rem', lineHeight: '1.5' }}>•</span>
              <span style={{ flex: 1 }}>
                {renderFormattedText(trimmed.replace(/^[-*]\s+/, ''))}
              </span>
            </div>
          );
        }

        // Elementos de lista numerada (1. 2. etc)
        const matchNumbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (matchNumbered) {
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
              <span
                style={{
                  fontWeight: 700,
                  color: '#4f46e5',
                  minWidth: '18px',
                  lineHeight: '1.5',
                }}
              >
                {matchNumbered[1]}.
              </span>
              <span style={{ flex: 1 }}>{renderFormattedText(matchNumbered[2])}</span>
            </div>
          );
        }

        // Cita o bloque de reflexión (> )
        if (trimmed.startsWith('> ')) {
          return (
            <div
              key={idx}
              style={{
                borderLeft: '3px solid #818cf8',
                paddingLeft: '10px',
                color: '#4338ca',
                fontStyle: 'italic',
                margin: '6px 0',
                backgroundColor: '#f5f3ff',
                borderRadius: '0 6px 6px 0',
                padding: '4px 8px',
              }}
            >
              {renderFormattedText(trimmed.replace(/^>\s+/, ''))}
            </div>
          );
        }

        // Párrafo normal
        return (
          <p key={idx} style={{ margin: '4px 0', color: '#1e293b' }}>
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Resalta texto en negrita (**texto**) y código inline (`texto`).
 */
function renderFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: '#0f172a', fontWeight: 650 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            backgroundColor: '#e0e7ff',
            color: '#3730a3',
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '0.84em',
            fontFamily: 'monospace',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// Estilos del Drawer y UI
const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(3px)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end',
    animation: 'fadeIn 0.2s ease-out',
  },
  drawer: {
    width: '580px',
    maxWidth: '100vw',
    height: '100vh',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-6px 0 24px rgba(0, 0, 0, 0.15)',
    borderLeft: '1px solid #e2e8f0',
  },
  header: {
    padding: '16px 20px 14px 20px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sparkleBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
  },
  title: {
    margin: 0,
    fontSize: '1.12rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  versionTag: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
    padding: '2px 7px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.78rem',
    color: '#64748b',
    fontWeight: 500,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
  },
  docContextCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e7ff',
    borderRadius: '10px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  docContextRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  docName: {
    fontSize: '0.82rem',
    fontWeight: 650,
    color: '#1e293b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '300px',
  },
  pageBadge: {
    marginLeft: 'auto',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#4338ca',
    backgroundColor: '#e0e7ff',
    padding: '2px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  dimensionPillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  dimensionPill: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '2px 7px',
    borderRadius: '5px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backgroundColor: '#ffffff',
  },
  loadingState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px',
    textAlign: 'center',
  },
  spinner: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '3px solid #e0e7ff',
    borderTopColor: '#6366f1',
    animation: 'spin 0.9s linear infinite',
    marginBottom: '16px',
  },
  loadingTitle: {
    margin: '0 0 6px 0',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1e1b4b',
  },
  loadingDesc: {
    margin: 0,
    fontSize: '0.82rem',
    color: '#64748b',
    maxWidth: '380px',
    lineHeight: '1.45',
  },
  emptyPromptState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center',
  },
  emptyPromptTitle: {
    margin: '12px 0 4px 0',
    fontSize: '0.94rem',
    fontWeight: 650,
    color: '#334155',
  },
  emptyPromptSubtitle: {
    margin: 0,
    fontSize: '0.82rem',
    color: '#64748b',
    maxWidth: '340px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  avatarBot: {
    width: '32px',
    height: '32px',
    borderRadius: '9px',
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
  },
  avatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '9px',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '85%',
    padding: '12px 14px',
    borderRadius: '12px',
    fontSize: '0.88rem',
  },
  bubbleUser: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderBottomRightRadius: '3px',
  },
  bubbleBot: {
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderBottomLeftRadius: '3px',
  },
  bubbleMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '6px',
    fontSize: '0.72rem',
  },
  senderUser: {
    fontWeight: 700,
    color: '#bfdbfe',
  },
  senderBot: {
    fontWeight: 700,
    color: '#4f46e5',
  },
  timestamp: {
    color: '#94a3b8',
    display: 'inline-flex',
    alignItems: 'center',
  },
  bubbleContent: {
    wordBreak: 'break-word',
  },
  tokenFooter: {
    marginTop: '10px',
    paddingTop: '6px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.7rem',
    color: '#94a3b8',
  },
  typingDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    animation: 'pulse 1s infinite',
  },
  errorBanner: {
    margin: '0 20px 8px 20px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  retryBtn: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 650,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  suggestionsContainer: {
    padding: '10px 20px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
  },
  suggestionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.74rem',
    fontWeight: 650,
    color: '#4f46e5',
    marginBottom: '6px',
  },
  chipsScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  promptChip: {
    whiteSpace: 'nowrap',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#334155',
    borderRadius: '20px',
    padding: '5px 12px',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  footer: {
    padding: '14px 20px 16px 20px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  inputWrapper: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.86rem',
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: '1.4',
    color: '#0f172a',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#6366f1',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  inputFooterText: {
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: '#94a3b8',
  },
};

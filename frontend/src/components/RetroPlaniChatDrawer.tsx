import React, { useState, useEffect, useRef } from 'react';
import {
  initChatSession,
  sendChatMessage,
  formalizarPlanificacion,
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
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface RetroPlaniChatDrawerProps {
  planificacion: Planificacion | null;
  onClose: () => void;
  onFormalizar?: (planificacion: Planificacion) => void;
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
  onFormalizar,
}) => {
  const [currentPlan, setCurrentPlan] = useState<Planificacion | null>(planificacion);
  const [session, setSession] = useState<ChatSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isFormalizing, setIsFormalizing] = useState<boolean>(false);
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
    setCurrentPlan(planificacion);
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

  // Formalizar entrega de planificación al profesor (Filtro Pre-Entrega)
  const handleFormalizar = async () => {
    if (!currentPlan || isFormalizing) return;
    setIsFormalizing(true);
    setErrorMessage(null);
    try {
      const userStr = localStorage.getItem('user');
      let userEmail: string | undefined = undefined;
      if (userStr) {
        try {
          userEmail = JSON.parse(userStr).email;
        } catch (e) {
          // ignore
        }
      }
      const formalizada = await formalizarPlanificacion(currentPlan.id, userEmail);
      setCurrentPlan(formalizada);
      if (onFormalizar) {
        onFormalizar(formalizada);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Error al formalizar la entrega de la planificación.';
      setErrorMessage(msg);
    } finally {
      setIsFormalizing(false);
    }
  };

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
        </header>

        {/* Banner de Estado y Filtro Pre-Entrega */}
        {currentPlan?.estado === 'EN_REVISION_IA' && (
          <div style={styles.preSubmissionBanner}>
            <div style={styles.preSubmissionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                <strong style={styles.preSubmissionTitle}>Filtro Pre-Entrega: En Revisión IA</strong>
              </div>
              <span style={styles.preSubmissionBadge}>Aún no visible para profesor</span>
            </div>
            <p style={styles.preSubmissionText}>
              Esta planificación se encuentra en evaluación con el Tutor IA. Revisa las sugerencias didácticas y, cuando estés conforme con tu clase, formaliza la entrega al docente.
            </p>
            <button
              type="button"
              onClick={handleFormalizar}
              disabled={isFormalizing || isLoadingSession}
              style={{
                ...styles.formalizarBtn,
                opacity: isFormalizing || isLoadingSession ? 0.65 : 1,
                cursor: isFormalizing || isLoadingSession ? 'not-allowed' : 'pointer',
              }}
              title="Formalizar entrega para que sea revisada y evaluada por tu profesor"
            >
              {isFormalizing ? (
                <>
                  <div style={styles.miniSpinner} />
                  <span>Formalizando entrega al profesor...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '1rem' }}>🚀</span>
                  <span>Confirmar y Formalizar Entrega al Profesor</span>
                </>
              )}
            </button>
          </div>
        )}

        {currentPlan?.estado === 'PENDIENTE' && (
          <div style={styles.formalizadoBanner}>
            <ShieldCheck size={18} color="#15803d" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: '#166534' }}>
              <strong>Entrega formalizada:</strong> Tu documento ya está en la bandeja del profesor en estado <strong>PENDIENTE</strong> de evaluación. Puedes continuar interactuando con el tutor.
            </div>
          </div>
        )}

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
 * estructurado (títulos, negritas, listas ordenadas, desordenadas y tablas Markdown) sin librerías pesadas.
 */

type DrawerContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; num: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'paragraph'; text: string }
  | { type: 'spacer' };

function parseDrawerTableRow(line: string): string[] {
  let cleaned = line.trim();
  if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
  if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);
  return cleaned.split('|').map((c) => c.trim());
}

function isDrawerTableRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return false;
  return (trimmed.match(/\|/g) || []).length >= 2;
}

function isDrawerTableSeparator(line: string): boolean {
  const cells = parseDrawerTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}

function parseDrawerContentToBlocks(content: string): DrawerContentBlock[] {
  const rawLines = content.split(/\r?\n/);
  const blocks: DrawerContentBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (isDrawerTableRow(trimmed)) {
      const tableLines: string[] = [trimmed];
      let j = i + 1;

      while (j < rawLines.length) {
        const nextTrimmed = rawLines[j].trim();
        if (isDrawerTableRow(nextTrimmed)) {
          tableLines.push(nextTrimmed);
          j++;
        } else if (nextTrimmed === '') {
          let k = j + 1;
          while (k < rawLines.length && rawLines[k].trim() === '') k++;
          if (k < rawLines.length && isDrawerTableRow(rawLines[k].trim())) {
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

      if (tableLines.length >= 2 && isDrawerTableSeparator(tableLines[1])) {
        headers = parseDrawerTableRow(tableLines[0]);
        for (let r = 2; r < tableLines.length; r++) {
          if (!isDrawerTableSeparator(tableLines[r])) {
            rows.push(parseDrawerTableRow(tableLines[r]));
          }
        }
      } else if (tableLines.length >= 1) {
        const nonSep = tableLines.filter((l) => !isDrawerTableSeparator(l));
        if (nonSep.length > 0) {
          headers = parseDrawerTableRow(nonSep[0]);
          for (let r = 1; r < nonSep.length; r++) {
            rows.push(parseDrawerTableRow(nonSep[r]));
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

    const matchNumbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (matchNumbered) {
      blocks.push({ type: 'numbered', num: matchNumbered[1], text: matchNumbered[2] });
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

const FormattedContent: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{content}</div>;
  }

  const blocks = parseDrawerContentToBlocks(content);

  return (
    <div style={{ lineHeight: '1.6', fontSize: '0.88rem' }}>
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
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  color: '#1e1b4b',
                  marginTop: '12px',
                  marginBottom: '4px',
                }}
              >
                {renderFormattedText(block.text)}
              </h4>
            );
          }
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
              {renderFormattedText(block.text)}
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
              <span style={{ color: '#6366f1', fontSize: '0.9rem', lineHeight: '1.5' }}>•</span>
              <span style={{ flex: 1 }}>{renderFormattedText(block.text)}</span>
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
              <span
                style={{
                  fontWeight: 700,
                  color: '#4f46e5',
                  minWidth: '18px',
                  lineHeight: '1.5',
                }}
              >
                {block.num}.
              </span>
              <span style={{ flex: 1 }}>{renderFormattedText(block.text)}</span>
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
                color: '#4338ca',
                fontStyle: 'italic',
                margin: '6px 0',
                backgroundColor: '#f5f3ff',
                borderRadius: '0 6px 6px 0',
                padding: '4px 8px',
              }}
            >
              {renderFormattedText(block.text)}
            </div>
          );
        }

        if (block.type === 'table') {
          const colCount = Math.max(block.headers.length, ...block.rows.map((r) => r.length));

          return (
            <div
              key={idx}
              style={{
                margin: '12px 0',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                overflowX: 'auto',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                maxWidth: '100%',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                }}
              >
                {block.headers.length > 0 && (
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          style={{
                            padding: '8px 12px',
                            fontWeight: 650,
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {renderFormattedText(h)}
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
                        borderBottom: rIdx < block.rows.length - 1 ? '1px solid #f1f5f9' : 'none',
                        backgroundColor: rIdx % 2 === 1 ? '#f8fafc' : '#ffffff',
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
                              padding: '8px 12px',
                              color: isFail ? '#b91c1c' : isOk ? '#15803d' : '#334155',
                              verticalAlign: 'middle',
                            }}
                          >
                            {renderFormattedText(cell)}
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
          <p key={idx} style={{ margin: '4px 0', color: '#1e293b' }}>
            {renderFormattedText(block.text)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Resalta texto en negrita (**texto**), código inline (`texto`) y enlaces URL/Markdown.
 */
function renderFormattedText(text: string): React.ReactNode {
  const regex = /(\[.*?\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s)\]<>"']+|\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Enlace Markdown [Texto](url)
    const mdLinkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (mdLinkMatch) {
      return (
        <a
          key={i}
          href={mdLinkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          title={mdLinkMatch[2]}
          style={{
            color: '#4f46e5',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          {mdLinkMatch[1]} ↗
        </a>
      );
    }

    // URL Directa
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
      } else if (part.length > 36) {
        label = `${part.substring(0, 33)}...`;
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
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            color: '#4338ca',
            fontSize: '11.5px',
            fontWeight: 500,
            textDecoration: 'none',
            verticalAlign: 'middle',
            margin: '1px 2px',
          }}
        >
          <span>{label}</span>
          <span style={{ fontSize: '9px' }}>↗</span>
        </a>
      );
    }

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
    return <React.Fragment key={i}>{part}</React.Fragment>;
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
  preSubmissionBanner: {
    padding: '12px 18px',
    backgroundColor: '#f5f3ff',
    borderBottom: '1px solid #ddd6fe',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  preSubmissionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  preSubmissionTitle: {
    fontSize: '0.86rem',
    color: '#5b21b6',
    fontWeight: 700,
  },
  preSubmissionBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    border: '1px solid #c4b5fd',
    padding: '2px 8px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
  },
  preSubmissionText: {
    margin: 0,
    fontSize: '0.78rem',
    color: '#4c1d95',
    lineHeight: '1.4',
  },
  formalizarBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.83rem',
    fontWeight: 650,
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
    transition: 'background-color 0.15s ease',
  },
  formalizadoBanner: {
    padding: '10px 18px',
    backgroundColor: '#f0fdf4',
    borderBottom: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  miniSpinner: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    borderTopColor: '#ffffff',
    animation: 'spin 0.8s linear infinite',
  },
};

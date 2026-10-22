package com.ubb.dochub.ai.service;

import com.ubb.dochub.ai.client.LlmClient;
import com.ubb.dochub.ai.client.LlmMessage;
import com.ubb.dochub.ai.client.LlmResponse;
import com.ubb.dochub.ai.dto.ChatMessageDto;
import com.ubb.dochub.ai.dto.ChatSessionDto;
import com.ubb.dochub.ai.engine.DocumentParserService;
import com.ubb.dochub.ai.engine.InferenceRateLimiter;
import com.ubb.dochub.ai.engine.ParsedDocument;
import com.ubb.dochub.ai.engine.PedagogicalPromptEngine;
import com.ubb.dochub.entity.ChatMessage;
import com.ubb.dochub.entity.ChatSession;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.repository.ChatMessageRepository;
import com.ubb.dochub.repository.ChatSessionRepository;
import com.ubb.dochub.repository.PlanificacionRepository;
import com.ubb.dochub.service.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class RetroPlaniOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(RetroPlaniOrchestrator.class);

    private final DocumentParserService documentParserService;
    private final PedagogicalPromptEngine promptEngine;
    private final InferenceRateLimiter rateLimiter;
    private final LlmClient llmClient;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final PlanificacionRepository planificacionRepository;
    private final StorageService storageService;

    public RetroPlaniOrchestrator(
            DocumentParserService documentParserService,
            PedagogicalPromptEngine promptEngine,
            InferenceRateLimiter rateLimiter,
            LlmClient llmClient,
            ChatSessionRepository sessionRepository,
            ChatMessageRepository messageRepository,
            PlanificacionRepository planificacionRepository,
            StorageService storageService) {
        this.documentParserService = documentParserService;
        this.promptEngine = promptEngine;
        this.rateLimiter = rateLimiter;
        this.llmClient = llmClient;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.planificacionRepository = planificacionRepository;
        this.storageService = storageService;
    }

    /**
     * Obtiene una sesión existente o inicia el diagnóstico pedagógico inicial del PDF.
     */
    @Transactional
    public ChatSessionDto getOrInitSession(Long planificacionId, String userEmail, String rol) {
        // 1. Si ya existe una sesión previa de este usuario para esta planificación, la reanudamos
        var existingSession = sessionRepository
                .findFirstByPlanificacionIdAndUserEmailOrderByCreatedAtDesc(planificacionId, userEmail);

        if (existingSession.isPresent()) {
            log.info("Reanudando sesión existente ID {} para planificación {}", existingSession.get().getId(), planificacionId);
            return mapToDto(existingSession.get());
        }

        // HU-P4 y HU-P5: Si quien consulta es un PROFESOR o COORDINADOR y no tiene sesión propia,
        // permitimos acceder al registro de reflexiones pedagógicas del estudiante en esa planificación.
        if ("PROFESOR".equalsIgnoreCase(rol) || "ADMINISTRADOR".equalsIgnoreCase(rol)) {
            var sesionesPrevias = sessionRepository.findByPlanificacionIdOrderByCreatedAtDesc(planificacionId);
            if (!sesionesPrevias.isEmpty()) {
                log.info("Profesor/Auditor {} accediendo a la sesión del estudiante (ID {}) para planificación {}",
                        userEmail, sesionesPrevias.get(0).getId(), planificacionId);
                return mapToDto(sesionesPrevias.get(0));
            }
        }

        // 2. Si es nueva, buscamos la planificación y leemos el PDF
        Planificacion planificacion = planificacionRepository.findById(planificacionId)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró la planificación con ID " + planificacionId));

        ParsedDocument parsedDoc = parsePlanificacionPdf(planificacion.getArchivo());

        // 3. Creamos la sesión en base de datos
        ChatSession session = new ChatSession(planificacion, userEmail, rol, parsedDoc.totalPages());
        session = sessionRepository.save(session);

        // 4. Construimos los mensajes del prompt de diagnóstico inicial
        List<LlmMessage> promptMessages = promptEngine.buildInitialReviewMessages(parsedDoc);

        // 5. Ejecutamos la inferencia protegiendo la concurrencia
        LlmResponse llmResponse = rateLimiter.executeWithLimit(() -> llmClient.generate(promptMessages, 0.2));

        // 6. Guardamos los mensajes: el requerimiento inicial y la respuesta del tutor
        ChatMessage userInitialMsg = new ChatMessage("USER", "Por favor, realiza tu diagnóstico pedagógico inicial de mi planificación.");
        session.addMessage(userInitialMsg);

        ChatMessage assistantMsg = new ChatMessage("ASSISTANT", llmResponse.content(),
                llmResponse.promptTokens(), llmResponse.completionTokens());
        session.addMessage(assistantMsg);

        session = sessionRepository.save(session);
        log.info("Diagnóstico inicial completado para sesión ID {}", session.getId());

        return mapToDto(session);
    }

    /**
     * Procesa un nuevo turno de conversación del usuario.
     */
    @Transactional
    public ChatMessageDto processUserMessage(Long sessionId, String userEmail, String userText) {
        ChatSession session = sessionRepository.findByIdAndUserEmail(sessionId, userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Sesión de chat no encontrada o no autorizada."));

        // 1. Guardar mensaje del usuario
        ChatMessage userMessage = new ChatMessage("USER", userText);
        session.addMessage(userMessage);
        messageRepository.save(userMessage);

        // 2. Reconstruir historial para el LLM
        List<ChatMessage> history = messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<LlmMessage> llmMessages = new ArrayList<>();

        for (ChatMessage msg : history) {
            if ("USER".equalsIgnoreCase(msg.getRole())) {
                llmMessages.add(LlmMessage.user(msg.getContent()));
            } else if ("ASSISTANT".equalsIgnoreCase(msg.getRole())) {
                llmMessages.add(LlmMessage.assistant(msg.getContent()));
            }
        }

        // 3. Inyectar el system prompt como primer mensaje
        llmMessages.add(0, LlmMessage.system(PedagogicalPromptEngine.SYSTEM_PROMPT));

        // 4. Inferencia con semáforo
        LlmResponse llmResponse = rateLimiter.executeWithLimit(() -> llmClient.generate(llmMessages, 0.4));

        // 5. Guardar respuesta del asistente
        ChatMessage assistantMessage = new ChatMessage("ASSISTANT", llmResponse.content(),
                llmResponse.promptTokens(), llmResponse.completionTokens());
        session.addMessage(assistantMessage);
        assistantMessage = messageRepository.save(assistantMessage);

        return new ChatMessageDto(
                assistantMessage.getId(),
                assistantMessage.getRole(),
                assistantMessage.getContent(),
                assistantMessage.getPromptTokens(),
                assistantMessage.getCompletionTokens(),
                assistantMessage.getCreatedAt()
        );
    }

    /**
     * Consulta el historial completo de una sesión asegurando pertenencia.
     */
    @Transactional(readOnly = true)
    public ChatSessionDto getSessionHistory(Long sessionId, String userEmail) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Sesión de chat no encontrada."));

        boolean esDuenio = session.getUserEmail().equalsIgnoreCase(userEmail);
        boolean esProfesorOAdmin = com.ubb.dochub.security.SecurityUtil.hasRole("PROFESOR")
                || com.ubb.dochub.security.SecurityUtil.isAdminOrCoordinator();

        if (!esDuenio && !esProfesorOAdmin) {
            throw new IllegalArgumentException("Acceso no autorizado a la sesión de chat ID " + sessionId);
        }
        return mapToDto(session);
    }

    private ParsedDocument parsePlanificacionPdf(String archivoPath) {
        try {
            Resource resource = storageService.loadFileAsResource(archivoPath, null);
            try (InputStream in = resource.getInputStream()) {
                return documentParserService.parsePdf(in);
            }
        } catch (IOException e) {
            log.error("Error al leer el archivo PDF en '{}': {}", archivoPath, e.getMessage());
            throw new IllegalStateException("No se pudo leer el archivo de la planificación: " + e.getMessage(), e);
        }
    }

    private ChatSessionDto mapToDto(ChatSession session) {
        List<ChatMessageDto> messageDtos = session.getMessages().stream()
                .map(m -> new ChatMessageDto(
                        m.getId(),
                        m.getRole(),
                        m.getContent(),
                        m.getPromptTokens(),
                        m.getCompletionTokens(),
                        m.getCreatedAt()))
                .toList();

        Long planifId = session.getPlanificacion() != null ? session.getPlanificacion().getId() : null;

        return new ChatSessionDto(
                session.getId(),
                planifId,
                session.getUserEmail(),
                session.getRolUsuario(),
                session.getTotalPaginas(),
                session.getCreatedAt(),
                session.getUpdatedAt(),
                messageDtos
        );
    }
}

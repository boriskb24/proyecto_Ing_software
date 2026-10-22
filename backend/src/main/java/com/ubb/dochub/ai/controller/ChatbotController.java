package com.ubb.dochub.ai.controller;

import com.ubb.dochub.ai.dto.ChatMessageDto;
import com.ubb.dochub.ai.dto.ChatRequestDto;
import com.ubb.dochub.ai.dto.ChatSessionDto;
import com.ubb.dochub.ai.engine.InferenceBusyException;
import com.ubb.dochub.ai.service.RetroPlaniOrchestrator;
import com.ubb.dochub.security.SecurityUtil;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ai")
public class ChatbotController {

    private static final Logger log = LoggerFactory.getLogger(ChatbotController.class);

    private final RetroPlaniOrchestrator orchestrator;

    public ChatbotController(RetroPlaniOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    /**
     * Inicia una sesión de diagnóstico pedagógico para la planificación indicada o reanuda la existente.
     */
    @PostMapping("/session/init")
    public ResponseEntity<ChatSessionDto> initSession(@RequestBody ChatRequestDto request) {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado"));

        if (request.planificacionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe especificar el ID de la planificación");
        }

        String rol = SecurityUtil.hasRole("PROFESOR") ? "PROFESOR" : "ESTUDIANTE";

        try {
            log.info("Iniciando o recuperando sesión IA para planificacionId {} por {}", request.planificacionId(), email);
            ChatSessionDto session = orchestrator.getOrInitSession(request.planificacionId(), email, rol);
            return ResponseEntity.ok(session);
        } catch (InferenceBusyException ex) {
            log.warn("Capacidad saturada para iniciar sesión: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    /**
     * Envía un mensaje en una sesión de chat existente y devuelve la respuesta del tutor pedagógico.
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatMessageDto> sendMessage(@Valid @RequestBody ChatRequestDto request) {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado"));

        if (request.sessionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe especificar el sessionId");
        }

        try {
            log.info("Mensaje recibido para sesión IA ID {} por {}", request.sessionId(), email);
            ChatMessageDto reply = orchestrator.processUserMessage(request.sessionId(), email, request.message());
            return ResponseEntity.ok(reply);
        } catch (InferenceBusyException ex) {
            log.warn("Capacidad saturada durante el chat: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage(), ex);
        }
    }

    /**
     * Obtiene el historial completo de una sesión de chat.
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ChatSessionDto> getSessionHistory(@PathVariable Long sessionId) {
        String email = SecurityUtil.getCurrentUserEmail()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado"));

        try {
            ChatSessionDto session = orchestrator.getSessionHistory(sessionId, email);
            return ResponseEntity.ok(session);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }
}

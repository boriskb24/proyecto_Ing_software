package com.ubb.dochub.ai.controller;

import com.ubb.dochub.ai.dto.ChatMessageDto;
import com.ubb.dochub.ai.dto.ChatRequestDto;
import com.ubb.dochub.ai.dto.ChatSessionDto;
import com.ubb.dochub.ai.engine.InferenceBusyException;
import com.ubb.dochub.ai.service.RetroPlaniOrchestrator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatbotControllerTest {

    @Mock
    private RetroPlaniOrchestrator orchestrator;

    private ChatbotController controller;

    @BeforeEach
    void setUp() {
        controller = new ChatbotController(orchestrator);

        // Autenticar usuario de prueba en SecurityContext
        var auth = new UsernamePasswordAuthenticationToken(
                "estudiante@ubiobio.cl",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ESTUDIANTE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("initSession debe retornar 200 OK con la sesión creada")
    void initSessionSuccess() {
        ChatSessionDto mockSession = new ChatSessionDto(
                1L, 5L, "estudiante@ubiobio.cl", "ESTUDIANTE", 3,
                LocalDateTime.now(), LocalDateTime.now(), List.of()
        );

        when(orchestrator.getOrInitSession(eq(5L), eq("estudiante@ubiobio.cl"), eq("ESTUDIANTE")))
                .thenReturn(mockSession);

        ChatRequestDto request = new ChatRequestDto(5L, null, null);
        ResponseEntity<ChatSessionDto> response = controller.initSession(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1L, response.getBody().sessionId());
    }

    @Test
    @DisplayName("initSession debe lanzar 400 Bad Request si no viene planificacionId")
    void initSessionWithoutPlanificacionIdThrows400() {
        ChatRequestDto request = new ChatRequestDto(null, null, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                controller.initSession(request)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    @DisplayName("sendMessage debe retornar 200 OK con la respuesta del tutor")
    void sendMessageSuccess() {
        ChatMessageDto mockReply = new ChatMessageDto(
                10L, "ASSISTANT", "Sugerencia didáctica", 40, 30, LocalDateTime.now()
        );

        when(orchestrator.processUserMessage(eq(1L), eq("estudiante@ubiobio.cl"), eq("¿Cómo mejoro el inicio?")))
                .thenReturn(mockReply);

        ChatRequestDto request = new ChatRequestDto(null, 1L, "¿Cómo mejoro el inicio?");
        ResponseEntity<ChatMessageDto> response = controller.sendMessage(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Sugerencia didáctica", response.getBody().content());
    }

    @Test
    @DisplayName("sendMessage debe lanzar 503 Service Unavailable cuando el limitador esté saturado")
    void sendMessageBusyThrows503() {
        when(orchestrator.processUserMessage(anyLong(), anyString(), anyString()))
                .thenThrow(new InferenceBusyException("Servidor ocupado"));

        ChatRequestDto request = new ChatRequestDto(null, 1L, "Hola");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                controller.sendMessage(request)
        );
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }

    @Test
    @DisplayName("getSessionHistory debe retornar 200 OK")
    void getSessionHistorySuccess() {
        ChatSessionDto mockSession = new ChatSessionDto(
                2L, 8L, "estudiante@ubiobio.cl", "ESTUDIANTE", 2,
                LocalDateTime.now(), LocalDateTime.now(), List.of()
        );

        when(orchestrator.getSessionHistory(eq(2L), eq("estudiante@ubiobio.cl")))
                .thenReturn(mockSession);

        ResponseEntity<ChatSessionDto> response = controller.getSessionHistory(2L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2L, response.getBody().sessionId());
    }
}

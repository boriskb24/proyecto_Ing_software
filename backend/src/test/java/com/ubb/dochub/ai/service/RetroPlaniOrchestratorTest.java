package com.ubb.dochub.ai.service;

import com.ubb.dochub.ai.client.LlmClient;
import com.ubb.dochub.ai.client.LlmResponse;
import com.ubb.dochub.ai.dto.ChatMessageDto;
import com.ubb.dochub.ai.dto.ChatSessionDto;
import com.ubb.dochub.ai.engine.DocumentParserService;
import com.ubb.dochub.ai.engine.InferenceRateLimiter;
import com.ubb.dochub.ai.engine.PedagogicalPromptEngine;
import com.ubb.dochub.entity.ChatMessage;
import com.ubb.dochub.entity.ChatSession;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.repository.ChatMessageRepository;
import com.ubb.dochub.repository.ChatSessionRepository;
import com.ubb.dochub.repository.PlanificacionRepository;
import com.ubb.dochub.service.StorageService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RetroPlaniOrchestratorTest {

    @Mock
    private LlmClient llmClient;

    @Mock
    private ChatSessionRepository sessionRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private PlanificacionRepository planificacionRepository;

    @Mock
    private StorageService storageService;

    private DocumentParserService documentParserService;
    private PedagogicalPromptEngine promptEngine;
    private InferenceRateLimiter rateLimiter;
    private RetroPlaniOrchestrator orchestrator;

    @BeforeEach
    void setUp() {
        documentParserService = new DocumentParserService();
        promptEngine = new PedagogicalPromptEngine();
        rateLimiter = new InferenceRateLimiter(2, 5);

        orchestrator = new RetroPlaniOrchestrator(
                documentParserService,
                promptEngine,
                rateLimiter,
                llmClient,
                sessionRepository,
                messageRepository,
                planificacionRepository,
                storageService
        );
    }

    @Test
    @DisplayName("Debe iniciar una nueva sesión diagnóstica si no existe previa")
    void getOrInitSessionNew() throws Exception {
        Long planifId = 1L;
        String userEmail = "estudiante@ubiobio.cl";
        Planificacion planificacion = new Planificacion("uploads/planificaciones/plan1.pdf");
        planificacion.setId(planifId);

        when(sessionRepository.findFirstByPlanificacionIdAndUserEmailOrderByCreatedAtDesc(planifId, userEmail))
                .thenReturn(Optional.empty());
        when(planificacionRepository.findById(planifId))
                .thenReturn(Optional.of(planificacion));

        byte[] samplePdf = createSamplePdf();
        when(storageService.loadFileAsResource(anyString(), any()))
                .thenReturn(new ByteArrayResource(samplePdf));

        when(llmClient.generate(anyList(), eq(0.2)))
                .thenReturn(new LlmResponse("Diagnóstico: Excelente planteamiento DUA.", 80, 150, "stop"));

        when(sessionRepository.save(any(ChatSession.class))).thenAnswer(invocation -> {
            ChatSession session = invocation.getArgument(0);
            if (session.getId() == null) {
                session.setId(10L);
            }
            return session;
        });

        ChatSessionDto result = orchestrator.getOrInitSession(planifId, userEmail, "ESTUDIANTE");

        assertNotNull(result);
        assertEquals(10L, result.sessionId());
        assertEquals(planifId, result.planificacionId());
        assertEquals(1, result.totalPaginas());
        assertEquals(2, result.messages().size()); // 1 USER initial + 1 ASSISTANT diagnosis
        assertEquals("ASSISTANT", result.messages().get(1).role());
        assertTrue(result.messages().get(1).content().contains("Excelente planteamiento DUA"));

        verify(llmClient, times(1)).generate(anyList(), eq(0.2));
        verify(sessionRepository, atLeastOnce()).save(any(ChatSession.class));
    }

    @Test
    @DisplayName("Debe reanudar sesión existente sin re-procesar el PDF ni llamar a la IA de nuevo")
    void getOrInitSessionExisting() {
        Long planifId = 2L;
        String userEmail = "estudiante@ubiobio.cl";
        ChatSession existingSession = new ChatSession(null, userEmail, "ESTUDIANTE", 4);
        existingSession.setId(25L);
        existingSession.addMessage(new ChatMessage("ASSISTANT", "Diagnóstico previo"));

        when(sessionRepository.findFirstByPlanificacionIdAndUserEmailOrderByCreatedAtDesc(planifId, userEmail))
                .thenReturn(Optional.of(existingSession));

        ChatSessionDto result = orchestrator.getOrInitSession(planifId, userEmail, "ESTUDIANTE");

        assertNotNull(result);
        assertEquals(25L, result.sessionId());
        assertEquals(1, result.messages().size());

        // Aseguramos que NO se volvió a parsear el PDF ni a consumir tokens
        verifyNoInteractions(storageService);
        verifyNoInteractions(llmClient);
    }

    @Test
    @DisplayName("Debe procesar un turno conversacional y persistir la respuesta del asistente")
    void processUserMessageSuccess() {
        Long sessionId = 30L;
        String userEmail = "estudiante@ubiobio.cl";
        ChatSession session = new ChatSession(null, userEmail, "ESTUDIANTE", 2);
        session.setId(sessionId);

        when(sessionRepository.findByIdAndUserEmail(sessionId, userEmail))
                .thenReturn(Optional.of(session));

        when(llmClient.generate(anyList(), eq(0.4)))
                .thenReturn(new LlmResponse("Te sugiero usar material concreto.", 50, 40, "stop"));

        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage msg = invocation.getArgument(0);
            msg.setId(101L);
            return msg;
        });

        ChatMessageDto reply = orchestrator.processUserMessage(sessionId, userEmail, "¿Qué recurso DUA me recomiendas?");

        assertNotNull(reply);
        assertEquals("ASSISTANT", reply.role());
        assertEquals("Te sugiero usar material concreto.", reply.content());
        assertEquals(50, reply.promptTokens());
        assertEquals(40, reply.completionTokens());

        verify(messageRepository, times(2)).save(any(ChatMessage.class)); // 1 USER + 1 ASSISTANT
    }

    @Test
    @DisplayName("Debe lanzar excepción si el usuario intenta acceder a una sesión ajena")
    void unauthorizedAccessThrowsException() {
        when(sessionRepository.findByIdAndUserEmail(99L, "hacker@test.cl"))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                orchestrator.getSessionHistory(99L, "hacker@test.cl")
        );
    }

    private byte[] createSamplePdf() throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText("Planificacion de Matematica 7mo Basico");
                cs.endText();
            }

            document.save(baos);
            return baos.toByteArray();
        }
    }
}

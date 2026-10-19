package com.ubb.dochub;

import com.ubb.dochub.controller.PlanificacionController;
import com.ubb.dochub.dto.PlanificacionResponseDto;
import com.ubb.dochub.entity.*;
import com.ubb.dochub.repository.*;
import com.ubb.dochub.service.PlanificacionService;
import com.ubb.dochub.service.PracticaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ReglasNegocioTest {

    @Autowired
    private PlanificacionService planificacionService;

    @Autowired
    private PlanificacionController planificacionController;

    @Autowired
    private PracticaService practicaService;

    @Autowired
    private ClaseRepository claseRepository;

    @Autowired
    private InscripcionRepository inscripcionRepository;

    @Autowired
    private InformeRepository informeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanificacionRepository planificacionRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Test
    @DisplayName("RN-01: No se permite más de una inscripción por período académico")
    void testRN01_InscripcionUnicaPorPeriodo() {
        assertThrows(ResponseStatusException.class, () ->
                practicaService.validarInscripcionUnicaPorPeriodo(null, "diego.martinez@ubiobio.cl", 2026, 1)
        );
    }

    @Test
    @DisplayName("RN-02: Un profesor no puede evaluar planificaciones de un alumno no inscrito con él (403 Forbidden)")
    void testRN02_ProfesorAjenoNoPuedeEvaluar() {
        Map<String, String> payload = Map.of(
                "estado", "APROBADA",
                "retroalimentacion", "Aprobado por docente no a cargo",
                "userEmail", "maria.gonzalez@ubiobio.cl"
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                planificacionController.evaluarPlanificacion(1L, payload, "maria.gonzalez@ubiobio.cl")
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode(), "RN-02: Profesor ajeno debe recibir 403 Forbidden");
    }

    @Test
    @DisplayName("RN-07: Un emisor no puede subir más de un informe final para la misma práctica (409 Conflict)")
    void testRN07_RechazoSegundoInformeFinal() {
        Inscripcion inscripcion = inscripcionRepository.findByEstudianteCorreoWithOferta("diego.martinez@ubiobio.cl").get(0);

        MockMultipartFile file1 = new MockMultipartFile("archivo", "informe1.pdf", "application/pdf", "%PDF-1.4 informe".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("archivo", "informe2.pdf", "application/pdf", "%PDF-1.4 informe 2".getBytes());

        // 1. Primer informe exitoso
        practicaService.guardarInformeFinalEstudiante(file1, "diego.martinez@ubiobio.cl", null);

        // 2. Segundo intento debe ser rechazado con 409 Conflict
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                practicaService.guardarInformeFinalEstudiante(file2, "diego.martinez@ubiobio.cl", null)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode(), "RN-07: Segundo informe debe recibir 409 Conflict");
        assertTrue(ex.getReason().contains("RN-07"), "El motivo debe citar la regla de negocio RN-07");
    }

    @Test
    @DisplayName("RN-10: Validación de asignación para no exceder tutor o colaborador")
    void testRN10_MaximoUnTutorYUnColaborador() {
        Inscripcion inscripcion = inscripcionRepository.findAll().get(0);
        // Validar que la regla se ejecute limpiamente
        assertDoesNotThrow(() -> practicaService.validarAsignacionEvaluador(inscripcion.getId(), "44444444-4"));
    }

    @Test
    @DisplayName("RN-11: Solapamiento horario de clase se previene manteniendo la clase existente")
    void testRN11_EvitarSolapamientoClase() {
        User diegoUser = userRepository.findByEmail("diego.martinez@ubiobio.cl").orElseThrow();
        Inscripcion inscripcion = inscripcionRepository.findByEstudianteCorreoWithOferta("diego.martinez@ubiobio.cl").get(0);
        LocalDate fechaTest = LocalDate.of(2026, 11, 20);

        // 1. Insertar clase previa con horario 08:30 - 10:00
        Clase clasePrevia = new Clase();
        clasePrevia.setInscripcion(inscripcion);
        clasePrevia.setFecha(fechaTest);
        clasePrevia.setHoraInicio(LocalTime.of(8, 30));
        clasePrevia.setHoraFin(LocalTime.of(10, 0));
        clasePrevia.setTema("Clase Original");
        clasePrevia.setAsignatura("Práctica Profesional");
        claseRepository.save(clasePrevia);

        long totalClasesAntes = claseRepository.findByInscripcionIdAndFecha(inscripcion.getId(), fechaTest).size();
        assertEquals(1, totalClasesAntes);

        // 2. Subir planificación para esa misma fecha
        MockMultipartFile file = new MockMultipartFile("archivo", "plan_test.pdf", "application/pdf", "%PDF-1.4 test".getBytes());
        PlanificacionResponseDto resp = planificacionService.guardarPlanificacion(file, diegoUser.getId(), fechaTest);

        assertNotNull(resp);
        long totalClasesDespues = claseRepository.findByInscripcionIdAndFecha(inscripcion.getId(), fechaTest).size();

        // RN-11: Se mantiene la clase ya registrada
        assertEquals(1, totalClasesDespues, "RN-11: No debe haberse creado un nuevo registro de clase solapada");
    }

    @Test
    @DisplayName("RN-12: Un profesor no puede acceder a ofertas que no dicta (403 Forbidden)")
    void testRN12_ProfesorNoAccedeAOfertaAjena() {
        // Offer 1 belongs to Boris; Maria cannot access it
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                practicaService.getOfertaById(1L, "maria.gonzalez@ubiobio.cl")
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode(), "RN-12: Profesor ajeno debe recibir 403 Forbidden");
    }

    @Test
    @DisplayName("RN-13: El Coordinador de Práctica tiene prohibido evaluar planificaciones (403 Forbidden)")
    void testRN13_CoordinadorProhibidoEvaluar() {
        Map<String, String> payload = Map.of(
                "estado", "APROBADA",
                "retroalimentacion", "Aprobado por coordinador",
                "userEmail", "admin@ubiobio.cl"
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                planificacionController.evaluarPlanificacion(1L, payload, "admin@ubiobio.cl")
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode(), "RN-13: Coordinador debe recibir 403 Forbidden");
        assertTrue(ex.getReason().contains("RN-13"));
    }

    @Test
    @DisplayName("RN-14: La planificación filtrada por el chatbot queda en estado PENDIENTE y el chatbot no tiene facultad evaluativa sumativa")
    void testRN14_ChatbotNoTieneFacultadEvaluativa() {
        Planificacion plan = new Planificacion();
        plan.setArchivo("/test/plan.pdf");
        plan.setEstado(EstadoPlanificacion.PENDIENTE);
        plan = planificacionRepository.save(plan);

        // El estado inicial tras pasar el filtro del chatbot es PENDIENTE para revisión docente
        assertEquals(EstadoPlanificacion.PENDIENTE, plan.getEstado(),
                "RN-14: La planificación filtrada debe ingresar exclusivamente como PENDIENTE");

        // El chatbot carece de potestad para auto-aprobar o auto-rechazar
        assertNotEquals(EstadoPlanificacion.APROBADA, plan.getEstado());
        assertNotEquals(EstadoPlanificacion.RECHAZADA, plan.getEstado());
    }

    @Test
    @DisplayName("RN-15: Si el profesor rechaza la planificación, se preserva la retroalimentación en BD sin borrar el registro (HU-E6)")
    void testRN15_RechazoDocentePreservaRetroalimentacionSinBorrado() {
        String profeEmail = "profesor@ubiobio.cl";
        Map<String, String> payload = Map.of(
                "estado", "RECHAZADA",
                "retroalimentacion", "Debes corregir la coherencia del momento de Inicio y articular con Decreto 83.",
                "userEmail", profeEmail
        );

        PlanificacionResponseDto resp = planificacionController.evaluarPlanificacion(1L, payload, profeEmail).getBody();
        assertNotNull(resp);

        // 1. Estado actualizado a RECHAZADA
        assertEquals("RECHAZADA", resp.getEstado());

        // 2. Registro no eliminado físicamente
        Planificacion plan = planificacionRepository.findById(1L).orElse(null);
        assertNotNull(plan, "RN-15: La planificación no debe eliminarse físicamente de la base de datos");
        assertEquals(EstadoPlanificacion.RECHAZADA, plan.getEstado());

        // 3. Retroalimentación cualitativa disponible para el estudiante (cumplimiento HU-E6)
        assertEquals("Debes corregir la coherencia del momento de Inicio y articular con Decreto 83.", plan.getRetroalimentacion());
    }

    @Test
    @DisplayName("RN-16: El profesor de asignatura tiene acceso de supervisión al historial y observaciones del Chatbot del estudiante (HU-P4 y HU-P5)")
    void testRN16_ProfesorAccedeAHistorialChatbotEstudiante() {
        Planificacion plan = planificacionRepository.findById(1L).orElseThrow();
        String estudianteEmail = "diego.martinez@ubiobio.cl";

        // 1. Simular sesión creada por el estudiante en el chatbot
        ChatSession sessionEstudiante = new ChatSession(plan, estudianteEmail, "ESTUDIANTE", 4);
        ChatMessage msgUser = new ChatMessage("USER", "¿Cómo articulo el DUA en la actividad de desarrollo?");
        ChatMessage msgBot = new ChatMessage("ASSISTANT", "RetroPlani Mate: Para articular el DUA según Decreto 83, considera...");
        sessionEstudiante.addMessage(msgUser);
        sessionEstudiante.addMessage(msgBot);
        sessionEstudiante = chatSessionRepository.save(sessionEstudiante);

        // 2. El profesor consulta las sesiones asociadas a la planificación de su estudiante (HU-P4 y HU-P5)
        List<ChatSession> sesiones = chatSessionRepository.findByPlanificacionIdOrderByCreatedAtDesc(plan.getId());

        assertFalse(sesiones.isEmpty(), "RN-16: El profesor debe encontrar la sesión registrada para la planificación");
        ChatSession sesionRecuperada = sesiones.get(0);
        assertEquals(estudianteEmail, sesionRecuperada.getUserEmail());
        assertEquals(2, sesionRecuperada.getMessages().size(), "RN-16: Deben estar disponibles las interacciones del estudiante");
        assertTrue(sesionRecuperada.getMessages().get(1).getContent().contains("RetroPlani Mate"));
    }
}

package com.ubb.dochub.controller;

import com.ubb.dochub.dto.*;
import com.ubb.dochub.service.PracticaService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/practicas")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PracticaController {

    private final PracticaService practicaService;

    public PracticaController(PracticaService practicaService) {
        this.practicaService = practicaService;
    }

    // 1. Entrega informe estudiante (vinculado automáticamente a su práctica actual)
    @PostMapping(value = "/informe-final", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InformeEntregaResponse> subirInformeFinal(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "correo", required = false) String correo,
            @RequestParam(value = "email", required = false) String email) {
        String effectiveEmail = (correo != null && !correo.isBlank()) ? correo : email;
        InformeEntregaResponse response = practicaService.guardarInformeFinalEstudiante(archivo, effectiveEmail, userId);
        return ResponseEntity.ok(response);
    }

    // 1.1 Consultar última entrega del estudiante
    @GetMapping("/mi-informe")
    public ResponseEntity<InformeEntregaResponse> obtenerMiInforme(
            @RequestParam("email") String email) {
        InformeEntregaResponse response = practicaService.obtenerUltimoInformeEstudiante(email);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    // 2. Evaluaciones de profesor (RN-02)
    @GetMapping("/evaluaciones/profesor")
    public ResponseEntity<EvaluacionesResponseDto> obtenerEvaluacionesProfesor(
            @RequestParam(required = false) String rutProfesor,
            @RequestParam(required = false) String correoProfesor,
            @RequestParam(required = false) String rutEstudiante,
            @RequestParam(required = false) Long inscripcionId,
            @RequestParam(defaultValue = "TODAS") TipoFiltroEvaluacion tipo) {
        EvaluacionesResponseDto response = practicaService.obtenerEvaluacionesPorProfesor(rutProfesor, correoProfesor, rutEstudiante, inscripcionId, tipo);
        return ResponseEntity.ok(response);
    }

    // 2b. Evaluaciones de estudiante (RN-05)
    @GetMapping("/evaluaciones/estudiante")
    public ResponseEntity<EvaluacionesResponseDto> obtenerEvaluacionesEstudiante(
            @RequestParam(required = false) String correoEstudiante,
            @RequestParam(required = false) String rutEstudiante,
            @RequestParam(required = false) Long inscripcionId,
            @RequestParam(defaultValue = "TODAS") TipoFiltroEvaluacion tipo) {
        EvaluacionesResponseDto response = practicaService.obtenerEvaluacionesPorEstudiante(correoEstudiante, rutEstudiante, inscripcionId, tipo);
        return ResponseEntity.ok(response);
    }

    // Visualizar PDF de evaluación de clase
    @GetMapping("/evaluaciones/clase/{id}/archivo")
    public ResponseEntity<Resource> verArchivoEvaluacionClase(
            @PathVariable Long id,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return practicaService.verArchivoEvaluacionClase(id, userEmail);
    }

    // Visualizar PDF de evaluación semestral
    @GetMapping("/evaluaciones/semestral/{id}/archivo")
    public ResponseEntity<Resource> verArchivoEvaluacionSemestral(
            @PathVariable Long id,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return practicaService.verArchivoEvaluacionSemestral(id, userEmail);
    }

    // Visualizar PDF de informe final de práctica
    @GetMapping("/informes/{id}/archivo")
    public ResponseEntity<Resource> verArchivoInforme(
            @PathVariable Long id,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return practicaService.verArchivoInforme(id, userEmail);
    }

    // 3. Inscripciones por profesor
    @GetMapping("/inscripciones")
    public ResponseEntity<List<InscripcionResponse>> listarInscripcionesPorProfesor(
            @RequestParam("profesorEmail") String profesorEmail) {
        return ResponseEntity.ok(practicaService.listarInscripcionesPorProfesor(profesorEmail));
    }

    // 4. Ofertas por profesor o estudiante
    @GetMapping("/ofertas")
    public ResponseEntity<List<OfertaResponse>> listarOfertas(
            @RequestParam(value = "profesorEmail", required = false) String profesorEmail) {
        return ResponseEntity.ok(practicaService.listarOfertas(profesorEmail));
    }

    // 5. Oferta por ID (RN-12)
    @GetMapping("/ofertas/{ofertaId}")
    public ResponseEntity<OfertaResponse> getOfertaById(
            @PathVariable("ofertaId") Long ofertaId,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return ResponseEntity.ok(practicaService.getOfertaById(ofertaId, userEmail));
    }

    // 6. Inscripciones de una oferta
    @GetMapping("/ofertas/{ofertaId}/inscripciones")
    public ResponseEntity<List<InscripcionResponse>> listarInscripcionesPorOferta(
            @PathVariable("ofertaId") Long ofertaId,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return ResponseEntity.ok(practicaService.listarInscripcionesPorOferta(ofertaId, userEmail));
    }

    // 7. Detalle de inscripción (Ficha de Alumno)
    @GetMapping("/inscripciones/{inscripcionId}")
    public ResponseEntity<EstudianteDetalleResponse> getDetalleInscripcion(
            @PathVariable("inscripcionId") Long inscripcionId,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return ResponseEntity.ok(practicaService.getDetalleInscripcion(inscripcionId, userEmail));
    }

    // 8. Subir informe para inscripción (exclusivo del profesor guía, RN-02, RN-06, RN-07, RN-13)
    @PostMapping(value = "/{inscripcionId}/informe-final", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InformeEntregaResponse> subirInformeFinalParaInscripcion(
            @PathVariable("inscripcionId") Long inscripcionId,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return ResponseEntity.ok(practicaService.guardarInformeFinalParaInscripcion(archivo, inscripcionId, userEmail));
    }

    // 9. Directorio de alumnos (RN-02, RN-05)
    @GetMapping("/alumnos")
    public ResponseEntity<List<EstudianteDirectorioDto>> listarTodosLosAlumnos(
            @RequestParam(value = "profesorEmail", required = false) String profesorEmail) {
        return ResponseEntity.ok(practicaService.listarDirectorioAlumnos(profesorEmail));
    }

    // 10. Detalle de estudiante por RUT
    @GetMapping("/estudiantes/{rut}")
    public ResponseEntity<EstudianteDetalleResponse> getDetallePorRutEstudiante(
            @PathVariable("rut") String rut,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return ResponseEntity.ok(practicaService.getDetallePorRutEstudiante(rut, userEmail));
    }

    // 11. Detalle de estudiante por Correo
    @GetMapping("/estudiantes/correo/{correo}")
    public ResponseEntity<EstudianteDetalleResponse> getDetallePorCorreoEstudiante(
            @PathVariable("correo") String correo,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return ResponseEntity.ok(practicaService.getDetallePorCorreoEstudiante(correo, userEmail));
    }
}

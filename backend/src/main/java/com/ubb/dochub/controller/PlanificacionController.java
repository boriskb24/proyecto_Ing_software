package com.ubb.dochub.controller;

import com.ubb.dochub.dto.PlanificacionResponseDto;
import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.service.PlanificacionService;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/planificaciones")
public class PlanificacionController {

    private final PlanificacionService planificacionService;

    public PlanificacionController(PlanificacionService planificacionService) {
        this.planificacionService = planificacionService;
    }

    /**
     * Endpoint protegido por RBAC:
     * - Si el rol es Profesor/Administrador/Evaluador: Devuelve planificaciones pertinentes a su dominio.
     * - Si el rol es Estudiante: Filtra por sus clases inscritas.
     */
    @GetMapping
    public ResponseEntity<List<PlanificacionResponseDto>> listarPlanificaciones(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Long inscripcionId) {
        List<PlanificacionResponseDto> planificaciones = planificacionService.obtenerHistorialPorRol(userId, role, email, inscripcionId);
        return ResponseEntity.ok(planificaciones);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlanificacionResponseDto> subirPlanificacion(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "fechaClase", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaClase) {
        PlanificacionResponseDto planificacionGuardada = planificacionService.guardarPlanificacion(archivo, userId, fechaClase);
        return ResponseEntity.ok(planificacionGuardada);
    }

    @PatchMapping("/{id}/evaluar")
    public ResponseEntity<PlanificacionResponseDto> evaluarPlanificacion(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestParam(value = "userEmail", required = false) String userEmailParam) {
        String userEmail = (payload != null && payload.get("userEmail") != null) ? payload.get("userEmail") : userEmailParam;

        String estadoStr = payload != null ? payload.get("estado") : null;
        String retroalimentacion = payload != null ? payload.get("retroalimentacion") : null;

        if (estadoStr == null || estadoStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe especificar el nuevo estado ('APROBADA' o 'RECHAZADA').");
        }

        EstadoPlanificacion estado = EstadoPlanificacion.valueOf(estadoStr.toUpperCase());
        PlanificacionResponseDto actualizada = planificacionService.evaluarPlanificacion(id, estado, retroalimentacion, userEmail);
        return ResponseEntity.ok(actualizada);
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> verArchivoPlanificacion(
            @PathVariable Long id,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        return planificacionService.verArchivoPlanificacion(id, userEmail);
    }
}

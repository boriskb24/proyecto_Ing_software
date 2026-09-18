package com.ubb.dochub.controller;

import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.service.PlanificacionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
     * - Si el rol es Profesor/Administrador/Evaluador: Devuelve todas las planificaciones.
     * - Si el rol es Estudiante: Filtra por userId (WHERE user_id = :userId).
     */
    @GetMapping
    public ResponseEntity<List<Planificacion>> listarPlanificaciones(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role) {
        List<Planificacion> planificaciones = planificacionService.obtenerHistorialPorRol(userId, role);
        return ResponseEntity.ok(planificaciones);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Planificacion> subirPlanificacion(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "userId", required = false) Long userId) {
        Planificacion planificacionGuardada = planificacionService.guardarPlanificacion(archivo, userId);
        return ResponseEntity.ok(planificacionGuardada);
    }

    @PatchMapping("/{id}/evaluar")
    public ResponseEntity<Planificacion> evaluarPlanificacion(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String estadoStr = payload.get("estado");
        String retroalimentacion = payload.get("retroalimentacion");

        EstadoPlanificacion estado = EstadoPlanificacion.valueOf(estadoStr.toUpperCase());
        Planificacion actualizada = planificacionService.evaluarPlanificacion(id, estado, retroalimentacion);
        return ResponseEntity.ok(actualizada);
    }
}

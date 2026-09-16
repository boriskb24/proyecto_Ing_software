package com.ubb.dochub.controller;

import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.service.PlanificacionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/planificaciones")
public class PlanificacionController {

    private final PlanificacionService planificacionService;

    public PlanificacionController(PlanificacionService planificacionService) {
        this.planificacionService = planificacionService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Planificacion> subirPlanificacion(
            @RequestParam("archivo") MultipartFile archivo) {
        Planificacion planificacionGuardada = planificacionService.guardarPlanificacion(archivo);
        return ResponseEntity.status(HttpStatus.CREATED).body(planificacionGuardada);
    }

    @GetMapping
    public ResponseEntity<List<Planificacion>> listarPlanificaciones() {
        List<Planificacion> planificaciones = planificacionService.obtenerTodas();
        return ResponseEntity.ok(planificaciones);
    }
}

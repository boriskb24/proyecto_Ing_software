package com.ubb.dochub.controller;

import com.ubb.dochub.dto.EvaluacionesResponseDto;
import com.ubb.dochub.dto.InformeEntregaResponse;
import com.ubb.dochub.dto.TipoFiltroEvaluacion;
import com.ubb.dochub.service.PracticaService;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/practicas")
@CrossOrigin(origins = "*")
public class PracticaController {

    private final PracticaService practicaService;

    public PracticaController(PracticaService practicaService) {
        this.practicaService = practicaService;
    }

    @PostMapping(value = "/informe-final", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InformeEntregaResponse> subirInformeFinal(
            @RequestParam("archivo") MultipartFile archivo) {
        InformeEntregaResponse response = practicaService.guardarInformeFinal(archivo);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/evaluaciones/profesor")
    public ResponseEntity<EvaluacionesResponseDto> obtenerEvaluacionesProfesor(
        @RequestParam String rutProfesor,
        @RequestParam(defaultValue = "TODAS") TipoFiltroEvaluacion tipo) {
    
    EvaluacionesResponseDto response = practicaService.obtenerEvaluacionesPorProfesor(rutProfesor, tipo);
    return ResponseEntity.ok(response);
    }
}

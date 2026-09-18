package com.ubb.dochub.controller;

import com.ubb.dochub.dto.InformeEntregaResponse;
import com.ubb.dochub.dto.OfertaResponse;
import com.ubb.dochub.service.PracticaService;
import com.ubb.dochub.dto.InscripcionResponse;
import com.ubb.dochub.repository.InscripcionRepository;
import com.ubb.dochub.repository.OfertaRepository;
import com.ubb.dochub.entity.Inscripcion;
import com.ubb.dochub.entity.Oferta;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/practicas")
public class PracticaController {

    private final PracticaService practicaService;
    private final InscripcionRepository inscripcionRepository;
    private final OfertaRepository ofertaRepository;

    public PracticaController(PracticaService practicaService, InscripcionRepository inscripcionRepository, OfertaRepository ofertaRepository) {
        this.practicaService = practicaService;
        this.inscripcionRepository = inscripcionRepository;
        this.ofertaRepository = ofertaRepository;
    }

    @PostMapping(value = "/informe-final", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InformeEntregaResponse> subirInformeFinal(
            @RequestParam("archivo") MultipartFile archivo) {
        InformeEntregaResponse response = practicaService.guardarInformeFinal(archivo);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/inscripciones")
    public ResponseEntity<List<InscripcionResponse>> listarInscripcionesPorProfesor(@RequestParam("profesorEmail") String profesorEmail) {
        if (profesorEmail == null || profesorEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el correo del profesor.");
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByOfertaProfesorCorreo(profesorEmail);

        List<InscripcionResponse> dto = inscripciones.stream().map(i -> {
            var est = i.getEstudiante();
            String nombre = String.join(" ", est.getPrimerNombre(), est.getSegundoNombre(), est.getApellidoPaterno(), est.getApellidoMaterno());
            return new InscripcionResponse(i.getId(), est.getRut(), nombre, est.getCorreo());
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/ofertas")
    public ResponseEntity<List<OfertaResponse>> listarOfertasPorProfesor(@RequestParam("profesorEmail") String profesorEmail) {
        if (profesorEmail == null || profesorEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el correo del profesor.");
        }

        List<Oferta> ofertas = ofertaRepository.findByProfesorCorreoOrderByAnioDescPeriodoDesc(profesorEmail);

        List<OfertaResponse> dto = ofertas.stream().map(o -> {
            var ap = o.getAsignaturaPractica();
            Long inscritos = inscripcionRepository.countByOfertaId(o.getId());
            return new OfertaResponse(o.getId(), o.getAnio(), o.getPeriodo(), ap != null ? ap.getCodigo() : null, ap != null ? ap.getNombre() : null, inscritos == null ? 0L : inscritos);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/ofertas/{ofertaId}")
    public ResponseEntity<OfertaResponse> getOfertaById(@PathVariable("ofertaId") Long ofertaId) {
        if (ofertaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el id de la oferta.");
        }

        Oferta o = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada"));

        var ap = o.getAsignaturaPractica();
        Long inscritos = inscripcionRepository.countByOfertaId(o.getId());
        OfertaResponse resp = new OfertaResponse(o.getId(), o.getAnio(), o.getPeriodo(), ap != null ? ap.getCodigo() : null, ap != null ? ap.getNombre() : null, inscritos == null ? 0L : inscritos);

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/ofertas/{ofertaId}/inscripciones")
    public ResponseEntity<List<InscripcionResponse>> listarInscripcionesPorOferta(@PathVariable("ofertaId") Long ofertaId) {
        if (ofertaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el id de la oferta.");
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByOfertaId(ofertaId);

        List<InscripcionResponse> dto = inscripciones.stream().map(i -> {
            var est = i.getEstudiante();
            String nombre = String.join(" ", est.getPrimerNombre(), est.getSegundoNombre(), est.getApellidoPaterno(), est.getApellidoMaterno());
            return new InscripcionResponse(i.getId(), est.getRut(), nombre, est.getCorreo());
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dto);
    }

    @PostMapping(value = "/{inscripcionId}/informe-final", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InformeEntregaResponse> subirInformeFinalParaInscripcion(
            @PathVariable("inscripcionId") Long inscripcionId,
            @RequestParam("archivo") MultipartFile archivo) {
        InformeEntregaResponse response = practicaService.guardarInformeFinalParaInscripcion(archivo, inscripcionId);
        return ResponseEntity.ok(response);
    }
}

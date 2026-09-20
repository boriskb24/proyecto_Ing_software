package com.ubb.dochub.controller;

import com.ubb.dochub.dto.EstudianteDetalleResponse;
import com.ubb.dochub.dto.EstudianteDirectorioDto;
import com.ubb.dochub.dto.InformeEntregaResponse;
import com.ubb.dochub.dto.OfertaResponse;
import com.ubb.dochub.service.PracticaService;
import com.ubb.dochub.dto.InscripcionResponse;
import com.ubb.dochub.repository.AsignacionRepository;
import com.ubb.dochub.repository.EstudianteRepository;
import com.ubb.dochub.repository.InformeRepository;
import com.ubb.dochub.repository.InscripcionRepository;
import com.ubb.dochub.repository.OfertaRepository;
import com.ubb.dochub.entity.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/practicas")
public class PracticaController {

    private final PracticaService practicaService;
    private final InscripcionRepository inscripcionRepository;
    private final OfertaRepository ofertaRepository;
    private final AsignacionRepository asignacionRepository;
    private final InformeRepository informeRepository;
    private final EstudianteRepository estudianteRepository;

    public PracticaController(
            PracticaService practicaService,
            InscripcionRepository inscripcionRepository,
            OfertaRepository ofertaRepository,
            AsignacionRepository asignacionRepository,
            InformeRepository informeRepository,
            EstudianteRepository estudianteRepository) {
        this.practicaService = practicaService;
        this.inscripcionRepository = inscripcionRepository;
        this.ofertaRepository = ofertaRepository;
        this.asignacionRepository = asignacionRepository;
        this.informeRepository = informeRepository;
        this.estudianteRepository = estudianteRepository;
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
    public ResponseEntity<List<OfertaResponse>> listarOfertasPorProfesor(@RequestParam(value = "profesorEmail", required = false) String profesorEmail) {
        List<Oferta> ofertas;
        if (profesorEmail != null && !profesorEmail.isBlank() && !"admin@ubiobio.cl".equalsIgnoreCase(profesorEmail.trim())) {
            ofertas = ofertaRepository.findByProfesorCorreoIgnoreCaseOrderByAnioDescPeriodoDesc(profesorEmail.trim());
            if (ofertas.isEmpty()) {
                ofertas = ofertaRepository.findByProfesorCorreoOrderByAnioDescPeriodoDesc(profesorEmail.trim());
            }
        } else {
            ofertas = ofertaRepository.findAllWithDetailsOrderByAnioDescPeriodoDesc();
        }

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

    @GetMapping("/inscripciones/{inscripcionId}")
    public ResponseEntity<EstudianteDetalleResponse> getDetalleInscripcion(@PathVariable("inscripcionId") Long inscripcionId) {
        if (inscripcionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el ID de la inscripción.");
        }

        Inscripcion inscripcion = inscripcionRepository.findByIdWithDetails(inscripcionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        Estudiante est = inscripcion.getEstudiante();
        Oferta ofertaActual = inscripcion.getOferta();
        AsignaturaPractica apActual = ofertaActual != null ? ofertaActual.getAsignaturaPractica() : null;
        Profesor profActual = ofertaActual != null ? ofertaActual.getProfesor() : null;

        EstudianteDetalleResponse resp = new EstudianteDetalleResponse();
        resp.setInscripcionId(inscripcion.getId());
        if (ofertaActual != null) {
            resp.setOfertaId(ofertaActual.getId());
            resp.setAnio(ofertaActual.getAnio());
            resp.setPeriodo(ofertaActual.getPeriodo());
        }
        if (apActual != null) {
            resp.setAsignaturaCodigo(apActual.getCodigo());
            resp.setAsignaturaNombre(apActual.getNombre());
        }

        if (est != null) {
            resp.setEstudianteRut(est.getRut());
            String nombreCompleto = String.join(" ",
                    est.getPrimerNombre() != null ? est.getPrimerNombre() : "",
                    est.getSegundoNombre() != null ? est.getSegundoNombre() : "",
                    est.getApellidoPaterno() != null ? est.getApellidoPaterno() : "",
                    est.getApellidoMaterno() != null ? est.getApellidoMaterno() : "").replaceAll("\\s+", " ").trim();
            resp.setEstudianteNombre(nombreCompleto);
            resp.setEstudianteCorreo(est.getCorreo());
            resp.setCarrera("Ingeniería Civil Informática • Prácticas Profesionales");
        }

        if (profActual != null) {
            String nombreProf = String.join(" ",
                    profActual.getPrimerNombre() != null ? profActual.getPrimerNombre() : "",
                    profActual.getSegundoNombre() != null ? profActual.getSegundoNombre() : "",
                    profActual.getApellidoPaterno() != null ? profActual.getApellidoPaterno() : "",
                    profActual.getApellidoMaterno() != null ? profActual.getApellidoMaterno() : "").replaceAll("\\s+", " ").trim();
            resp.setProfesorGuiaNombre(nombreProf);
            resp.setProfesorGuiaCorreo(profActual.getCorreo());
        }

        resp.setEstablecimiento("Liceo Bicentenario de Excelencia Polivalente San Nicolás");

        List<Asignacion> asignaciones = asignacionRepository.findByInscripcionIdWithEvaluador(inscripcionId);
        List<EstudianteDetalleResponse.EvaluadorItemDto> evaluadoresDto = asignaciones.stream().map(a -> {
            Evaluador ev = a.getEvaluador();
            if (ev == null) return null;
            String nomEv = String.join(" ",
                    ev.getPrimerNombre() != null ? ev.getPrimerNombre() : "",
                    ev.getSegundoNombre() != null ? ev.getSegundoNombre() : "",
                    ev.getApellidoPaterno() != null ? ev.getApellidoPaterno() : "",
                    ev.getApellidoMaterno() != null ? ev.getApellidoMaterno() : "").replaceAll("\\s+", " ").trim();
            return new EstudianteDetalleResponse.EvaluadorItemDto(
                    ev.getRut(),
                    nomEv,
                    ev.getCorreo(),
                    ev.getTipo() != null ? ev.getTipo().name() : "EVALUADOR"
            );
        }).filter(item -> item != null).collect(Collectors.toList());
        resp.setEvaluadores(evaluadoresDto);

        if (est != null) {
            List<Inscripcion> todasInscripciones = inscripcionRepository.findByEstudianteRutWithOferta(est.getRut());
            List<EstudianteDetalleResponse.PracticaHistorialItemDto> historial = todasInscripciones.stream().map(i -> {
                Oferta of = i.getOferta();
                AsignaturaPractica ap = of != null ? of.getAsignaturaPractica() : null;
                boolean esActual = i.getId().equals(inscripcionId);
                String estado = esActual ? "En curso" : "Finalizada";
                return new EstudianteDetalleResponse.PracticaHistorialItemDto(
                        i.getId(),
                        of != null ? of.getId() : null,
                        ap != null ? ap.getCodigo() : "S/C",
                        ap != null ? ap.getNombre() : "Práctica",
                        of != null ? of.getAnio() : 0,
                        of != null ? of.getPeriodo() : 0,
                        esActual,
                        estado
                );
            }).collect(Collectors.toList());
            resp.setHistorialPracticas(historial);
        }

        List<Informe> informes = informeRepository.findByInscripcionIdOrderByIdDesc(inscripcionId);
        if (!informes.isEmpty()) {
            Informe ultimo = informes.get(0);
            String rawArchivo = ultimo.getArchivo();
            String nombreArchivo = "informe.pdf";
            if (rawArchivo != null) {
                nombreArchivo = rawArchivo.substring(rawArchivo.lastIndexOf("/") + 1);
                nombreArchivo = nombreArchivo.replaceFirst("^[a-f0-9\\-]{36}_", "");
            }
            resp.setInformeActual(new EstudianteDetalleResponse.InformeItemDto(
                    ultimo.getId(),
                    ultimo.getArchivo(),
                    nombreArchivo,
                    ultimo.getFecha() != null ? ultimo.getFecha().toString() : "",
                    ultimo.getEmisor() != null ? ultimo.getEmisor().name() : "PROFESOR"
            ));
        }

        return ResponseEntity.ok(resp);
    }

    @PostMapping(value = "/{inscripcionId}/informe-final", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InformeEntregaResponse> subirInformeFinalParaInscripcion(
            @PathVariable("inscripcionId") Long inscripcionId,
            @RequestParam("archivo") MultipartFile archivo) {
        InformeEntregaResponse response = practicaService.guardarInformeFinalParaInscripcion(archivo, inscripcionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/alumnos")
    public ResponseEntity<List<EstudianteDirectorioDto>> listarTodosLosAlumnos(
            @RequestParam(value = "profesorEmail", required = false) String profesorEmail) {

        List<Inscripcion> inscripciones;
        if (profesorEmail != null && !profesorEmail.isBlank()) {
            if ("admin@ubiobio.cl".equalsIgnoreCase(profesorEmail.trim())) {
                inscripciones = inscripcionRepository.findAllWithDetails();
            } else {
                inscripciones = inscripcionRepository.findByOfertaProfesorCorreoWithDetails(profesorEmail.trim());
            }
        } else {
            inscripciones = List.of();
        }

        Map<String, EstudianteDirectorioDto> alumnoMap = new LinkedHashMap<>();

        for (Inscripcion i : inscripciones) {
            var est = i.getEstudiante();
            if (est == null) continue;

            if (!alumnoMap.containsKey(est.getRut())) {
                String nombreCompleto = String.join(" ",
                        est.getPrimerNombre() != null ? est.getPrimerNombre() : "",
                        est.getSegundoNombre() != null ? est.getSegundoNombre() : "",
                        est.getApellidoPaterno() != null ? est.getApellidoPaterno() : "",
                        est.getApellidoMaterno() != null ? est.getApellidoMaterno() : "").replaceAll("\\s+", " ").trim();

                Oferta of = i.getOferta();
                AsignaturaPractica ap = of != null ? of.getAsignaturaPractica() : null;

                int anio = of != null ? of.getAnio() : 0;
                int periodo = of != null ? of.getPeriodo() : 0;
                String estado = (anio >= 2026) ? "En curso" : "Finalizada";

                alumnoMap.put(est.getRut(), new EstudianteDirectorioDto(
                        est.getRut(),
                        nombreCompleto,
                        est.getCorreo(),
                        "Ingeniería Civil en Informática",
                        i.getId(),
                        of != null ? of.getId() : null,
                        ap != null ? ap.getNombre() : "Práctica Profesional",
                        ap != null ? ap.getCodigo() : "INF-403",
                        anio,
                        periodo,
                        estado
                ));
            }
        }

        return ResponseEntity.ok(new ArrayList<>(alumnoMap.values()));
    }

    @GetMapping("/estudiantes/{rut}")
    public ResponseEntity<EstudianteDetalleResponse> getDetallePorRutEstudiante(@PathVariable("rut") String rut) {
        List<Inscripcion> inscripciones = inscripcionRepository.findByEstudianteRutWithOferta(rut);
        if (!inscripciones.isEmpty()) {
            return getDetalleInscripcion(inscripciones.get(0).getId());
        }

        Estudiante est = estudianteRepository.findById(rut)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estudiante no encontrado con RUT: " + rut));

        EstudianteDetalleResponse resp = new EstudianteDetalleResponse();
        resp.setEstudianteRut(est.getRut());
        String nombre = String.join(" ",
                est.getPrimerNombre() != null ? est.getPrimerNombre() : "",
                est.getSegundoNombre() != null ? est.getSegundoNombre() : "",
                est.getApellidoPaterno() != null ? est.getApellidoPaterno() : "",
                est.getApellidoMaterno() != null ? est.getApellidoMaterno() : "").replaceAll("\\s+", " ").trim();
        resp.setEstudianteNombre(nombre);
        resp.setEstudianteCorreo(est.getCorreo());
        resp.setCarrera("Ingeniería Civil en Informática");
        resp.setEstablecimiento("Sin asignación de centro");
        return ResponseEntity.ok(resp);
    }
}

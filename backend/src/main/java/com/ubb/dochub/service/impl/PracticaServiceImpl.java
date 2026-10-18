package com.ubb.dochub.service.impl;

import com.ubb.dochub.dto.*;
import com.ubb.dochub.entity.*;
import com.ubb.dochub.repository.*;
import com.ubb.dochub.security.SecurityUtil;
import com.ubb.dochub.service.PracticaService;
import com.ubb.dochub.service.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PracticaServiceImpl implements PracticaService {

    private static final String INFORMES_DIR = "uploads/informes";

    private final InscripcionRepository inscripcionRepository;
    private final InformeRepository informeRepository;
    private final EstudianteRepository estudianteRepository;
    private final EvaluacionClaseRepository evaluacionClaseRepository;
    private final EvaluacionSemestralRepository evaluacionSemestralRepository;
    private final UserRepository userRepository;
    private final OfertaRepository ofertaRepository;
    private final AsignacionRepository asignacionRepository;
    private final StorageService storageService;

    public PracticaServiceImpl(
            InscripcionRepository inscripcionRepository,
            InformeRepository informeRepository,
            EstudianteRepository estudianteRepository,
            EvaluacionClaseRepository evaluacionClaseRepository,
            EvaluacionSemestralRepository evaluacionSemestralRepository,
            UserRepository userRepository,
            OfertaRepository ofertaRepository,
            AsignacionRepository asignacionRepository,
            StorageService storageService) {
        this.inscripcionRepository = inscripcionRepository;
        this.informeRepository = informeRepository;
        this.estudianteRepository = estudianteRepository;
        this.evaluacionClaseRepository = evaluacionClaseRepository;
        this.evaluacionSemestralRepository = evaluacionSemestralRepository;
        this.userRepository = userRepository;
        this.ofertaRepository = ofertaRepository;
        this.asignacionRepository = asignacionRepository;
        this.storageService = storageService;
    }

    // =========================================================================
    // 1. INFORMES
    // =========================================================================

    @Override
    public InformeEntregaResponse guardarInformeFinal(MultipartFile archivo) {
        String savedPath = storageService.storeFile(archivo, INFORMES_DIR);
        return new InformeEntregaResponse(
                "¡Informe final de práctica entregado con éxito!",
                archivo.getOriginalFilename(),
                archivo.getSize(),
                archivo.getContentType(),
                LocalDateTime.now()
        );
    }

    @Override
    public InformeEntregaResponse guardarInformeFinalParaInscripcion(MultipartFile archivo, Long inscripcionId) {
        return guardarInformeFinalParaInscripcion(archivo, inscripcionId, null);
    }

    @Override
    public InformeEntregaResponse guardarInformeFinalParaInscripcion(MultipartFile archivo, Long inscripcionId, String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación docente para subir este informe.");
        }

        String emailNorm = effectiveEmail.trim().toLowerCase();

        // RN-13: El Coordinador de Práctica tiene permisos de solo lectura para auditoría
        if (SecurityUtil.isAdminOrCoordinator() || "admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: El Coordinador de Práctica tiene permisos de solo lectura para auditoría y no puede subir informes (RN-13).");
        }

        Inscripcion inscripcion = inscripcionRepository.findById(inscripcionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada."));

        // RN-02: Un profesor solo puede interactuar con alumnos inscritos con él
        boolean esSuProfesor = inscripcion.getOferta() != null && inscripcion.getOferta().getProfesor() != null
                && emailNorm.equalsIgnoreCase(inscripcion.getOferta().getProfesor().getCorreo());

        if (!esSuProfesor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Solo el profesor guía asignado puede subir este informe (RN-02 / RN-06).");
        }

        // RN-07: Ninguno de los dos puede subir más de un informe (par inscripción, emisor único)
        Optional<Informe> existingOpt = informeRepository.findByInscripcionIdAndEmisor(inscripcionId, TipoEmisor.PROFESOR);
        if (existingOpt.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invariante violada: Ya existe un informe final emitido por el docente para esta inscripción (RN-07).");
        }

        String savedPath = storageService.storeFile(archivo, INFORMES_DIR);

        Informe informe = new Informe(TipoEmisor.PROFESOR, savedPath, inscripcion);
        Informe saved = informeRepository.save(informe);

        InformeEntregaResponse resp = new InformeEntregaResponse(
                "Informe subido y registrado (id=" + saved.getId() + ")",
                archivo.getOriginalFilename(),
                archivo.getSize(),
                archivo.getContentType(),
                LocalDateTime.now()
        );
        resp.setId(saved.getId());
        resp.setArchivoUrl("/api/practicas/informes/" + saved.getId() + "/archivo");
        return resp;
    }

    @Override
    public InformeEntregaResponse guardarInformeFinalEstudiante(MultipartFile archivo, String correoEstudiante, Long userId) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(correoEstudiante);
        if (effectiveEmail == null && userId != null) {
            User u = userRepository.findById(userId).orElse(null);
            if (u != null) {
                effectiveEmail = u.getEmail();
            }
        }

        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            return guardarInformeFinal(archivo);
        }

        String emailNorm = effectiveEmail.trim().toLowerCase();

        // RN-13: El Coordinador no puede subir informes
        if (SecurityUtil.isAdminOrCoordinator() || "admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: El Coordinador tiene permisos de solo lectura para auditoría (RN-13).");
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByEstudianteCorreoWithOferta(emailNorm);
        if (inscripciones.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró ninguna inscripción de práctica activa para el estudiante.");
        }

        Inscripcion inscripcionActual = inscripciones.get(0);

        // RN-07: Ninguno puede subir más de un informe
        Optional<Informe> existingOpt = informeRepository.findByInscripcionIdAndEmisor(inscripcionActual.getId(), TipoEmisor.ESTUDIANTE);
        if (existingOpt.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invariante violada: Ya has entregado tu informe final de práctica para este período (RN-07).");
        }

        String savedPath = storageService.storeFile(archivo, INFORMES_DIR);

        Informe informe = new Informe(TipoEmisor.ESTUDIANTE, savedPath, inscripcionActual);
        Informe saved = informeRepository.save(informe);

        String asigNombre = (inscripcionActual.getOferta() != null && inscripcionActual.getOferta().getAsignaturaPractica() != null)
                ? inscripcionActual.getOferta().getAsignaturaPractica().getNombre()
                : "Práctica Actual";

        InformeEntregaResponse resp = new InformeEntregaResponse(
                "¡Informe final de práctica entregado con éxito para " + asigNombre + "!",
                archivo.getOriginalFilename(),
                archivo.getSize(),
                archivo.getContentType(),
                LocalDateTime.now()
        );
        resp.setId(saved.getId());
        resp.setArchivoUrl("/api/practicas/informes/" + saved.getId() + "/archivo");
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public InformeEntregaResponse obtenerUltimoInformeEstudiante(String email) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(email);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            return null;
        }

        Optional<Estudiante> estOpt = estudianteRepository.findByCorreo(effectiveEmail.trim().toLowerCase());
        if (estOpt.isEmpty()) {
            return null;
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByEstudianteRutWithOferta(estOpt.get().getRut());
        if (inscripciones.isEmpty()) {
            return null;
        }

        Inscripcion inscripcion = inscripciones.stream()
                .filter(i -> i.getOferta() != null && i.getOferta().getAnio() >= 2026)
                .findFirst()
                .orElse(inscripciones.get(0));

        List<Informe> informes = informeRepository.findByInscripcionIdAndEmisorOrderByIdDesc(inscripcion.getId(), TipoEmisor.ESTUDIANTE);
        if (informes.isEmpty()) {
            informes = informeRepository.findByInscripcionIdOrderByIdDesc(inscripcion.getId());
        }

        if (informes.isEmpty()) {
            return null;
        }

        Informe ultimo = informes.get(0);
        String rawArchivo = ultimo.getArchivo();
        String displayNombre = "Informe_Final.pdf";
        if (rawArchivo != null) {
            String clean = rawArchivo.replace('\\', '/');
            displayNombre = clean.substring(clean.lastIndexOf('/') + 1);
            displayNombre = displayNombre.replaceFirst("^[a-f0-9\\-]{36}_", "");
        }

        long tamano = 0L;
        if (rawArchivo != null) {
            Path p = Paths.get(rawArchivo);
            if (Files.exists(p)) {
                try {
                    tamano = Files.size(p);
                } catch (Exception ignored) {}
            }
        }

        LocalDateTime fechaEntrega = (ultimo.getFecha() != null) ? ultimo.getFecha().atStartOfDay() : LocalDateTime.now();
        InformeEntregaResponse resp = new InformeEntregaResponse(
                "Informe encontrado",
                displayNombre,
                tamano,
                "application/pdf",
                fechaEntrega
        );
        resp.setId(ultimo.getId());
        resp.setArchivoUrl("/api/practicas/informes/" + ultimo.getId() + "/archivo");
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> verArchivoInforme(Long informeId, String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación para acceder al documento.");
        }

        Informe inf = informeRepository.findById(informeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Informe no encontrado con id: " + informeId));

        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (!SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            Inscripcion insc = inf.getInscripcion();
            boolean esEstudiante = insc != null && insc.getEstudiante() != null
                    && emailNorm.equalsIgnoreCase(insc.getEstudiante().getCorreo());
            boolean esProfesor = insc != null && insc.getOferta() != null && insc.getOferta().getProfesor() != null
                    && emailNorm.equalsIgnoreCase(insc.getOferta().getProfesor().getCorreo());
            boolean esEvaluador = insc != null && asignacionRepository.findByInscripcionIdWithEvaluador(insc.getId()).stream()
                    .anyMatch(a -> a.getEvaluador() != null && emailNorm.equalsIgnoreCase(a.getEvaluador().getCorreo()));

            if (!esEstudiante && !esProfesor && !esEvaluador) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene permisos para visualizar este informe fuera de su dominio.");
            }
        }

        return storageService.servePdf(inf.getArchivo(), "samples/Ejemplo_Informe.pdf", "Informe_Final_" + informeId + ".pdf");
    }

    // =========================================================================
    // 2. EVALUACIONES
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public EvaluacionesResponseDto obtenerEvaluacionesPorProfesor(String rutProfesor, String correoProfesor, String rutEstudiante, Long inscripcionId, TipoFiltroEvaluacion tipo) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(correoProfesor);
        if (effectiveEmail != null && !effectiveEmail.isBlank()) {
            String emailNorm = effectiveEmail.trim().toLowerCase();
            if (estudianteRepository.findByCorreo(emailNorm).isPresent()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Los estudiantes deben consultar sus evaluaciones en /evaluaciones/estudiante.");
            }
        }

        String rutNorm = (rutProfesor != null && !rutProfesor.trim().isEmpty()) ? rutProfesor.trim() : null;
        String correoNorm = (effectiveEmail != null && !effectiveEmail.trim().isEmpty()) ? effectiveEmail.trim().toLowerCase() : null;
        String rutEstNorm = (rutEstudiante != null && !rutEstudiante.trim().isEmpty()) ? rutEstudiante.trim() : null;

        // RN-02: Si no se provee identificación de profesor ni admin, no se debe retornar todo indiscriminadamente
        if (rutNorm == null && correoNorm == null && !SecurityUtil.isAdminOrCoordinator()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Debe especificar el profesor para consultar evaluaciones.");
        }

        List<EvaluacionCLADto> listaClase = new ArrayList<>();
        List<EvaluacionSEMDto> listaSemestral = new ArrayList<>();

        if (tipo == TipoFiltroEvaluacion.CLASE || tipo == TipoFiltroEvaluacion.TODAS) {
            List<EvaluacionClase> evalClases;
            if (rutNorm != null || correoNorm != null || rutEstNorm != null || inscripcionId != null) {
                evalClases = evaluacionClaseRepository.findEvaluacionesPorProfesor(rutNorm, correoNorm, rutEstNorm, inscripcionId);
            } else if (SecurityUtil.isAdminOrCoordinator()) {
                evalClases = evaluacionClaseRepository.findAll();
            } else {
                evalClases = List.of();
            }

            for (EvaluacionClase ec : evalClases) {
                Estudiante est = ec.getClase() != null && ec.getClase().getInscripcion() != null
                        ? ec.getClase().getInscripcion().getEstudiante()
                        : null;
                String nombreComp = (est != null)
                        ? (est.getPrimerNombre() + " " + est.getApellidoPaterno() + " " + est.getApellidoMaterno()).trim()
                        : "Estudiante";
                String rutEst = (est != null) ? est.getRut() : "";
                LocalDateTime fechaClaseHora = (ec.getClase() != null && ec.getClase().getFecha() != null)
                        ? ec.getClase().getFecha().atStartOfDay()
                        : null;

                Evaluador ev = ec.getEvaluador();
                String evaluadorNombre = (ev != null)
                        ? (ev.getPrimerNombre() + " " + ev.getApellidoPaterno() + " " + ev.getApellidoMaterno()).trim()
                        : "Evaluador No Asignado";
                String evaluadorRut = (ev != null) ? ev.getRut() : "";
                String evaluadorTipo = (ev != null && ev.getTipo() != null) ? ev.getTipo().name() : "";

                Oferta of = ec.getClase() != null && ec.getClase().getInscripcion() != null
                        ? ec.getClase().getInscripcion().getOferta()
                        : null;
                Integer anio = of != null ? of.getAnio() : null;
                Integer periodo = of != null ? of.getPeriodo() : null;
                String asignaturaNombre = (of != null && of.getAsignaturaPractica() != null)
                        ? of.getAsignaturaPractica().getNombre()
                        : (ec.getClase() != null ? ec.getClase().getAsignatura() : "");

                String qEmail = (correoNorm != null) ? "?userEmail=" + URLEncoder.encode(correoNorm, StandardCharsets.UTF_8) : "";
                String archivoUrl = "/api/practicas/evaluaciones/clase/" + ec.getId() + "/archivo" + qEmail;
                String nombreArchivo = (ec.getArchivo() != null) ? Paths.get(ec.getArchivo()).getFileName().toString() : "Pauta_Evaluacion.pdf";

                listaClase.add(new EvaluacionCLADto(
                        ec.getId(),
                        rutEst,
                        nombreComp,
                        "CLASE",
                        null,
                        null,
                        fechaClaseHora,
                        archivoUrl,
                        nombreArchivo,
                        evaluadorNombre,
                        evaluadorRut,
                        evaluadorTipo,
                        anio,
                        periodo,
                        asignaturaNombre
                ));
            }
        }

        if (tipo == TipoFiltroEvaluacion.SEMESTRAL || tipo == TipoFiltroEvaluacion.TODAS) {
            List<EvaluacionSemestral> evalSemestrales;
            if (rutNorm != null || correoNorm != null || rutEstNorm != null || inscripcionId != null) {
                evalSemestrales = evaluacionSemestralRepository.findEvaluacionesPorProfesor(rutNorm, correoNorm, rutEstNorm, inscripcionId);
            } else if (SecurityUtil.isAdminOrCoordinator()) {
                evalSemestrales = evaluacionSemestralRepository.findAll();
            } else {
                evalSemestrales = List.of();
            }

            for (EvaluacionSemestral es : evalSemestrales) {
                Estudiante est = es.getAsignacion() != null && es.getAsignacion().getInscripcion() != null
                        ? es.getAsignacion().getInscripcion().getEstudiante()
                        : null;
                String nombreComp = (est != null)
                        ? (est.getPrimerNombre() + " " + est.getApellidoPaterno() + " " + est.getApellidoMaterno()).trim()
                        : "Estudiante";
                String rutEst = (est != null) ? est.getRut() : "";

                Evaluador ev = es.getAsignacion() != null ? es.getAsignacion().getEvaluador() : null;
                String evaluadorNombre = (ev != null)
                        ? (ev.getPrimerNombre() + " " + ev.getApellidoPaterno() + " " + ev.getApellidoMaterno()).trim()
                        : "Evaluador No Asignado";
                String evaluadorRut = (ev != null) ? ev.getRut() : "";
                String evaluadorTipo = (ev != null && ev.getTipo() != null) ? ev.getTipo().name() : "";

                Oferta of = es.getAsignacion() != null && es.getAsignacion().getInscripcion() != null
                        ? es.getAsignacion().getInscripcion().getOferta()
                        : null;
                Integer anio = of != null ? of.getAnio() : null;
                Integer periodo = of != null ? of.getPeriodo() : null;
                String asignaturaNombre = (of != null && of.getAsignaturaPractica() != null)
                        ? of.getAsignaturaPractica().getNombre()
                        : es.getAsignatura();

                String qEmail = (correoNorm != null) ? "?userEmail=" + URLEncoder.encode(correoNorm, StandardCharsets.UTF_8) : "";
                String archivoUrl = "/api/practicas/evaluaciones/semestral/" + es.getId() + "/archivo" + qEmail;
                String nombreArchivo = (es.getArchivo() != null) ? Paths.get(es.getArchivo()).getFileName().toString() : "Evaluacion_Semestral.pdf";

                listaSemestral.add(new EvaluacionSEMDto(
                        es.getId(),
                        rutEst,
                        nombreComp,
                        "SEMESTRAL",
                        null,
                        null,
                        es.getFecha(),
                        archivoUrl,
                        nombreArchivo,
                        evaluadorNombre,
                        evaluadorRut,
                        evaluadorTipo,
                        anio,
                        periodo,
                        asignaturaNombre
                ));
            }
        }

        return new EvaluacionesResponseDto(listaClase, listaSemestral);
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluacionesResponseDto obtenerEvaluacionesPorEstudiante(String correoEstudiante, String rutEstudiante, Long inscripcionId, TipoFiltroEvaluacion tipo) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(correoEstudiante);
        if (effectiveEmail != null) {
            effectiveEmail = effectiveEmail.trim().toLowerCase();
        }

        // RN-05: El estudiante autenticado no puede consultar evaluaciones de otro estudiante
        Optional<String> authEmail = SecurityUtil.getCurrentUserEmail();
        if (authEmail.isPresent() && !SecurityUtil.isAdminOrCoordinator()) {
            String loggedUser = authEmail.get();
            if (estudianteRepository.findByCorreo(loggedUser).isPresent() && effectiveEmail != null && !loggedUser.equalsIgnoreCase(effectiveEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene autorización para consultar evaluaciones de otros estudiantes (RN-05).");
            }
        }

        List<EvaluacionCLADto> listaClase = new ArrayList<>();
        List<EvaluacionSEMDto> listaSemestral = new ArrayList<>();

        if (tipo == TipoFiltroEvaluacion.CLASE || tipo == TipoFiltroEvaluacion.TODAS) {
            List<EvaluacionClase> evalClases = evaluacionClaseRepository.findEvaluacionesPorEstudiante(effectiveEmail, rutEstudiante, inscripcionId);
            for (EvaluacionClase ec : evalClases) {
                Estudiante est = ec.getClase() != null && ec.getClase().getInscripcion() != null
                        ? ec.getClase().getInscripcion().getEstudiante()
                        : null;
                String nombreComp = (est != null)
                        ? (est.getPrimerNombre() + " " + est.getApellidoPaterno() + " " + est.getApellidoMaterno()).trim()
                        : "Estudiante";
                String rutEst = (est != null) ? est.getRut() : "";
                LocalDateTime fechaClaseHora = (ec.getClase() != null && ec.getClase().getFecha() != null)
                        ? ec.getClase().getFecha().atStartOfDay()
                        : null;

                Evaluador ev = ec.getEvaluador();
                String evaluadorNombre = (ev != null)
                        ? (ev.getPrimerNombre() + " " + ev.getApellidoPaterno() + " " + ev.getApellidoMaterno()).trim()
                        : "Evaluador";
                String evaluadorRut = (ev != null) ? ev.getRut() : "";
                String evaluadorTipo = (ev != null && ev.getTipo() != null) ? ev.getTipo().name() : "";

                Oferta of = ec.getClase() != null && ec.getClase().getInscripcion() != null
                        ? ec.getClase().getInscripcion().getOferta()
                        : null;

                listaClase.add(new EvaluacionCLADto(
                        ec.getId(),
                        rutEst,
                        nombreComp,
                        "CLASE",
                        null,
                        null,
                        fechaClaseHora,
                        "/api/practicas/evaluaciones/clase/" + ec.getId() + "/archivo" + ((effectiveEmail != null) ? "?userEmail=" + URLEncoder.encode(effectiveEmail, StandardCharsets.UTF_8) : ""),
                        (ec.getArchivo() != null) ? Paths.get(ec.getArchivo()).getFileName().toString() : "Pauta.pdf",
                        evaluadorNombre,
                        evaluadorRut,
                        evaluadorTipo,
                        of != null ? of.getAnio() : null,
                        of != null ? of.getPeriodo() : null,
                        (of != null && of.getAsignaturaPractica() != null) ? of.getAsignaturaPractica().getNombre() : ""
                ));
            }
        }

        if (tipo == TipoFiltroEvaluacion.SEMESTRAL || tipo == TipoFiltroEvaluacion.TODAS) {
            List<EvaluacionSemestral> evalSemestrales = evaluacionSemestralRepository.findEvaluacionesPorEstudiante(effectiveEmail, rutEstudiante, inscripcionId);
            for (EvaluacionSemestral es : evalSemestrales) {
                Estudiante est = es.getAsignacion() != null && es.getAsignacion().getInscripcion() != null
                        ? es.getAsignacion().getInscripcion().getEstudiante()
                        : null;
                String nombreComp = (est != null)
                        ? (est.getPrimerNombre() + " " + est.getApellidoPaterno() + " " + est.getApellidoMaterno()).trim()
                        : "Estudiante";
                String rutEst = (est != null) ? est.getRut() : "";

                Evaluador ev = es.getAsignacion() != null ? es.getAsignacion().getEvaluador() : null;
                String evaluadorNombre = (ev != null)
                        ? (ev.getPrimerNombre() + " " + ev.getApellidoPaterno() + " " + ev.getApellidoMaterno()).trim()
                        : "Evaluador";
                String evaluadorRut = (ev != null) ? ev.getRut() : "";
                String evaluadorTipo = (ev != null && ev.getTipo() != null) ? ev.getTipo().name() : "";

                Oferta of = es.getAsignacion() != null && es.getAsignacion().getInscripcion() != null
                        ? es.getAsignacion().getInscripcion().getOferta()
                        : null;

                listaSemestral.add(new EvaluacionSEMDto(
                        es.getId(),
                        rutEst,
                        nombreComp,
                        "SEMESTRAL",
                        null,
                        null,
                        es.getFecha(),
                        "/api/practicas/evaluaciones/semestral/" + es.getId() + "/archivo" + ((effectiveEmail != null) ? "?userEmail=" + URLEncoder.encode(effectiveEmail, StandardCharsets.UTF_8) : ""),
                        (es.getArchivo() != null) ? Paths.get(es.getArchivo()).getFileName().toString() : "Evaluacion_Semestral.pdf",
                        evaluadorNombre,
                        evaluadorRut,
                        evaluadorTipo,
                        of != null ? of.getAnio() : null,
                        of != null ? of.getPeriodo() : null,
                        (of != null && of.getAsignaturaPractica() != null) ? of.getAsignaturaPractica().getNombre() : ""
                ));
            }
        }

        return new EvaluacionesResponseDto(listaClase, listaSemestral);
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> verArchivoEvaluacionClase(Long evaluacionClaseId, String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación de usuario.");
        }

        EvaluacionClase ec = evaluacionClaseRepository.findById(evaluacionClaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluación de clase no encontrada"));

        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (!SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            Inscripcion insc = ec.getClase() != null ? ec.getClase().getInscripcion() : null;
            boolean esEstudiante = insc != null && insc.getEstudiante() != null
                    && emailNorm.equalsIgnoreCase(insc.getEstudiante().getCorreo());
            boolean esProfesor = insc != null && insc.getOferta() != null && insc.getOferta().getProfesor() != null
                    && emailNorm.equalsIgnoreCase(insc.getOferta().getProfesor().getCorreo());
            boolean esEvaluador = ec.getEvaluador() != null && emailNorm.equalsIgnoreCase(ec.getEvaluador().getCorreo());

            if (!esEstudiante && !esProfesor && !esEvaluador) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene permisos para visualizar esta evaluación fuera de su dominio.");
            }
        }

        return storageService.servePdf(ec.getArchivo(), "samples/Pauta_Ev_Ejemplo.pdf", "Pauta_Clase_" + evaluacionClaseId + ".pdf");
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> verArchivoEvaluacionSemestral(Long evaluacionSemestralId, String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación de usuario.");
        }

        EvaluacionSemestral es = evaluacionSemestralRepository.findById(evaluacionSemestralId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluación semestral no encontrada"));

        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (!SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            Inscripcion insc = es.getAsignacion() != null ? es.getAsignacion().getInscripcion() : null;
            boolean esEstudiante = insc != null && insc.getEstudiante() != null
                    && emailNorm.equalsIgnoreCase(insc.getEstudiante().getCorreo());
            boolean esProfesor = insc != null && insc.getOferta() != null && insc.getOferta().getProfesor() != null
                    && emailNorm.equalsIgnoreCase(insc.getOferta().getProfesor().getCorreo());
            boolean esEvaluador = es.getAsignacion() != null && es.getAsignacion().getEvaluador() != null
                    && emailNorm.equalsIgnoreCase(es.getAsignacion().getEvaluador().getCorreo());

            if (!esEstudiante && !esProfesor && !esEvaluador) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene permisos para visualizar esta evaluación semestral.");
            }
        }

        return storageService.servePdf(es.getArchivo(), "samples/Pauta_Ev_Ejemplo.pdf", "Evaluacion_Semestral_" + evaluacionSemestralId + ".pdf");
    }

    // =========================================================================
    // 3. OFERTAS E INSCRIPCIONES
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<InscripcionResponse> listarInscripcionesPorProfesor(String profesorEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(profesorEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el correo del profesor.");
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByOfertaProfesorCorreo(effectiveEmail.trim());
        return inscripciones.stream().map(i -> {
            var est = i.getEstudiante();
            String nombre = String.join(" ", est.getPrimerNombre(), est.getSegundoNombre(), est.getApellidoPaterno(), est.getApellidoMaterno());
            return new InscripcionResponse(i.getId(), est.getRut(), nombre, est.getCorreo());
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OfertaResponse> listarOfertas(String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere identificación para listar ofertas.");
        }

        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (SecurityUtil.isAdminOrCoordinator() || "admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            return ofertaRepository.findAllWithDetailsOrderByAnioDescPeriodoDesc().stream().map(o -> {
                var ap = o.getAsignaturaPractica();
                Long inscritos = inscripcionRepository.countByOfertaId(o.getId());
                return new OfertaResponse(o.getId(), o.getAnio(), o.getPeriodo(), ap != null ? ap.getCodigo() : null, ap != null ? ap.getNombre() : null, inscritos == null ? 0L : inscritos);
            }).collect(Collectors.toList());
        }

        List<Oferta> ofertasDocente = ofertaRepository.findByProfesorCorreoIgnoreCaseOrderByAnioDescPeriodoDesc(emailNorm);
        if (!ofertasDocente.isEmpty()) {
            return ofertasDocente.stream().map(o -> {
                var ap = o.getAsignaturaPractica();
                Long inscritos = inscripcionRepository.countByOfertaId(o.getId());
                return new OfertaResponse(o.getId(), o.getAnio(), o.getPeriodo(), ap != null ? ap.getCodigo() : null, ap != null ? ap.getNombre() : null, inscritos == null ? 0L : inscritos);
            }).collect(Collectors.toList());
        }

        // Si es estudiante, listar sus inscripciones
        List<Inscripcion> inscripcionesEst = inscripcionRepository.findByEstudianteCorreoWithOferta(emailNorm);
        return inscripcionesEst.stream().map(i -> {
            Oferta o = i.getOferta();
            var ap = (o != null) ? o.getAsignaturaPractica() : null;
            var prof = (o != null) ? o.getProfesor() : null;
            String profNom = (prof != null) ? (prof.getPrimerNombre() + " " + prof.getApellidoPaterno()).trim() : null;
            String profCor = (prof != null) ? prof.getCorreo() : null;

            OfertaResponse r = new OfertaResponse(
                    (o != null) ? o.getId() : i.getId(),
                    (o != null) ? o.getAnio() : 0,
                    (o != null) ? o.getPeriodo() : 0,
                    (ap != null) ? ap.getCodigo() : "INF-PRA",
                    (ap != null) ? ap.getNombre() : "Práctica Profesional",
                    1L
            );
            r.setInscripcionId(i.getId());
            r.setProfesorNombre(profNom);
            r.setProfesorCorreo(profCor);
            return r;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OfertaResponse getOfertaById(Long ofertaId, String userEmail) {
        if (ofertaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el ID de la oferta.");
        }

        Oferta o = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada con id: " + ofertaId));

        // RN-12: Un profesor no puede acceder a información de asignaturas que no esté dictando o haya dictado
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail != null && !effectiveEmail.isBlank()) {
            String emailNorm = effectiveEmail.trim().toLowerCase();
            if (!SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
                boolean esProfesor = o.getProfesor() != null && emailNorm.equalsIgnoreCase(o.getProfesor().getCorreo());
                boolean esEstudianteInscrito = inscripcionRepository.findByOfertaId(ofertaId).stream()
                        .anyMatch(i -> i.getEstudiante() != null && emailNorm.equalsIgnoreCase(i.getEstudiante().getCorreo()));

                if (!esProfesor && !esEstudianteInscrito) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene autorización para consultar esta oferta académica (RN-12).");
                }
            }
        }

        var ap = o.getAsignaturaPractica();
        Long inscritos = inscripcionRepository.countByOfertaId(o.getId());
        return new OfertaResponse(o.getId(), o.getAnio(), o.getPeriodo(), ap != null ? ap.getCodigo() : null, ap != null ? ap.getNombre() : null, inscritos == null ? 0L : inscritos);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InscripcionResponse> listarInscripcionesPorOferta(Long ofertaId, String userEmail) {
        if (ofertaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el ID de la oferta.");
        }

        Oferta oferta = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada"));

        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación.");
        }

        String emailNorm = effectiveEmail.trim().toLowerCase();
        boolean esAdmin = SecurityUtil.isAdminOrCoordinator() || "admin@ubiobio.cl".equalsIgnoreCase(emailNorm);
        boolean esSuProfesor = oferta.getProfesor() != null && emailNorm.equalsIgnoreCase(oferta.getProfesor().getCorreo());

        if (!esAdmin && !esSuProfesor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene permisos para acceder a las inscripciones de esta oferta.");
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByOfertaId(ofertaId);
        return inscripciones.stream().map(i -> {
            var est = i.getEstudiante();
            String nombre = String.join(" ", est.getPrimerNombre(), est.getSegundoNombre(), est.getApellidoPaterno(), est.getApellidoMaterno());
            return new InscripcionResponse(i.getId(), est.getRut(), nombre, est.getCorreo());
        }).collect(Collectors.toList());
    }

    // =========================================================================
    // 4. DIRECTORIO Y FICHAS DE ALUMNOS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public EstudianteDetalleResponse getDetalleInscripcion(Long inscripcionId, String userEmail) {
        if (inscripcionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el ID de la inscripción.");
        }

        Inscripcion inscripcion = inscripcionRepository.findByIdWithDetails(inscripcionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        Estudiante est = inscripcion.getEstudiante();
        Oferta ofertaActual = inscripcion.getOferta();
        AsignaturaPractica apActual = ofertaActual != null ? ofertaActual.getAsignaturaPractica() : null;
        Profesor profActual = ofertaActual != null ? ofertaActual.getProfesor() : null;
        List<Asignacion> asignaciones = asignacionRepository.findByInscripcionIdWithEvaluador(inscripcionId);

        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación de usuario para consultar la ficha.");
        }

        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (!SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            boolean esSuProfesor = profActual != null && profActual.getCorreo() != null
                    && emailNorm.equalsIgnoreCase(profActual.getCorreo().trim());
            boolean esElMismoEstudiante = est != null && est.getCorreo() != null
                    && emailNorm.equalsIgnoreCase(est.getCorreo().trim());
            boolean esEvaluadorAsignado = asignaciones != null && asignaciones.stream()
                    .anyMatch(a -> a.getEvaluador() != null && a.getEvaluador().getCorreo() != null
                            && emailNorm.equalsIgnoreCase(a.getEvaluador().getCorreo().trim()));

            if (!esSuProfesor && !esElMismoEstudiante && !esEvaluadorAsignado) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Acceso denegado: No tiene autorización para consultar la ficha de un estudiante fuera de su dominio académico (RN-02 / RN-05 / RN-08).");
            }
        }

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

        resp.setEstablecimiento("Centro de Práctica");
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
                    ev.getPrimerNombre(),
                    ev.getApellidoPaterno(),
                    ev.getApellidoMaterno(),
                    ev.getCorreo(),
                    ev.getTipo() != null ? ev.getTipo().name() : "EVALUADOR"
            );
        }).filter(Objects::nonNull).collect(Collectors.toList());
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
                String cleanPath = rawArchivo.replace('\\', '/');
                nombreArchivo = cleanPath.substring(cleanPath.lastIndexOf("/") + 1);
                nombreArchivo = nombreArchivo.replaceFirst("^[a-f0-9\\-]{36}_", "");
            }
            String archivoUrl = "/api/practicas/informes/" + ultimo.getId() + "/archivo";
            resp.setInformeActual(new EstudianteDetalleResponse.InformeItemDto(
                    ultimo.getId(),
                    ultimo.getArchivo(),
                    archivoUrl,
                    nombreArchivo,
                    ultimo.getFecha() != null ? ultimo.getFecha().toString() : "",
                    ultimo.getEmisor() != null ? ultimo.getEmisor().name() : "PROFESOR"
            ));
        }

        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstudianteDirectorioDto> listarDirectorioAlumnos(String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación docente.");
        }

        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (SecurityUtil.isAdminOrCoordinator() || "admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            List<Inscripcion> inscripciones = inscripcionRepository.findAllWithDetails();
            return construirDirectorioAlumnos(inscripciones);
        }

        // RN-05: Si el usuario es estudiante, bloquear acceso directo
        if (estudianteRepository.findByCorreo(emailNorm).isPresent()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Los estudiantes no tienen autorización para consultar el directorio general de alumnos (RN-05).");
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByOfertaProfesorCorreoWithDetails(emailNorm);
        return construirDirectorioAlumnos(inscripciones);
    }

    private List<EstudianteDirectorioDto> construirDirectorioAlumnos(List<Inscripcion> inscripciones) {
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
        return new ArrayList<>(alumnoMap.values());
    }

    @Override
    @Transactional(readOnly = true)
    public EstudianteDetalleResponse getDetallePorRutEstudiante(String rut, String userEmail) {
        List<Inscripcion> inscripciones = inscripcionRepository.findByEstudianteRutWithOferta(rut);
        if (!inscripciones.isEmpty()) {
            return getDetalleInscripcion(inscripciones.get(0).getId(), userEmail);
        }

        Estudiante est = estudianteRepository.findById(rut)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estudiante no encontrado con RUT: " + rut));

        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación.");
        }
        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (!SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailNorm) && !emailNorm.equalsIgnoreCase(est.getCorreo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene permisos para consultar este estudiante fuera de su dominio.");
        }

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
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public EstudianteDetalleResponse getDetallePorCorreoEstudiante(String correo, String userEmail) {
        if (correo == null || correo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correo inválido");
        }

        List<Inscripcion> inscripciones = inscripcionRepository.findByEstudianteCorreoWithOferta(correo.trim());
        if (!inscripciones.isEmpty()) {
            return getDetalleInscripcion(inscripciones.get(0).getId(), userEmail);
        }

        Estudiante est = estudianteRepository.findByCorreo(correo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estudiante no encontrado con correo: " + correo));

        return getDetallePorRutEstudiante(est.getRut(), userEmail);
    }

    // =========================================================================
    // 5. INVARIANTES Y REGLAS DE NEGOCIO
    // =========================================================================

    @Override
    public void validarInscripcionUnicaPorPeriodo(String rutEstudiante, String correoEstudiante, Integer anio, Integer periodo) {
        if ((rutEstudiante == null || rutEstudiante.trim().isEmpty()) && (correoEstudiante == null || correoEstudiante.trim().isEmpty())) {
            return;
        }
        if (anio == null || periodo == null) {
            return;
        }
        String rutNorm = (rutEstudiante != null && !rutEstudiante.trim().isEmpty()) ? rutEstudiante.trim() : null;
        String correoNorm = (correoEstudiante != null && !correoEstudiante.trim().isEmpty()) ? correoEstudiante.trim().toLowerCase() : null;

        List<Inscripcion> existentes = inscripcionRepository.findByEstudianteAndAnioAndPeriodo(rutNorm, correoNorm, anio, periodo);
        if (!existentes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Invariante violada: El estudiante ya se encuentra inscrito en una práctica para el período académico " + anio + "-" + periodo + " (RN-01)."
            );
        }
    }

    @Override
    public void validarAsignacionEvaluador(Long inscripcionId, String rutEvaluador) {
        if (inscripcionId == null || rutEvaluador == null) return;

        List<Asignacion> asignaciones = asignacionRepository.findByInscripcionIdWithEvaluador(inscripcionId);
        Evaluador nuevoEvaluador = asignaciones.stream()
                .map(Asignacion::getEvaluador)
                .filter(ev -> ev != null && rutEvaluador.equalsIgnoreCase(ev.getRut()))
                .findFirst()
                .orElse(null);

        if (nuevoEvaluador == null) return;

        // RN-10: Máximo un TUTOR y un COLABORADOR por inscripción
        long tutores = asignaciones.stream()
                .filter(a -> a.getEvaluador() != null && TipoEvaluador.TUTOR.equals(a.getEvaluador().getTipo()))
                .count();
        long colaboradores = asignaciones.stream()
                .filter(a -> a.getEvaluador() != null && TipoEvaluador.COLABORADOR.equals(a.getEvaluador().getTipo()))
                .count();

        if (TipoEvaluador.TUTOR.equals(nuevoEvaluador.getTipo()) && tutores > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invariante violada: Ya existe un tutor asignado para esta práctica (RN-10).");
        }
        if (TipoEvaluador.COLABORADOR.equals(nuevoEvaluador.getTipo()) && colaboradores > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invariante violada: Ya existe un colaborador asignado para esta práctica (RN-10).");
        }
    }
}

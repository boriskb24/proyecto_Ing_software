package com.ubb.dochub.controller;

import com.ubb.dochub.dto.PlanificacionResponseDto;
import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.repository.PlanificacionRepository;
import com.ubb.dochub.service.PlanificacionService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import com.ubb.dochub.entity.Clase;
import com.ubb.dochub.entity.Inscripcion;
import com.ubb.dochub.repository.ClaseRepository;
import com.ubb.dochub.repository.EstudianteRepository;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/planificaciones")
public class PlanificacionController {

    private final PlanificacionService planificacionService;
    private final PlanificacionRepository planificacionRepository;
    private final EstudianteRepository estudianteRepository;
    private final ClaseRepository claseRepository;

    public PlanificacionController(PlanificacionService planificacionService,
                                   PlanificacionRepository planificacionRepository,
                                   EstudianteRepository estudianteRepository,
                                   ClaseRepository claseRepository) {
        this.planificacionService = planificacionService;
        this.planificacionRepository = planificacionRepository;
        this.estudianteRepository = estudianteRepository;
        this.claseRepository = claseRepository;
    }

    /**
     * Endpoint protegido por RBAC:
     * - Si el rol es Profesor/Administrador/Evaluador: Devuelve todas las planificaciones con sus estudiantes y clases.
     * - Si el rol es Estudiante: Filtra por sus clases inscritas (vía Clase -> Inscripcion -> Estudiante).
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
        String userEmail = payload != null ? payload.get("userEmail") : null;
        if (userEmail == null || userEmail.isBlank()) {
            userEmail = userEmailParam;
        }

        if (userEmail != null && !userEmail.isBlank()) {
            String emailNorm = userEmail.trim().toLowerCase();
            boolean esEstudiante = estudianteRepository.findByCorreo(emailNorm).isPresent();
            if (esEstudiante) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Los estudiantes no tienen permisos para calificar o evaluar planificaciones.");
            }
        }

        String estadoStr = payload != null ? payload.get("estado") : null;
        String retroalimentacion = payload != null ? payload.get("retroalimentacion") : null;

        if (estadoStr == null || estadoStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe especificar el nuevo estado ('APROBADA' o 'RECHAZADA').");
        }

        EstadoPlanificacion estado = EstadoPlanificacion.valueOf(estadoStr.toUpperCase());
        PlanificacionResponseDto actualizada = planificacionService.evaluarPlanificacion(id, estado, retroalimentacion);
        return ResponseEntity.ok(actualizada);
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> verArchivoPlanificacion(
            @PathVariable Long id,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        Planificacion p = planificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planificación no encontrada con id: " + id));

        if (userEmail != null && !userEmail.isBlank()) {
            String emailNorm = userEmail.trim().toLowerCase();
            if (!"admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
                List<Clase> clases = claseRepository.findByPlanificacionId(id);
                boolean autorizado = false;
                for (Clase clase : clases) {
                    Inscripcion insc = clase.getInscripcion();
                    boolean esEstudiante = insc != null && insc.getEstudiante() != null
                            && emailNorm.equalsIgnoreCase(insc.getEstudiante().getCorreo());
                    boolean esProfesor = insc != null && insc.getOferta() != null && insc.getOferta().getProfesor() != null
                            && emailNorm.equalsIgnoreCase(insc.getOferta().getProfesor().getCorreo());
                    if (esEstudiante || esProfesor) {
                        autorizado = true;
                        break;
                    }
                }
                if (!clases.isEmpty() && !autorizado) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No tiene permisos para visualizar este archivo de planificación fuera de su dominio.");
                }
            }
        }

        return servirPdfInline(p.getArchivo(), "Planificacion_" + id + ".pdf");
    }

    private ResponseEntity<Resource> servirPdfInline(String rutaArchivo, String fallbackNombre) {
        if (rutaArchivo != null && !rutaArchivo.trim().isEmpty()) {
            try {
                Path path = Paths.get(rutaArchivo);
                if (!Files.exists(path)) {
                    if (rutaArchivo.startsWith("/")) {
                        path = Paths.get(rutaArchivo.substring(1));
                    }
                    if (!Files.exists(path)) {
                        path = Paths.get("backend").resolve(rutaArchivo.startsWith("/") ? rutaArchivo.substring(1) : rutaArchivo);
                    }
                    if (!Files.exists(path)) {
                        path = Paths.get("uploads/planificaciones").resolve(rutaArchivo);
                    }
                    if (!Files.exists(path)) {
                        path = Paths.get("backend/uploads/planificaciones").resolve(rutaArchivo);
                    }
                    if (!Files.exists(path)) {
                        path = Paths.get("uploads/planificaciones/Ejemplo_Planificacion.pdf");
                    }
                    if (!Files.exists(path)) {
                        path = Paths.get("backend/uploads/planificaciones/Ejemplo_Planificacion.pdf");
                    }
                }
                if (Files.exists(path)) {
                    Resource resource = new UrlResource(path.toUri());
                    String nombreDescarga = path.getFileName() != null ? path.getFileName().toString() : fallbackNombre;
                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_PDF)
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nombreDescarga + "\"")
                            .body(resource);
                }
            } catch (MalformedURLException ignored) {
            }
        }

        // Fallback a recurso de ejemplo en el classpath
        ClassPathResource classpathResource = new ClassPathResource("samples/Ejemplo_Planificacion.pdf");
        if (classpathResource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fallbackNombre + "\"")
                    .body(classpathResource);
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El archivo físico de la planificación no fue encontrado en el servidor.");
    }
}

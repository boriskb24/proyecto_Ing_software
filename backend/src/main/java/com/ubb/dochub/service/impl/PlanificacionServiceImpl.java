package com.ubb.dochub.service.impl;

import com.ubb.dochub.dto.PlanificacionResponseDto;
import com.ubb.dochub.entity.Clase;
import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.entity.Estudiante;
import com.ubb.dochub.entity.Inscripcion;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.entity.User;
import com.ubb.dochub.repository.ClaseRepository;
import com.ubb.dochub.repository.InscripcionRepository;
import com.ubb.dochub.repository.PlanificacionRepository;
import com.ubb.dochub.repository.UserRepository;
import com.ubb.dochub.service.PlanificacionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
public class PlanificacionServiceImpl implements PlanificacionService {

    private static final String UPLOAD_DIR = "uploads/planificaciones";
    private final PlanificacionRepository planificacionRepository;
    private final UserRepository userRepository;
    private final ClaseRepository claseRepository;
    private final InscripcionRepository inscripcionRepository;

    public PlanificacionServiceImpl(
            PlanificacionRepository planificacionRepository,
            UserRepository userRepository,
            ClaseRepository claseRepository,
            InscripcionRepository inscripcionRepository) {
        this.planificacionRepository = planificacionRepository;
        this.userRepository = userRepository;
        this.claseRepository = claseRepository;
        this.inscripcionRepository = inscripcionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlanificacionResponseDto> obtenerHistorialPorRol(Long userId, String userRole, String email, Long inscripcionId) {
        // Resolver correo efectivo
        String emailEfectivo = (email != null && !email.trim().isEmpty()) ? email.trim().toLowerCase() : null;
        if (emailEfectivo == null && userId != null) {
            User u = userRepository.findById(userId).orElse(null);
            if (u != null) {
                emailEfectivo = u.getEmail().trim().toLowerCase();
                if (userRole == null) {
                    userRole = u.getRole();
                }
            }
        }

        // 1. Si se solicita específicamente por inscripción (Ficha del Alumno)
        if (inscripcionId != null) {
            if (emailEfectivo != null && !"admin@ubiobio.cl".equalsIgnoreCase(emailEfectivo)) {
                Inscripcion insc = inscripcionRepository.findByIdWithDetails(inscripcionId).orElse(null);
                if (insc != null) {
                    boolean esSuProfesor = insc.getOferta() != null && insc.getOferta().getProfesor() != null
                            && emailEfectivo.equalsIgnoreCase(insc.getOferta().getProfesor().getCorreo());
                    boolean esElMismoEstudiante = insc.getEstudiante() != null
                            && emailEfectivo.equalsIgnoreCase(insc.getEstudiante().getCorreo());
                    if (!esSuProfesor && !esElMismoEstudiante) {
                        return List.of();
                    }
                }
            }

            List<Clase> clasesInscripcion = claseRepository.findClasesWithPlanificacionByInscripcionId(inscripcionId);
            List<PlanificacionResponseDto> resultado = new ArrayList<>();
            for (Clase c : clasesInscripcion) {
                if (c.getPlanificacion() != null) {
                    resultado.add(mapToDto(c.getPlanificacion(), c));
                }
            }
            return resultado;
        }

        // 2. Administrador: supervisión global
        if ("Administrador".equalsIgnoreCase(userRole)) {
            List<Clase> todas = claseRepository.findAllClasesWithPlanificacion();
            List<PlanificacionResponseDto> resultado = new ArrayList<>();
            for (Clase c : todas) {
                if (c.getPlanificacion() != null) {
                    resultado.add(mapToDto(c.getPlanificacion(), c));
                }
            }
            return resultado;
        }

        // 3. Profesor de Asignatura: ÚNICAMENTE planificaciones de estudiantes en sus prácticas
        if ("Profesor".equalsIgnoreCase(userRole) || "Evaluador".equalsIgnoreCase(userRole)) {
            if (emailEfectivo != null) {
                List<Clase> clasesProfesor = claseRepository.findClasesWithPlanificacionByProfesorCorreo(emailEfectivo.trim());
                List<PlanificacionResponseDto> resultado = new ArrayList<>();
                for (Clase c : clasesProfesor) {
                    if (c.getPlanificacion() != null) {
                        resultado.add(mapToDto(c.getPlanificacion(), c));
                    }
                }
                return resultado;
            }
            return List.of();
        }

        // 4. Estudiante: ÚNICAMENTE sus propias planificaciones
        if (emailEfectivo != null) {
            List<Clase> clasesEstudiante = claseRepository.findClasesWithPlanificacionByEstudianteCorreo(emailEfectivo.trim());
            List<PlanificacionResponseDto> resultado = new ArrayList<>();
            for (Clase c : clasesEstudiante) {
                if (c.getPlanificacion() != null) {
                    resultado.add(mapToDto(c.getPlanificacion(), c));
                }
            }
            return resultado;
        }

        return List.of();
    }

    @Override
    @Transactional
    public PlanificacionResponseDto guardarPlanificacion(MultipartFile archivo, Long userId) {
        return guardarPlanificacion(archivo, userId, null);
    }

    @Override
    @Transactional
    public PlanificacionResponseDto guardarPlanificacion(MultipartFile archivo, Long userId, LocalDate fechaClase) {
        // 1. Validar que el archivo exista y no esté vacío
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar un archivo válido para subir.");
        }

        String originalFilename = archivo.getOriginalFilename();
        String contentType = archivo.getContentType();

        // 2. Validación estricta de formato PDF
        boolean isPdfMime = "application/pdf".equalsIgnoreCase(contentType);
        boolean hasPdfExtension = originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf");

        if (!isPdfMime || !hasPdfExtension) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Formato no válido. Solo se admiten archivos en formato PDF (.pdf).");
        }

        try {
            // 3. Crear el directorio físico si no existe
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 4. Generar nombre único para evitar colisiones
            String cleanName = (originalFilename != null) ? originalFilename.replaceAll("\\s+", "_") : "plan.pdf";
            String uniqueFileName = UUID.randomUUID() + "_" + cleanName;
            Path targetLocation = uploadPath.resolve(uniqueFileName);

            // 5. Guardar archivo físico en disco
            Files.copy(archivo.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 6. Crear y persistir el registro de Planificación puro (según MER)
            Planificacion planificacion = new Planificacion();
            planificacion.setArchivo(targetLocation.toString());
            planificacion.setEstado(EstadoPlanificacion.PENDIENTE);
            planificacion.setFecha(LocalDate.now());

            Planificacion guardada = planificacionRepository.save(planificacion);

            // 7. Conectar la relación canónica mediante la entidad Clase (FK id_planificacion e id_inscripcion)
            Clase claseGuardada = null;
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null && user.getEmail() != null) {
                    List<Inscripcion> inscripciones = inscripcionRepository.findByEstudianteCorreoWithOferta(user.getEmail());
                    if (!inscripciones.isEmpty()) {
                        Inscripcion inscripcion = inscripciones.get(0);
                        Clase clase = new Clase();
                        clase.setFecha(fechaClase != null ? fechaClase : LocalDate.now());
                        clase.setPlanificacion(guardada);
                        clase.setInscripcion(inscripcion);
                        String asig = (inscripcion.getOferta() != null && inscripcion.getOferta().getAsignaturaPractica() != null)
                                ? inscripcion.getOferta().getAsignaturaPractica().getNombre()
                                : "Práctica Profesional";
                        clase.setAsignatura(asig);
                        clase.setTema("Planificación: " + guardada.getNombreArchivo());
                        clase.setHoraInicio(LocalTime.of(8, 30));
                        clase.setHoraFin(LocalTime.of(10, 0));
                        claseGuardada = claseRepository.save(clase);
                    }
                }
            }

            return mapToDto(guardada, claseGuardada);

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al guardar el archivo en el servidor: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public PlanificacionResponseDto evaluarPlanificacion(Long id, EstadoPlanificacion nuevoEstado, String retroalimentacion) {
        Planificacion planificacion = planificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planificación no encontrada con id: " + id));

        planificacion.setEstado(nuevoEstado);
        if (retroalimentacion != null && !retroalimentacion.trim().isEmpty()) {
            planificacion.setRetroalimentacion(retroalimentacion.trim());
        }

        Planificacion guardada = planificacionRepository.save(planificacion);
        List<Clase> clases = claseRepository.findByPlanificacionId(guardada.getId());
        Clase clase = clases.isEmpty() ? null : clases.get(0);

        return mapToDto(guardada, clase);
    }

    private PlanificacionResponseDto mapToDto(Planificacion p, Clase c) {
        PlanificacionResponseDto dto = new PlanificacionResponseDto();
        dto.setId(p.getId());
        dto.setArchivo(p.getArchivo());
        dto.setNombreArchivo(p.getNombreArchivo());
        dto.setTipoArchivo(p.getTipoArchivo());
        dto.setEstado(p.getEstado());
        dto.setFecha(p.getFecha() != null ? p.getFecha().toString() : "");
        dto.setFechaCreacion(p.getFechaCreacion());
        dto.setRetroalimentacion(p.getRetroalimentacion());
        dto.setArchivoUrl("/api/planificaciones/" + p.getId() + "/archivo");

        if (c != null) {
            if (c.getFecha() != null) {
                dto.setFechaClase(c.getFecha().toString());
            }
            if (c.getInscripcion() != null && c.getInscripcion().getEstudiante() != null) {
                Estudiante est = c.getInscripcion().getEstudiante();
                String nombreCompleto = (est.getPrimerNombre() + " " + est.getApellidoPaterno() + " " + est.getApellidoMaterno()).trim();
                Long uid = null;
                Optional<User> uOpt = userRepository.findByEmail(est.getCorreo());
                if (uOpt.isPresent()) {
                    uid = uOpt.get().getId();
                }
                dto.setUsuario(new PlanificacionResponseDto.UsuarioPlanificacionDto(
                        uid,
                        nombreCompleto,
                        est.getCorreo(),
                        "Estudiante"
                ));
            }
        }
        return dto;
    }
}

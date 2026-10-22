package com.ubb.dochub.service.impl;

import com.ubb.dochub.dto.PlanificacionResponseDto;
import com.ubb.dochub.entity.Clase;
import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.entity.Estudiante;
import com.ubb.dochub.entity.Inscripcion;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.entity.User;
import com.ubb.dochub.repository.ClaseRepository;
import com.ubb.dochub.repository.EstudianteRepository;
import com.ubb.dochub.repository.InscripcionRepository;
import com.ubb.dochub.repository.PlanificacionRepository;
import com.ubb.dochub.repository.UserRepository;
import com.ubb.dochub.security.SecurityUtil;
import com.ubb.dochub.service.PlanificacionService;
import com.ubb.dochub.service.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PlanificacionServiceImpl implements PlanificacionService {

    private static final String PLANIFICACIONES_DIR = "uploads/planificaciones";

    private final PlanificacionRepository planificacionRepository;
    private final UserRepository userRepository;
    private final ClaseRepository claseRepository;
    private final InscripcionRepository inscripcionRepository;
    private final EstudianteRepository estudianteRepository;
    private final StorageService storageService;

    public PlanificacionServiceImpl(
            PlanificacionRepository planificacionRepository,
            UserRepository userRepository,
            ClaseRepository claseRepository,
            InscripcionRepository inscripcionRepository,
            EstudianteRepository estudianteRepository,
            StorageService storageService) {
        this.planificacionRepository = planificacionRepository;
        this.userRepository = userRepository;
        this.claseRepository = claseRepository;
        this.inscripcionRepository = inscripcionRepository;
        this.estudianteRepository = estudianteRepository;
        this.storageService = storageService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlanificacionResponseDto> obtenerHistorialPorRol(Long userId, String userRole, String email, Long inscripcionId) {
        String emailEfectivo = SecurityUtil.getCurrentUserEmail().orElse(email);
        if (emailEfectivo != null) {
            emailEfectivo = emailEfectivo.trim().toLowerCase();
        }

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
            if (emailEfectivo != null && !SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailEfectivo)) {
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

        // 2. Administrador / Coordinador: supervisión global para auditoría
        if (SecurityUtil.isAdminOrCoordinator() || "Administrador".equalsIgnoreCase(userRole)) {
            List<Clase> todas = claseRepository.findAllClasesWithPlanificacion();
            List<PlanificacionResponseDto> resultado = new ArrayList<>();
            for (Clase c : todas) {
                if (c.getPlanificacion() != null) {
                    resultado.add(mapToDto(c.getPlanificacion(), c));
                }
            }
            return resultado;
        }

        // 3. Profesor de Asignatura: ÚNICAMENTE planificaciones de estudiantes en sus prácticas (RN-02)
        if ("Profesor".equalsIgnoreCase(userRole) || SecurityUtil.hasRole("PROFESOR")) {
            if (emailEfectivo != null) {
                List<Clase> clasesProfesor = claseRepository.findClasesWithPlanificacionByProfesorCorreo(emailEfectivo.trim());
                List<PlanificacionResponseDto> resultado = new ArrayList<>();
                for (Clase c : clasesProfesor) {
                    if (c.getPlanificacion() != null) {
                        if (c.getPlanificacion().getEstado() != EstadoPlanificacion.EN_REVISION_IA) {
                            resultado.add(mapToDto(c.getPlanificacion(), c));
                        }
                    }
                }
                return resultado;
            }
            return List.of();
        }

        // 4. Estudiante: ÚNICAMENTE sus propias planificaciones (RN-05)
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
    public PlanificacionResponseDto guardarPlanificacion(MultipartFile archivo, Long userId) {
        return guardarPlanificacion(archivo, userId, null);
    }

    @Override
    public PlanificacionResponseDto guardarPlanificacion(MultipartFile archivo, Long userId, LocalDate fechaClase) {
        // RN-13: El Coordinador de Práctica tiene permisos de solo lectura para auditoría y no puede subir planificaciones
        String callerEmail = SecurityUtil.getCurrentUserEmail().orElse(null);
        if (SecurityUtil.isAdminOrCoordinator() || (callerEmail != null && "admin@ubiobio.cl".equalsIgnoreCase(callerEmail))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: El Coordinador de Práctica tiene permisos de solo lectura para auditoría y no puede subir planificaciones (RN-13).");
        }

        String targetLocation = storageService.storeFile(archivo, PLANIFICACIONES_DIR);

        Planificacion planificacion = new Planificacion();
        planificacion.setArchivo(targetLocation);
        planificacion.setEstado(EstadoPlanificacion.EN_REVISION_IA);
        planificacion.setFecha(LocalDate.now());

        Planificacion guardada = planificacionRepository.save(planificacion);

        Clase claseGuardada = null;
        String emailToUse = callerEmail;
        if (emailToUse == null && userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                emailToUse = user.getEmail();
            }
        }

        if (emailToUse != null) {
            List<Inscripcion> inscripciones = inscripcionRepository.findByEstudianteCorreoWithOferta(emailToUse.trim().toLowerCase());
            if (!inscripciones.isEmpty()) {
                Inscripcion inscripcion = inscripciones.get(0);
                LocalDate targetFecha = (fechaClase != null) ? fechaClase : LocalDate.now();
                LocalTime targetHoraInicio = LocalTime.of(8, 30);
                LocalTime targetHoraFin = LocalTime.of(10, 0);

                // RN-11: Verificar unicidad y solapamiento horario en clases para la misma fecha e inscripción
                List<Clase> clasesExistentes = claseRepository.findByInscripcionIdAndFecha(inscripcion.getId(), targetFecha);
                Clase claseConflicto = null;
                for (Clase c : clasesExistentes) {
                    if (c.getHoraInicio() != null) {
                        boolean mismaHoraInicio = c.getHoraInicio().equals(targetHoraInicio);
                        boolean solapaDentro = c.getHoraFin() != null
                                && !targetHoraInicio.isBefore(c.getHoraInicio())
                                && targetHoraInicio.isBefore(c.getHoraFin());
                        if (mismaHoraInicio || solapaDentro) {
                            claseConflicto = c;
                            break;
                        }
                    }
                }

                if (claseConflicto != null) {
                    // RN-11: El sistema evita la inserción de nuevo registro y mantiene la clase ya registrada
                    if (claseConflicto.getPlanificacion() == null) {
                        claseConflicto.setPlanificacion(guardada);
                        claseGuardada = claseRepository.save(claseConflicto);
                    } else {
                        claseGuardada = claseConflicto;
                    }
                } else {
                    Clase clase = new Clase();
                    clase.setFecha(targetFecha);
                    clase.setPlanificacion(guardada);
                    clase.setInscripcion(inscripcion);
                    String asig = (inscripcion.getOferta() != null && inscripcion.getOferta().getAsignaturaPractica() != null)
                            ? inscripcion.getOferta().getAsignaturaPractica().getNombre()
                            : "Práctica Profesional";
                    clase.setAsignatura(asig);
                    clase.setTema("Planificación: " + guardada.getNombreArchivo());
                    clase.setHoraInicio(targetHoraInicio);
                    clase.setHoraFin(targetHoraFin);
                    claseGuardada = claseRepository.save(clase);
                }
            }
        }

        return mapToDto(guardada, claseGuardada);
    }

    @Override
    public PlanificacionResponseDto evaluarPlanificacion(Long id, EstadoPlanificacion nuevoEstado, String retroalimentacion) {
        return evaluarPlanificacion(id, nuevoEstado, retroalimentacion, null);
    }

    @Override
    public PlanificacionResponseDto evaluarPlanificacion(Long id, EstadoPlanificacion nuevoEstado, String retroalimentacion, String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación docente para evaluar planificaciones.");
        }

        String emailNorm = effectiveEmail.trim().toLowerCase();

        // RN-13: El Coordinador de Práctica tiene permisos de solo lectura para auditoría y tiene estrictamente prohibido evaluar planificaciones
        if (SecurityUtil.isAdminOrCoordinator() || "admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: El Coordinador de Práctica tiene permisos de solo lectura para auditoría y no puede evaluar planificaciones (RN-13).");
        }

        userRepository.findByEmail(emailNorm).ifPresent(u -> {
            if ("Administrador".equalsIgnoreCase(u.getRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: El Coordinador de Práctica tiene permisos de solo lectura para auditoría y no puede evaluar planificaciones (RN-13).");
            }
            if ("Evaluador".equalsIgnoreCase(u.getRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Los evaluadores no tienen permisos para calificar o evaluar planificaciones de clase (RN-13 / RN-14).");
            }
            if ("Estudiante".equalsIgnoreCase(u.getRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Los estudiantes no tienen permisos para calificar o evaluar planificaciones.");
            }
        });

        if (estudianteRepository.findByCorreo(emailNorm).isPresent()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Los estudiantes no tienen permisos para calificar o evaluar planificaciones.");
        }

        // RN-02: Un profesor no puede evaluar planificaciones de estudiantes no inscritos con él
        List<Clase> clases = claseRepository.findByPlanificacionId(id);
        if (!clases.isEmpty()) {
            boolean esProfesorDeClase = clases.stream().anyMatch(c ->
                    c.getInscripcion() != null
                            && c.getInscripcion().getOferta() != null
                            && c.getInscripcion().getOferta().getProfesor() != null
                            && emailNorm.equalsIgnoreCase(c.getInscripcion().getOferta().getProfesor().getCorreo()));
            if (!esProfesorDeClase) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Un profesor no puede evaluar planificaciones de alumnos no inscritos con él (RN-02).");
            }
        }

        Planificacion planificacion = planificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planificación no encontrada con id: " + id));

        planificacion.setEstado(nuevoEstado);
        if (retroalimentacion != null && !retroalimentacion.trim().isEmpty()) {
            planificacion.setRetroalimentacion(retroalimentacion.trim());
        }

        Planificacion guardada = planificacionRepository.save(planificacion);
        Clase clase = clases.isEmpty() ? null : clases.get(0);

        return mapToDto(guardada, clase);
    }

    @Override
    public PlanificacionResponseDto formalizarEntrega(Long id, String estudianteEmail) {
        Planificacion planificacion = planificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planificación no encontrada con id: " + id));

        planificacion.setEstado(EstadoPlanificacion.PENDIENTE);
        planificacion.setFecha(LocalDate.now());
        Planificacion guardada = planificacionRepository.save(planificacion);

        List<Clase> clases = claseRepository.findByPlanificacionId(id);
        Clase clase = clases.isEmpty() ? null : clases.get(0);

        return mapToDto(guardada, clase);
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> verArchivoPlanificacion(Long id, String userEmail) {
        String effectiveEmail = SecurityUtil.getCurrentUserEmail().orElse(userEmail);
        if (effectiveEmail == null || effectiveEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: Se requiere identificación de usuario para visualizar la planificación.");
        }

        Planificacion p = planificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planificación no encontrada con id: " + id));

        String emailNorm = effectiveEmail.trim().toLowerCase();
        if (!SecurityUtil.isAdminOrCoordinator() && !"admin@ubiobio.cl".equalsIgnoreCase(emailNorm)) {
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

        return storageService.servePdf(p.getArchivo(), "samples/Ejemplo_Planificacion.pdf", "Planificacion_" + id + ".pdf");
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

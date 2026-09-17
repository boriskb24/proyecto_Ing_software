package com.ubb.dochub.service.impl;

import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.entity.User;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PlanificacionServiceImpl implements PlanificacionService {

    private static final String UPLOAD_DIR = "uploads/planificaciones";
    private final PlanificacionRepository planificacionRepository;
    private final UserRepository userRepository;

    public PlanificacionServiceImpl(PlanificacionRepository planificacionRepository, UserRepository userRepository) {
        this.planificacionRepository = planificacionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Planificacion> obtenerHistorialPorRol(Long userId, String userRole) {
        // Validación de RBAC:
        // Si el rol es Profesor, Administrador o Evaluador -> Devuelve TODAS las planificaciones
        if ("Profesor".equalsIgnoreCase(userRole) || "Administrador".equalsIgnoreCase(userRole) || "Evaluador".equalsIgnoreCase(userRole)) {
            return planificacionRepository.findAllByOrderByFechaDesc();
        }

        // Si es Estudiante -> Aplica filtro WHERE user_id = :userId
        if (userId != null) {
            return planificacionRepository.findByUsuarioIdOrderByFechaDesc(userId);
        }

        return List.of();
    }

    @Override
    @Transactional
    public Planificacion guardarPlanificacion(MultipartFile archivo, Long userId) {
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

            // 6. Crear y persistir el registro con timestamp real dinámico
            Planificacion planificacion = new Planificacion();
            planificacion.setArchivo(targetLocation.toString());
            planificacion.setEstado(EstadoPlanificacion.PENDIENTE);
            planificacion.setFecha(LocalDateTime.now());

            // 7. Asociar al usuario autenticado (RBAC)
            if (userId != null) {
                userRepository.findById(userId).ifPresent(planificacion::setUsuario);
            }

            return planificacionRepository.save(planificacion);

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al guardar el archivo en el servidor: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Planificacion evaluarPlanificacion(Long id, EstadoPlanificacion nuevoEstado, String retroalimentacion) {
        Planificacion planificacion = planificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planificación no encontrada con id: " + id));

        planificacion.setEstado(nuevoEstado);
        if (retroalimentacion != null && !retroalimentacion.trim().isEmpty()) {
            planificacion.setRetroalimentacion(retroalimentacion.trim());
        }

        return planificacionRepository.save(planificacion);
    }
}

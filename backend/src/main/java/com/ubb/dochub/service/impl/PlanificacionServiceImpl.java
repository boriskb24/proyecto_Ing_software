package com.ubb.dochub.service.impl;

import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.repository.PlanificacionRepository;
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

    public PlanificacionServiceImpl(PlanificacionRepository planificacionRepository) {
        this.planificacionRepository = planificacionRepository;
    }

    @Override
    @Transactional
    public Planificacion guardarPlanificacion(MultipartFile archivo) {
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
            // 2. Crear el directorio físico si no existe
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 3. Generar un nombre único para evitar sobreescritura accidental
            String cleanName = (originalFilename != null) ? originalFilename.replaceAll("\\s+", "_") : "archivo";
            String uniqueFileName = UUID.randomUUID() + "_" + cleanName;
            Path targetLocation = uploadPath.resolve(uniqueFileName);

            // 4. Guardar archivo físico en disco
            Files.copy(archivo.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 5. Crear y persistir el registro en Base de Datos
            Planificacion planificacion = Planificacion.builder()
                    .nombreArchivo(originalFilename != null ? originalFilename : uniqueFileName)
                    .tipoArchivo(contentType != null ? contentType : "application/octet-stream")
                    .rutaAlmacenamiento(targetLocation.toString())
                    .fechaCreacion(LocalDateTime.now())
                    .build();

            return planificacionRepository.save(planificacion);

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al guardar el archivo en el servidor: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Planificacion> obtenerTodas() {
        return planificacionRepository.findAllByOrderByFechaCreacionDesc();
    }
}

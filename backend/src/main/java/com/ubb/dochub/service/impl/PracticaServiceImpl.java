package com.ubb.dochub.service.impl;

import com.ubb.dochub.dto.InformeEntregaResponse;
import com.ubb.dochub.service.PracticaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PracticaServiceImpl implements PracticaService {

    private static final String UPLOAD_DIR = "uploads/informes";

    @Override
    public InformeEntregaResponse guardarInformeFinal(MultipartFile archivo) {
        // 1. Validar que el archivo no esté vacío
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar un archivo para subir.");
        }

        // 2. Validar estrictamente el Content-Type para PDF
        String contentType = archivo.getContentType();
        String originalFilename = archivo.getOriginalFilename();

        boolean isPdfMime = "application/pdf".equalsIgnoreCase(contentType);
        boolean hasPdfExtension = originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf");

        if (!isPdfMime || !hasPdfExtension) {
            throw new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, 
                "Formato inválido. Solo se admiten archivos en formato PDF (application/pdf)."
            );
        }

        // 3. Simular guardado en almacenamiento local
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Nombre único para evitar colisiones
            String safeFileName = UUID.randomUUID() + "_" + (originalFilename != null ? originalFilename.replaceAll("\\s+", "_") : "informe.pdf");
            Path targetLocation = uploadPath.resolve(safeFileName);
            
            Files.copy(archivo.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return new InformeEntregaResponse(
                "¡Informe final de práctica entregado con éxito!",
                originalFilename,
                archivo.getSize(),
                contentType,
                LocalDateTime.now()
            );
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "Error al procesar y guardar el archivo: " + e.getMessage()
            );
        }
    }
}

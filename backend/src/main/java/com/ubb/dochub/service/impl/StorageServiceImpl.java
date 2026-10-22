package com.ubb.dochub.service.impl;

import com.ubb.dochub.service.StorageService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class StorageServiceImpl implements StorageService {

    @Override
    public String storeFile(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar un archivo válido para subir.");
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        boolean isPdfMime = "application/pdf".equalsIgnoreCase(contentType);
        boolean hasPdfExtension = originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf");

        if (!isPdfMime || !hasPdfExtension) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Formato no válido. Solo se admiten archivos en formato PDF (.pdf)."
            );
        }

        try {
            Path uploadPath = Paths.get(subDirectory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String cleanName = (originalFilename != null) ? originalFilename.replaceAll("\\s+", "_") : "documento.pdf";
            String uniqueFileName = UUID.randomUUID() + "_" + cleanName;
            Path targetLocation = uploadPath.resolve(uniqueFileName);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return targetLocation.toString().replace('\\', '/');
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al guardar el archivo en el servidor: " + e.getMessage()
            );
        }
    }

    @Override
    public Resource loadFileAsResource(String filePath, String fallbackSamplePath) {
        if (filePath != null && !filePath.isBlank()) {
            try {
                Path path = Paths.get(filePath);
                if (Files.exists(path) && Files.isReadable(path)) {
                    return new UrlResource(path.toUri());
                }

                // Intentar prefijando backend/
                Path backendPath = Paths.get("backend").resolve(filePath);
                if (Files.exists(backendPath) && Files.isReadable(backendPath)) {
                    return new UrlResource(backendPath.toUri());
                }
            } catch (MalformedURLException ignored) {
            }
        }

        // Fallback a classpath samples si se especificó
        if (fallbackSamplePath != null && !fallbackSamplePath.isBlank()) {
            Resource sample = new ClassPathResource(fallbackSamplePath);
            if (sample.exists()) {
                return sample;
            }
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El archivo solicitado no fue encontrado en el servidor.");
    }

    @Override
    public ResponseEntity<Resource> servePdf(String filePath, String fallbackSamplePath, String downloadFilename) {
        Resource resource = loadFileAsResource(filePath, fallbackSamplePath);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + downloadFilename + "\"")
                .body(resource);
    }
}

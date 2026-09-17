package com.ubb.dochub.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class UploadsInitializer {

    private static final String UPLOAD_DIR = "uploads/informes";

    @PostConstruct
    public void createUploadDirs() {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            // Log to stderr; let application continue to start but operations will fail with clearer error
            System.err.println("No se pudo crear el directorio de uploads: " + uploadPath.toAbsolutePath() + " -> " + e.getMessage());
        }
    }
}

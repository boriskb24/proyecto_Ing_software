package com.ubb.dochub.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Component
public class UploadsInitializer {

    private static final List<String> UPLOAD_DIRS = List.of(
            "uploads/informes",
            "uploads/planificaciones",
            "uploads/evaluaciones"
    );

    @PostConstruct
    public void createUploadDirs() {
        for (String dir : UPLOAD_DIRS) {
            Path path = Paths.get(dir);
            try {
                if (!Files.exists(path)) {
                    Files.createDirectories(path);
                }
            } catch (IOException e) {
                System.err.println("No se pudo crear directorio de uploads: " + path.toAbsolutePath() + " -> " + e.getMessage());
            }
        }

        // 1. Pauta de Evaluación
        asegurarArchivo(
                "uploads/evaluaciones/Pauta_Ev_Ejemplo.pdf",
                "/samples/Pauta_Ev_Ejemplo.pdf",
                "Pauta_Ev_Ejemplo.pdf"
        );

        // 2. Planificaciones de Ejemplo (Independientes por Estudiante)
        List<String> planificacionesMuestra = List.of(
                "uploads/planificaciones/Ejemplo_Planificacion.pdf",
                "uploads/planificaciones/Planificacion_Diego_Martinez.pdf",
                "uploads/planificaciones/Planificacion_Valentina_Rojas.pdf",
                "uploads/planificaciones/Planificacion_Sebastian_Fuentes.pdf",
                "uploads/planificaciones/Planificacion_Ana_Perez.pdf",
                "uploads/planificaciones/Planificacion_Bruno_Munoz.pdf"
        );
        for (String rutaPlan : planificacionesMuestra) {
            asegurarArchivo(
                    rutaPlan,
                    "/samples/Ejemplo_Planificacion.pdf",
                    "Ejemplo_Planificacion.pdf"
            );
        }

        // 3. Informe Final de Ejemplo
        asegurarArchivo(
                "uploads/informes/Ejemplo_Informe.pdf",
                "/samples/Ejemplo_Informe.pdf",
                "Ejemplo_Informe.pdf"
        );
    }

    private void asegurarArchivo(String rutaDestino, String recursoClasspath, String nombreArchivo) {
        Path targetPath = Paths.get(rutaDestino);
        if (Files.exists(targetPath)) {
            return;
        }

        // 1. Intentar desde recurso embebido en el classpath (app.jar)
        try (InputStream is = getClass().getResourceAsStream(recursoClasspath)) {
            if (is != null) {
                if (targetPath.getParent() != null && !Files.exists(targetPath.getParent())) {
                    Files.createDirectories(targetPath.getParent());
                }
                Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
                System.out.println(nombreArchivo + " copiado exitosamente desde classpath a: " + targetPath.toAbsolutePath());
                return;
            }
        } catch (Exception e) {
            System.err.println("No se pudo copiar " + nombreArchivo + " desde classpath: " + e.getMessage());
        }

        // 2. Fallback por sistema de archivos local
        List<Path> posiblesOrigenes = List.of(
                Paths.get(nombreArchivo),
                Paths.get("../" + nombreArchivo),
                Paths.get("../../" + nombreArchivo),
                Paths.get("backend/src/main/resources/samples/" + nombreArchivo),
                Paths.get("backend/uploads/" + rutaDestino.replaceFirst("^uploads/", ""))
        );
        for (Path origen : posiblesOrigenes) {
            if (Files.exists(origen)) {
                try {
                    if (targetPath.getParent() != null && !Files.exists(targetPath.getParent())) {
                        Files.createDirectories(targetPath.getParent());
                    }
                    Files.copy(origen, targetPath, StandardCopyOption.REPLACE_EXISTING);
                    System.out.println(nombreArchivo + " copiado desde " + origen + " a " + targetPath.toAbsolutePath());
                    break;
                } catch (IOException e) {
                    System.err.println("No se pudo copiar " + nombreArchivo + ": " + e.getMessage());
                }
            }
        }
    }
}

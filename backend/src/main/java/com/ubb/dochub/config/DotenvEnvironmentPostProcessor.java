package com.ubb.dochub.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * Procesador de arranque de Spring Boot que detecta y carga automáticamente el archivo .env
 * (ubicado en el directorio actual o en la raíz del proyecto) hacia el Environment de Spring.
 * Permite que todas las variables declaradas en .env sean accesibles como propiedades ${VAR}
 * tanto en ejecución manual con Maven como en pruebas automatizadas.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        loadDotenv();
        File envFile = findDotenvFile();
        if (envFile != null && envFile.exists() && envFile.isFile()) {
            try {
                Dotenv dotenv = Dotenv.configure()
                        .directory(envFile.getParent() != null ? envFile.getParent() : ".")
                        .filename(envFile.getName())
                        .ignoreIfMissing()
                        .load();

                Map<String, Object> dotenvProps = new HashMap<>();
                dotenv.entries().forEach(entry -> dotenvProps.put(entry.getKey(), entry.getValue()));
                environment.getPropertySources().addLast(new MapPropertySource("dotenvProperties", dotenvProps));
            } catch (Exception e) {
                System.err.println("DotenvEnvironmentPostProcessor: Aviso: " + e.getMessage());
            }
        }
    }

    public static void loadDotenv() {
        File envFile = findDotenvFile();
        if (envFile == null || !envFile.exists() || !envFile.isFile()) {
            return;
        }

        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory(envFile.getParent() != null ? envFile.getParent() : ".")
                    .filename(envFile.getName())
                    .ignoreIfMissing()
                    .load();

            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
            System.out.println(">>> [Dotenv] Variables cargadas exitosamente desde: " + envFile.getAbsolutePath());
        } catch (Exception e) {
            System.err.println(">>> [Dotenv] No se pudo cargar .env: " + e.getMessage());
        }
    }

    private static File findDotenvFile() {
        // 1. Probar en el directorio de trabajo actual
        File file = new File(".env");
        if (file.exists() && file.isFile()) {
            return file;
        }

        // 2. Probar en el directorio padre (común al ejecutar desde 'backend/')
        file = new File("../.env");
        if (file.exists() && file.isFile()) {
            return file;
        }

        return null;
    }
}

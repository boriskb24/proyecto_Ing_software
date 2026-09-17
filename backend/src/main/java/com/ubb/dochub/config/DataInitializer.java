package com.ubb.dochub.config;

import com.ubb.dochub.entity.User;
import com.ubb.dochub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Usuario Administrador
        User admin = userRepository.findByEmail("admin@ubiobio.cl").orElse(new User());
        admin.setFullName("Prof. Boris Arenas");
        admin.setEmail("admin@ubiobio.cl");
        admin.setRole("Administrador");
        admin.setPassword(passwordEncoder.encode("12345678b"));
        userRepository.save(admin);
        System.out.println("✅ Usuario administrador: admin@ubiobio.cl / 12345678b");

        // 2. Usuario Evaluador (Empresa / Supervisor de Práctica)
        User evaluador = userRepository.findByEmail("evaluador@empresa.cl").orElse(new User());
        evaluador.setFullName("Ing. Carlos Mendoza (Evaluador Empresa)");
        evaluador.setEmail("evaluador@empresa.cl");
        evaluador.setRole("Evaluador");
        evaluador.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(evaluador);
        System.out.println("✅ Usuario evaluador: evaluador@empresa.cl / password123");

        // 3. Usuario Profesor Guía
        User profesor = userRepository.findByEmail("profesor@ubiobio.cl").orElse(new User());
        profesor.setFullName("Prof. Juan Pérez (Profesor Guía)");
        profesor.setEmail("profesor@ubiobio.cl");
        profesor.setRole("Profesor");
        profesor.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(profesor);
        System.out.println("✅ Usuario profesor: profesor@ubiobio.cl / password123");

        // 4. Usuario Estudiante
        User estudiante = userRepository.findByEmail("estudiante@alumnos.ubiobio.cl").orElse(new User());
        estudiante.setFullName("Matías González (Estudiante)");
        estudiante.setEmail("estudiante@alumnos.ubiobio.cl");
        estudiante.setRole("Estudiante");
        estudiante.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(estudiante);
        System.out.println("✅ Usuario estudiante: estudiante@alumnos.ubiobio.cl / password123");
    }
}

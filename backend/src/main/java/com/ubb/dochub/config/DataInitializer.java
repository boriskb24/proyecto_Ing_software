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
        User admin = userRepository.findByEmail("admin@ubiobio.cl").orElse(new User());
        admin.setFullName("Prof. Boris Arenas");
        admin.setEmail("admin@ubiobio.cl");
        admin.setPassword(passwordEncoder.encode("12345678b"));
        userRepository.save(admin);
        System.out.println("✅ Usuario administrador listo: admin@ubiobio.cl / 12345678b");
    }
}

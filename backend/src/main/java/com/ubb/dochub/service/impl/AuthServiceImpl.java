package com.ubb.dochub.service.impl;

import com.ubb.dochub.dto.AuthResponse;
import com.ubb.dochub.dto.LoginRequest;
import com.ubb.dochub.dto.RegisterRequest;
import com.ubb.dochub.dto.UserDto;
import com.ubb.dochub.entity.User;
import com.ubb.dochub.entity.Profesor;
import com.ubb.dochub.entity.Evaluador;
import com.ubb.dochub.entity.Estudiante;
import com.ubb.dochub.repository.UserRepository;
import com.ubb.dochub.service.AuthService;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, EntityManager entityManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.entityManager = entityManager;
    }

    @Override
    public UserDto register(RegisterRequest request) {
        if (request.getPasswordConfirmation() != null &&
                !request.getPassword().equals(request.getPasswordConfirmation())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden");
        }

        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo electrónico ya está registrado");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        return mapToUserDto(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }

        UserDto userDto = mapToUserDto(user);
        String token = UUID.randomUUID().toString();

        return new AuthResponse(token, "Bearer", userDto);
    }

    @Override
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return mapToUserDto(user);
    }

    private UserDto mapToUserDto(User user) {
        String role = determineRoleByEmail(user.getEmail());
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                role,
                user.getInitials(),
                user.getCreatedAt()
        );
    }

    private String determineRoleByEmail(String email) {
        if (email == null) return "Estudiante";
        String normalized = email.toLowerCase().trim();

        if ("admin@ubiobio.cl".equalsIgnoreCase(normalized)) {
            return "Administrador";
        }

        Long profesorCount = entityManager.createQuery(
                "SELECT COUNT(p) FROM Profesor p WHERE LOWER(p.correo) = :email", Long.class)
                .setParameter("email", normalized)
                .getSingleResult();
        if (profesorCount != null && profesorCount > 0) {
            return "Profesor";
        }

        Long evaluadorCount = entityManager.createQuery(
                "SELECT COUNT(e) FROM Evaluador e WHERE LOWER(e.correo) = :email", Long.class)
                .setParameter("email", normalized)
                .getSingleResult();
        if (evaluadorCount != null && evaluadorCount > 0) {
            return "Evaluador";
        }

        Long estudianteCount = entityManager.createQuery(
                "SELECT COUNT(s) FROM Estudiante s WHERE LOWER(s.correo) = :email", Long.class)
                .setParameter("email", normalized)
                .getSingleResult();
        if (estudianteCount != null && estudianteCount > 0) {
            return "Estudiante";
        }

        return "Estudiante";
    }
}

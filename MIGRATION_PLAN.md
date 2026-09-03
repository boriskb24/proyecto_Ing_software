# 🚀 Plan y Guía de Migración de Arquitectura

## Sistema: Centro de Centralización de Documentos (UBB)

### Pila Tecnológica Objetivo:
- **Backend:** Spring Boot (Java 17) - REST API
- **Frontend:** React (Vite SPA) - Componentes independientes
- **Base de Datos:** MySQL + Spring Data JPA (Hibernate)
- **Pruebas de API:** Postman Collection

---

## 1. Configuración Inicial del Backend (Spring Boot)

### Dependencias Maven (`pom.xml`)
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `mysql-connector-j`
- `spring-boot-starter-security`
- `spring-boot-starter-validation`
- `lombok`

### Configuración (`application.properties`)
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/ubb_doc_hub?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=password123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

cors.allowed-origins=http://localhost:5173
```

---

## 2. Modelo de Base de Datos y Entidad JPA

### Entidad `User.java` (`com.ubb.dochub.entity.User`)
```java
package com.ubb.dochub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getRole() {
        return "admin@ubiobio.cl".equalsIgnoreCase(this.email) ? "Administrador" : "Estudiante";
    }
}
```

### Repositorio JPA `UserRepository.java`
```java
package com.ubb.dochub.repository;

import com.ubb.dochub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

---

## 3. Lógica de Negocio y Controladores REST

### Controlador `AuthController.java`
```java
package com.ubb.dochub.controller;

import com.ubb.dochub.dto.*;
import com.ubb.dochub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
}
```

---

## 4. Frontend Standalone (React SPA + Vite)

### Cliente API Axios (`src/services/api.ts`)
```typescript
import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API
```

---

## 5. Verificación de APIs en Postman

- `POST http://localhost:8080/api/auth/register`
- `POST http://localhost:8080/api/auth/login`
- `GET http://localhost:8080/api/auth/me`

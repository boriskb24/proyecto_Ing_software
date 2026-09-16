# 🎓 Centro de Centralización de Documentos (UBB)
Sistema de gestión de syllabus, convenios de prácticas y documentación académica para el Departamento de Matemáticas de la Universidad del Bío-Bío.

**Pila Tecnológica Objetivo (Migración Completada):**
- **Backend:** Java 17 + Spring Boot 3 (REST API, Spring Security, Spring Data JPA, Lombok)
- **Frontend:** React 19 + Vite SPA (Axios, React Router DOM, TypeScript)
- **Base de Datos:** MySQL 8 / H2 Database

---

## 🚀 Estructura del Proyecto Migrado

```
.
├── backend/                  # REST API Spring Boot (Java 17)
│   ├── pom.xml               # Dependencias Maven (Spring Web, Data JPA, Security, MySQL, H2)
│   └── src/main/java/com/ubb/dochub/
│       ├── DochubApplication.java
│       ├── config/SecurityConfig.java
│       ├── controller/AuthController.java
│       ├── dto/ (LoginRequest, RegisterRequest, UserDto, AuthResponse)
│       ├── entity/User.java
│       ├── repository/UserRepository.java
│       └── service/ (AuthService, AuthServiceImpl)
│
├── frontend/                 # Application SPA React (Vite)
│   ├── package.json          # Vite, React 19, React Router, Axios, Lucide
│   ├── vite.config.ts        # Configuración Vite con Proxy al Backend (:8080)
│   └── src/
│       ├── context/AuthContext.tsx
│       ├── services/api.ts
│       ├── pages/ (LoginPage, RegisterPage, HomePage)
│       └── components/ (Navbar, ProtectedRoute)
│
└── MIGRATION_PLAN.md         # Documento guía de arquitectura
```

---

## 🐳 Ejecución con Docker (Recomendado)

El proyecto está completamente contenerizado con soporte para propiedades **ACID** (transacciones `@Transactional` en Spring Boot) y comunicación interna de red Docker (`db:3306`):

```bash
# Levantar todos los servicios (MySQL 8, Spring Boot Backend y React Frontend)
docker compose up --build

# Para detener los contenedores
docker compose down
```

### 🌐 Servicios Disponibles en Docker:
- **Frontend (React + Vite + Nginx):** `http://localhost:80` y `http://localhost:5173`
- **Backend (Spring Boot REST API):** `http://localhost:8080/api`
- **Base de Datos (MySQL 8):** `localhost:3306` (internamente `db:3306` en red `dochub-network`)

---

## 📋 Guía de Inicio Local (Sin Docker)

### 1. Iniciar el Backend (Spring Boot REST API)

```bash
cd backend
mvn spring-boot:run
```
*El backend se ejecutará en **http://localhost:8080**.*

#### 🔑 Endpoints REST API Disponibles:
- `POST http://localhost:8080/api/auth/register`
- `POST http://localhost:8080/api/auth/login`
- `GET http://localhost:8080/api/auth/me?email=admin@ubiobio.cl`
- `POST http://localhost:8080/api/auth/logout`

---

### 2. Iniciar el Frontend (React Vite SPA)

```bash
cd frontend
npm install
npm run dev
```
*La aplicación SPA se abrirá en **http://localhost:5173**.*

---

## 🔑 Credenciales de Prueba

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| **Administrador** | `admin@ubiobio.cl` | `12345678b` |
| **Estudiante** | *Crear desde formulario `/register`* | *Mínimo 8 caracteres* |


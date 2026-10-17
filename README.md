# 🎓 Centro de Centralización de Documentos (UBB)
Sistema de gestión de syllabus, convenios de prácticas y documentación académica para el Departamento de Matemáticas de la Universidad del Bío-Bío.


## Requisitos:

- **Backend:** Java 17
- **Base de Datos:** MySQL 8.4

---

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


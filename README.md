# 🎓 Centro de Centralización de Documentos (UBB)
Sistema de gestión de syllabus, convenios de prácticas y documentación académica para el Departamento de Matemáticas de la Universidad del Bío-Bío.

**Pila Tecnológica:**
- **Backend:** Java 17 + Spring Boot 3.2 (REST API, Spring Security, Spring Data JPA, Lombok, Flyway)
- **Frontend:** React 18 + Vite SPA (Axios, React Router DOM, TypeScript)
- **Base de Datos:** MySQL 8.0 (Docker); H2 en memoria para las pruebas

---

## 📋 Requisitos

- Java 17 o superior (el proyecto fue probado con Java 21)
- Node 22 o superior (se recomienda Node 24, ver `frontend/.nvmrc`)
- Docker Desktop (para MySQL 8.0)
- Git

---

## ⚙️ Configuración (una sola vez)

Desde la raíz del proyecto, en PowerShell:

1. Copiar las variables de entorno del backend y la base de datos:
```
   Copy-Item .env.example .env
```
Abrir `.env` y escribir una contraseña en `DB_PASSWORD` y otra en `DB_ROOT_PASSWORD` (inventarlas; no se suben a Git).

2. Copiar las variables del frontend:
```
   Copy-Item frontend\.env.example frontend\.env
```

3. Levantar la base de datos MySQL:
```
   docker compose up -d db
   docker compose ps
```
Esperar hasta que el estado diga `healthy` (unos 30 segundos). Las tablas se crean solas con Flyway la primera vez que arranca el backend.

---

## ▶️ Ejecutar

**Backend** (Spring Boot, puerto 8080):
```
cd backend
.\mvnw.cmd spring-boot:run
```
En macOS o Linux: `./mvnw spring-boot:run`.

**Frontend** (React + Vite, puerto 5173), en otra terminal:
```
cd frontend
npm ci
npm run dev
```
La aplicación se abre en **http://localhost:5173**.

> Si el puerto 8080 está ocupado por otro programa, el backend no arranca. Cerrar ese programa o ejecutar con otro puerto: `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8082"` (y cambiar `VITE_API_URL` en `frontend\.env`).

---

## 🐳 Alternativa: todo con Docker

Con el `.env` de la sección Configuración ya creado:

```
docker compose up --build
```

Para detener: `docker compose down`.

- **Frontend:** `http://localhost:5173`
- **Backend (REST API):** `http://localhost:8080/api`
- **Base de datos (MySQL 8.0):** `localhost:3306`
- **phpMyAdmin:** `http://localhost:8081`

---

## 🧪 Pruebas

Desde `backend/`:
```
.\mvnw.cmd test
```
Las pruebas usan una base H2 en memoria, no necesitan MySQL.

Para compilar y probar todo: `.\mvnw.cmd verify`.

---

## 🔑 Endpoints REST API principales

- `POST http://localhost:8080/api/auth/register`
- `POST http://localhost:8080/api/auth/login`
- `GET http://localhost:8080/api/auth/me?email=admin@ubiobio.cl`
- `POST http://localhost:8080/api/auth/logout`

---

## 🔑 Credenciales de Prueba

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| **Administrador** | `admin@ubiobio.cl` | `12345678b` |
| **Estudiante** | *Crear desde formulario `/register`* | *Mínimo 8 caracteres* |

---

## 🗂️ Estructura del Proyecto

```
.
├── backend/                  # REST API Spring Boot (Java 17)
│   ├── pom.xml               # Dependencias Maven
│   └── src/main/
│       ├── java/com/ubb/dochub/
│       └── resources/db/migration/   # Scripts Flyway (V1__esquema_inicial.sql)
│
├── frontend/                 # SPA React (Vite)
│   ├── package.json          # Dependencias fijadas con package-lock.json
│   ├── vite.config.ts        # Proxy al backend (URL en VITE_API_URL)
│   └── src/
│
├── docker-compose.yml        # MySQL, backend, frontend y phpMyAdmin
└── .env.example              # Variables de entorno (copiar como .env)
```

---

## 🏷️ Versiones entregadas

Ver la sección **Tags** del repositorio en GitHub.
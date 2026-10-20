# 🎓 Dochub UBB
Sistema institucional para la gestión de planificaciones de clases, convenios de prácticas pedagógicas, evaluación docente y retroalimentación curricular con Inteligencia Artificial socrática (**RetroPlani Mate V3**) para la Universidad del Bío-Bío (UBB).

---

## 🛠️ Pila Tecnológica

| Componente | Tecnologías |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.2.3, Spring Security (Stateless REST), Spring Data JPA, Apache PDFBox 3, Dotenv-Java |
| **Frontend** | React 19, TypeScript, Vite, React Router DOM, Axios, Lucide Icons |
| **Base de Datos** | MySQL 8.4 (Producción / Contenedor) y H2 Database (Memoria / Pruebas) |
| **Módulo IA** | Inferencia desacoplada compatible con protocolo OpenAI (Groq Cloud / Ollama Local) |
| **Contenedores** | Docker / Podman + Docker Compose (Multi-stage builds, phpMyAdmin incluido) |

---

## 📁 Estructura del Repositorio

```text
.
├── backend/                       # API REST Spring Boot (Java 17)
│   ├── pom.xml                    # Dependencias Maven y plugins
│   ├── Dockerfile                 # Contenedor backend optimizado
│   └── src/
│       ├── main/java/com/ubb/dochub/
│       │   ├── ai/                # Núcleo IA: RetroPlani Mate V3 (Orquestador, Rate Limiter, Parser PDF)
│       │   ├── config/            # Seguridad, inicializador de datos y lector de .env
│       │   ├── controller/        # Endpoints REST (Auth, Planificaciones, IA, Prácticas)
│       │   ├── entity/            # Entidades JPA (User, Planificacion, ChatSession, etc.)
│       │   ├── repository/        # Interfaces Spring Data JPA
│       │   └── service/           # Lógica de negocio transaccional (@Transactional)
│       └── test/                  # Suite de pruebas automatizadas (27 tests JUnit 5)
│
├── frontend/                      # Aplicación SPA React 19 (TypeScript + Vite)
│   ├── package.json               # Dependencias del cliente
│   ├── vite.config.ts             # Proxy reverso hacia el backend (:8080)
│   ├── Dockerfile                 # Contenedor frontend con Nginx
│   └── src/
│       ├── components/            # Componentes (RetroPlaniChatDrawer, PlanificacionesView, Navbar)
│       ├── context/               # AuthContext (Sesión y tokens JWT/RBAC)
│       ├── pages/                 # Vistas (LoginPage, RegisterPage, PlanificacionesPage, etc.)
│       └── services/              # Clientes HTTP Axios (api.ts, practicaService.ts)
│
├── docker-compose.yml             # Orquestación de servicios (MySQL, Backend, Frontend, phpMyAdmin)
├── .env.example                   # Plantilla de variables de entorno del equipo
└── README.md                      # Documentación del proyecto
```

---

## ⚙️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu máquina:

- **Git**
- **Docker** y **Docker Compose** (o **Podman** con `podman-compose`)
- *Si vas a desarrollar en modo local sin Docker:*
  - **JDK 17** o superior (`java -version`)
  - **Maven 3.8+** (`mvn -version`)
  - **Node.js 18+** y **npm** (`node -v` y `npm -v`)

---

## 🔐 1. Configuración de Variables de Entorno (`.env`)

El proyecto utiliza un único archivo `.env` en la raíz para centralizar credenciales y configuración:

1. Crea tu archivo `.env` a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
2. Abre `.env` y ajusta las credenciales. Si vas a utilizar el **Chatbot Tutor IA**, agrega tu API Key de Groq:
   ```bash
   # Obtén tu API Key gratuita en https://console.groq.com/keys
   AI_LLM_BASE_URL=https://api.groq.com/openai/v1
   AI_LLM_API_KEY=gsk_tu_clave_aqui
   AI_LLM_MODEL=openai/gpt-oss-20b
   AI_LLM_TIMEOUT_SECONDS=60
   ```
   > 💡 **Nota de Seguridad:** El archivo `.env` está ignorado en `.gitignore`. **Nunca lo subas a ramas públicas.**

---

## 🚀 2. Cómo Levantar el Proyecto con Docker / Podman (Recomendado)

Es la forma más rápida y estándar para todo el equipo, ya que levanta la base de datos MySQL, el backend, el frontend y phpMyAdmin con un solo comando.

### Con Docker Compose:
```bash
# Construir y levantar todos los contenedores en segundo plano
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Detener todos los servicios
docker compose down
```

### Con Podman:
```bash
podman-compose up --build -d
```

### 🌐 Servicios Disponibles:
- **Frontend SPA:** [http://localhost:5173](http://localhost:5173) (o [http://localhost:80](http://localhost:80))
- **Backend API REST:** [http://localhost:8080/api](http://localhost:8080/api)
- **phpMyAdmin (Gestor MySQL):** [http://localhost:8081](http://localhost:8081)
  - Servidor: `db`
  - Usuario: `root`
  - Contraseña: `password123`
- **Base de Datos MySQL:** `localhost:3306` (Base de datos: `ubb_doc_hub`)

---

## 💻 3. Cómo Levantar en Desarrollo Local (Sin Docker)

Si prefieres ejecutar los servicios directamente en tu entorno local para desarrollo rápido y depuración:

### Paso 1: Iniciar el Backend (Spring Boot)
Spring Boot cuenta con `DotenvEnvironmentPostProcessor`, por lo que **cargará automáticamente el archivo `.env` de la raíz**.

```bash
cd backend
mvn spring-boot:run
```
*El servidor backend quedará escuchando en `http://localhost:8080`.*

### Paso 2: Iniciar el Frontend (React + Vite)
En otra terminal:

```bash
cd frontend
npm install
npm run dev
```
*La aplicación cliente se abrirá en `http://localhost:5173`.*

---

## 🤖 4. Módulo de IA: RetroPlani Mate V3 (Flujo Pedagógico)

El sistema incorpora un **filtro socrático pre-entrega** para asegurar la calidad didáctica de las planificaciones matemáticas antes de que lleguen al profesor:

$$\text{[Estudiante]} \xrightarrow{\text{Sube PDF}} \text{[Estado: EN\_REVISION\_IA]} \xrightarrow{\text{Tutor IA Socrático}} \text{[Formalizar Entrega]} \xrightarrow{\text{Estado: PENDIENTE}} \text{[Profesor Evalúa]}$$

1. **Subida del PDF:** El estudiante carga su clase planificada. El documento se registra automáticamente en estado `EN_REVISION_IA`.
2. **Diagnóstico Socrático:** Se abre el cajón del Tutor IA (**RetroPlani Mate V3**), el cual analiza el PDF con Apache PDFBox bajo 4 dimensiones curriculares UBB:
   - 🎯 Coherencia Curricular (OA / Indicadores MINEDUC)
   - ⚙️ Metodología Activa (Resolución de problemas matemáticos)
   - 🤝 DUA (Diseño Universal de Aprendizaje, Decreto 83)
   - 📊 Evaluación Formativa e instrumentos
3. **Formalización:** El estudiante dialoga con el tutor, reflexiona sobre las sugerencias y pulsa **"🚀 Confirmar y Formalizar Entrega al Profesor"**.
4. **Revisión Docente:** La planificación cambia a estado `PENDIENTE` y pasa a ser visible para el docente, quien podrá **Aprobarla** o **Rechazarla** con retroalimentación.

---

## 👥 5. Credenciales de Prueba (Usuarios Semilla)

Al iniciar el backend, la base de datos se inicializa automáticamente con usuarios de prueba para todos los roles:

| Rol | Nombre | Correo Electrónico | Contraseña |
| :--- | :--- | :--- | :--- |
| **Administrador** | Prof. Boris Arenas | `admin@ubiobio.cl` | `12345678b` |
| **Profesor Guía** | Prof. Juan Pérez | `profesor@ubiobio.cl` | `password123` |
| **Evaluador Empresa** | Ing. Carlos Mendoza | `evaluador@empresa.cl` | `password123` |
| **Estudiante** | Matías González Silva | `estudiante@alumnos.ubiobio.cl` | `password123` |

> También puedes registrar nuevas cuentas de estudiantes desde la pantalla `/register`.

---

## 🧪 6. Pruebas Automatizadas y Control de Calidad

Antes de enviar cambios al repositorio, verifica que todas las pruebas pasen exitosamente:

```bash
# 1. Pruebas Backend (JUnit 5 + Spring Boot Test - 27 pruebas)
cd backend
mvn test

# 2. Compilación y Typecheck Frontend (TypeScript + Vite)
cd frontend
npm run build
```

---

## 🤝 7. Convenciones de Trabajo en Equipo

- **Ramas:** Crea ramas descriptivas (`feature/nombre-tarea`, `fix/descripcion-bug`).
- **DTOs Inmutables:** Todo nuevo endpoint debe usar DTOs validados con anotaciones Jakarta (`@NotBlank`, `@NotNull`, `@Size`).
- **Control de Acceso (RBAC):** Las operaciones sensibles en el backend deben validar el rol o la pertenencia del recurso (`userEmail`).
- **Archivos Sensibles:** Mantén siempre el archivo `.env` fuera del control de versiones. Modifica `.env.example` si agregas nuevas variables.

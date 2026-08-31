# 🎓 Centro de Centralización de Documentos (UBB)
Sistema de gestión de syllabus, convenios de prácticas y documentación académica para el Departamento de Matemáticas de la Universidad del Bío-Bío.

**Stack Tecnológico:** AdonisJS 7 + Inertia.js + React 19 + TypeScript + SQLite

---

## 🚀 Guía de Inicio Rápido para Nuevos Integrantes

Cualquier compañero que clone este repositorio puede levantarlo siguiendo estos sencillos pasos:

### 📋 Requisitos Previos
- **Node.js** versión `>= 24.0.0`
- **npm** (incluido con Node.js)
- *(Opcional)* **Docker Desktop** si prefieres correr con contenedores

---

### Opción A: Ejecución Local con Node.js (Recomendada)

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd mi-proyecto
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de ejemplo `.env.example` y crea tu `.env`:
   ```bash
   # En Windows PowerShell:
   Copy-Item .env.example .env

   # En Linux/Mac:
   cp .env.example .env
   ```

4. **Generar la clave de seguridad de la aplicación (`APP_KEY`):**
   ```bash
   node ace generate:key
   ```

5. **Preparar la Base de Datos SQLite y Datos de Prueba:**
   ```bash
   # Ejecutar migraciones
   node ace migration:run

   # Insertar usuario administrador de prueba
   node ace db:seed
   ```

6. **Iniciar el Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```

7. **Abrir en el navegador:**
   👉 **http://localhost:3000** o **http://127.0.0.1:3000**

---

### Opción B: Ejecución con Docker

Si tu compañero tiene **Docker Desktop**, no necesita instalar Node.js:

```bash
# 1. Iniciar contenedor de desarrollo con hot-reload:
docker compose --profile dev up

# 2. Abrir en el navegador:
http://localhost:3000
```

---

## 🔑 Cuentas de Acceso de Prueba

Al ejecutar `node ace db:seed`, se crea automáticamente una cuenta de administrador:

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| **Administrador** | `admin@ubiobio.cl` | `password123` |
| **Estudiante** | *Cualquier cuenta nueva creada desde `/register`* | *La elegida al registrarse* |

---

## 🛠️ Comandos Útiles

```bash
npm run dev           # Iniciar servidor con HMR (Hot Module Replacement)
npm run build         # Compilar proyecto para producción
npm run typecheck     # Verificar errores de TypeScript
node ace migration:run # Ejecutar migraciones de base de datos
node ace db:seed       # Ejecutar seeders de datos
```

# AGENTS.md

Backend: Spring Boot 3 (Java 17) REST API + Spring Security + Spring Data JPA
Frontend: React 19 SPA + Vite + Axios + React Router DOM + TypeScript
Database: MySQL 8 / H2 Database

## Project Structure

- `backend/`: Spring Boot REST application (`com.ubb.dochub`)
- `frontend/`: React Vite SPA application (`src/`)

## Commands

```bash
# Backend (Spring Boot)
cd backend
mvn clean compile package                            # Compile & Package
mvn spring-boot:run                                  # Start API server on http://localhost:8080
mvn test                                             # Run JUnit 5 unit tests

# Frontend (React SPA)
cd frontend
npm run dev                                          # Start Vite dev server on http://localhost:5173
npm run build                                        # TypeScript typecheck & Vite build
```

## Conventions

- **Backend Package**: `com.ubb.dochub`
- **DTOs**: Immutable payload objects with Jakarta Validation annotations (`@NotBlank`, `@Email`, `@Size`)
- **Entities**: JPA Entities with `@Entity`, `@Table`, `@PrePersist`, `@PreUpdate`
- **Security**: Stateless REST authentication with BCrypt password hashing & CORS configured for `http://localhost:5173`
- **Frontend State**: `AuthContext.tsx` handling token & user payload in `localStorage`

## Reglas Obligatorias del Proyecto

El agente DEBE respetar y consultar obligatoriamente las reglas y directrices detalladas en `.agents/rules/`:

1. **Guía de Comportamiento** (`.agents/rules/comportamiento_agente.md`):
   - Prohibido modificar entidades JPA en `com.ubb.dochub.entity` (única excepción: `User.java`, requiriendo autorización explícita previa).
   - Cualquier propuesta de modificación de esquema de base de datos (normalización, nuevas entidades, relaciones) debe justificarse técnicamente y ser aprobada por el usuario.
   - Prohibido modificar contenedores o arquitectura (Docker/Podman) sin consulta y autorización explícita.
   - **Principio de Simplicidad**: Priorizar siempre la solución más simple con los recursos existentes antes de introducir bibliotecas o sobreingeniería.
   - Verificación preventiva antes de realizar `git merge` o `git rebase` para garantizar que no violen reglas de negocio ni comportamiento.

2. **Control de Comandos** (`.agents/rules/comandos.md`):
   - **Permitidos** (dentro del contexto del proyecto): `ls`, `grep`, `find`, `git show`, `git log`, `git status`, `tree`, `cd`.
   - **Requieren autorización explícita previa**: `rm`, `rmdir`, `mkdir`, `touch`, `git reset`, `git add`, `git commit`, `git merge`, `git rebase`, `podman`, `docker`. Si el usuario no autoriza, pausar y solicitar ejecución manual.
   - **Lista negra tajantemente prohibida**: `git push`, `curl`, `wget`, `ssh`, `scp`, `sftp`, `sshfs`, `mysql`, `mariadb`, `which`, `systemctl`, `sudo`.

3. **Flujo de Trabajo** (`.agents/rules/flujo_trabajo.md`):
   - Validación preventiva de estados ($S_0 \to S_f$): verificar que ninguna transición viole reglas antes de aplicar cambios en disco.

4. **Reglas de Negocio** (`.agents/rules/negocio.md`):
   - Cumplir y verificar estrictamente las reglas RN-01 a RN-12 (control de acceso de profesores, alumnos y evaluadores, unicidad de informes, validación horaria de clases, etc.) mediante lógica de servicio, consultas de repositorio y tests.


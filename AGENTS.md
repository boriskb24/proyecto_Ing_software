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

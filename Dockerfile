# ============================================================
# Stage 1: Base image
# ============================================================
FROM node:24-alpine AS base

# Instalar herramientas requeridas para compilar better-sqlite3 (addon nativo)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# ============================================================
# Stage 2: Instalar todas las dependencias
# ============================================================
FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# Stage 3: Compilar la aplicación (TypeScript + Vite)
# ============================================================
FROM dependencies AS build

# Copiar el código fuente completo
COPY . .

# Compilar proyecto AdonisJS
RUN node ace build

# ============================================================
# Stage 4: Imagen final de producción
# ============================================================
FROM node:24-alpine AS production

# Herramientas para dependencias nativas
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Crear usuario seguro no-root
RUN addgroup -S adonis && adduser -S adonis -G adonis

# Copiar el build compilado
COPY --from=build /app/build ./

# Instalar únicamente dependencias de producción
RUN npm ci --omit=dev

# Crear directorio de datos SQLite y ajustar permisos
RUN mkdir -p tmp && chown -R adonis:adonis /app

# Cambiar al usuario no-root
USER adonis

# Exponer el puerto de la aplicación
EXPOSE 3000

# Monitoreo de salud del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

# Ejecutar migraciones automáticas, seeders iniciales y arrancar el servidor
CMD ["sh", "-c", "node ace migration:run --force && node ace db:seed && node bin/server.js"]

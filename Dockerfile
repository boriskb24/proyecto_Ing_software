# ============================================================
# Stage 1: Base image
# ============================================================
FROM node:24-alpine AS base

# Install build tools required by better-sqlite3 (native addon)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# ============================================================
# Stage 2: Install ALL dependencies
# ============================================================
FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# Stage 3: Build the application
# ============================================================
FROM dependencies AS build

# Copy source code
COPY . .

# Build AdonisJS (compiles TS + Vite assets)
RUN node ace build

# ============================================================
# Stage 4: Production image
# ============================================================
FROM node:24-alpine AS production

# Install runtime dependency for better-sqlite3
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Create non-root user for security
RUN addgroup -S adonis && adduser -S adonis -G adonis

# Copy the compiled build output
COPY --from=build /app/build ./

# Install only production dependencies
RUN npm ci --omit=dev

# Create tmp directory for SQLite database and set ownership
RUN mkdir -p tmp && chown -R adonis:adonis /app

# Switch to non-root user
USER adonis

# Expose the application port
EXPOSE 3333

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3333/ || exit 1

# Start the server
CMD ["node", "bin/server.js"]

#!/bin/sh
set -e

# Ensure uploads directory exists and is writable by the 'spring' user
UPLOADS_DIR=/app/uploads
INFORMES_DIR="$UPLOADS_DIR/informes"
PLANIF_DIR="$UPLOADS_DIR/planificaciones"
EVAL_DIR="$UPLOADS_DIR/evaluaciones"

mkdir -p "$INFORMES_DIR"
mkdir -p "$PLANIF_DIR"
mkdir -p "$EVAL_DIR"

# Attempt to chown; if not permitted, continue and hope permissions allow write
chown -R spring:spring "$UPLOADS_DIR" || true

# Execute the application as the 'spring' user
exec su-exec spring:spring java -jar /app/app.jar

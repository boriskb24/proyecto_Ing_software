# ============================================================
# Multi-stage Dockerfile for Spring Boot 3 (Java 17)
# ============================================================

# Stage 1: Build JAR with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Copy Maven descriptor and download dependencies (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Runtime JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

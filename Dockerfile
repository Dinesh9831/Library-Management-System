# --- Stage 1: Build Environment ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

# Set build directory
WORKDIR /build

# Copy Maven Project Object Model (POM)
COPY pom.xml .

# Download dependencies offline to optimize caching
RUN mvn dependency:go-offline -B

# Copy project source code
COPY src ./src

# Build production executable JAR (skipping tests here, we run tests separately)
RUN mvn clean package -DskipTests -B

# --- Stage 2: Runtime Environment ---
FROM eclipse-temurin:17-jre-alpine

# Set container metadata
LABEL maintainer="library-system" \
      version="1.0.0" \
      description="Production JRE runtime container for Library Management System Website"

# Expose internal spring boot port
EXPOSE 8080

# Create application directory
WORKDIR /app

# Create a system group and non-root user for security compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled executable fat JAR from builder stage
COPY --from=builder /build/target/library-management-system-1.0.0.jar /app/app.jar

# Update file permissions
RUN chown -R appuser:appgroup /app

# Switch executing context to secure non-root user
USER appuser

# Configure entry point for execution
ENTRYPOINT ["java", "-jar", "app.jar"]

# syntax=docker/dockerfile:1

# --- Build stage: compile and package with Maven (Java 25) ---
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /workspace

# Resolve dependencies first to leverage Docker layer caching
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline

# Build the application. Tests are not compiled or run in the image build
# (run them locally / in CI with `mvn test`); -Dmaven.test.skip skips both.
COPY src ./src
RUN mvn -B -ntp clean package -Dmaven.test.skip=true

# --- Runtime stage: slim JRE ---
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

# Run as a non-root user
RUN groupadd --system spring && useradd --system --gid spring spring
USER spring:spring

COPY --from=build /workspace/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

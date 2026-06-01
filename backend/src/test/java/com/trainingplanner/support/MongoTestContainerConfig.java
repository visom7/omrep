package com.trainingplanner.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Shared MongoDB Testcontainer for integration tests.
 *
 * <p>Spring Boot starts/stops the container with the application context and wires
 * {@code spring.data.mongodb.uri} automatically via {@link ServiceConnection}. Import it
 * into a {@code @SpringBootTest} with {@code @Import(MongoTestContainerConfig.class)}.
 * Requires a reachable Docker daemon when running {@code mvn test}.
 */
@TestConfiguration(proxyBeanMethods = false)
public class MongoTestContainerConfig {

    @Bean
    @ServiceConnection
    MongoDBContainer mongoDbContainer() {
        return new MongoDBContainer(DockerImageName.parse("mongo:7"));
    }
}

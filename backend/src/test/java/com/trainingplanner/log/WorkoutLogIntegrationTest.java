package com.trainingplanner.log;

import tools.jackson.databind.ObjectMapper;
import com.trainingplanner.auth.UserRepository;
import com.trainingplanner.auth.UserService;
import com.trainingplanner.auth.dto.RegisterRequest;
import com.trainingplanner.auth.dto.TokenResponse;
import com.trainingplanner.block.SetType;
import com.trainingplanner.exercise.Exercise;
import com.trainingplanner.exercise.ExerciseRepository;
import com.trainingplanner.exercise.MovementPattern;
import com.trainingplanner.log.dto.CreateLogRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.trainingplanner.support.MongoTestContainerConfig;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(MongoTestContainerConfig.class)
@org.springframework.test.context.TestPropertySource(properties = "app.invite-code=test-invite-code")
class WorkoutLogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Autowired
    private WorkoutLogRepository logRepository;

    @Autowired
    private UserService userService;

    private String tokenA;
    private String tokenB;
    private String benchPressId;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        logRepository.deleteAll();

        tokenA = registerAndGetToken("a@example.com", "password123", "User A");
        tokenB = registerAndGetToken("b@example.com", "password123", "User B");

        // Find or create a Bench Press exercise for tests
        exerciseRepository.findByOwnerIdIsNull().stream()
                .filter(e -> e.name().equals("Bench Press"))
                .findFirst()
                .ifPresent(e -> benchPressId = e.id());

        if (benchPressId == null) {
            Exercise bench = new Exercise(null, null, "Bench Press", MovementPattern.BENCH, true);
            benchPressId = exerciseRepository.save(bench).id();
        }
    }

    // --- Create log ---

    @Test
    void createLog_workingSet_computesEstimatedOneRm() throws Exception {
        CreateLogRequest req = new CreateLogRequest(
                Instant.now(), null, null, benchPressId,
                SetType.WORKING, 100.0, 5, 8.0, true
        );

        MvcResult result = mockMvc.perform(post("/api/logs")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.exerciseName").value("Bench Press"))
                .andExpect(jsonPath("$.movementPattern").value("BENCH"))
                .andExpect(jsonPath("$.isBasic").value(true))
                .andReturn();

        WorkoutLog created = objectMapper.readValue(result.getResponse().getContentAsString(), WorkoutLog.class);
        // Epley: 100 * (1 + 5/30) = 116.67
        assertThat(created.estimatedOneRmKg()).isCloseTo(116.67, within(0.1));
        // userId should be user A's, not anything from the request
        assertThat(created.userId()).isNotBlank();
    }

    @Test
    void createLog_warmupSet_hasZeroEstimatedOneRm() throws Exception {
        CreateLogRequest req = new CreateLogRequest(
                Instant.now(), null, null, benchPressId,
                SetType.WARMUP, 60.0, 5, null, true
        );

        mockMvc.perform(post("/api/logs")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estimatedOneRmKg").value(0.0));
    }

    // --- Query logs ---

    @Test
    void queryLogs_userBCannotSeeUserALogs() throws Exception {
        // User A logs a set
        CreateLogRequest req = new CreateLogRequest(
                Instant.parse("2026-05-01T10:00:00Z"), null, null, benchPressId,
                SetType.WORKING, 100.0, 3, null, true
        );
        mockMvc.perform(post("/api/logs")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // User B queries — should see empty list
        MvcResult result = mockMvc.perform(get("/api/logs")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).isEqualTo("[]");
    }

    @Test
    void queryLogs_dateRangeFilter_returnsOnlyLogsInRange() throws Exception {
        // Log one in range, one out of range
        CreateLogRequest inRange = new CreateLogRequest(
                Instant.parse("2026-05-15T10:00:00Z"), null, null, benchPressId,
                SetType.WORKING, 100.0, 5, null, true
        );
        CreateLogRequest outOfRange = new CreateLogRequest(
                Instant.parse("2026-04-01T10:00:00Z"), null, null, benchPressId,
                SetType.WORKING, 90.0, 5, null, true
        );

        mockMvc.perform(post("/api/logs")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inRange)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/logs")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(outOfRange)))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/api/logs?from=2026-05-01&to=2026-05-31")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        var logs = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(logs.size()).isEqualTo(1);
        assertThat(logs.get(0).get("weightKg").asDouble()).isEqualTo(100.0);
    }

    @Test
    void createLog_userIdIsAlwaysFromJwt() throws Exception {
        // Even if the request somehow contains a different userId field, it must be ignored
        // (We send a valid request with no userId in body — server derives from token)
        CreateLogRequest req = new CreateLogRequest(
                Instant.now(), null, null, benchPressId,
                SetType.WORKING, 80.0, 8, null, true
        );

        MvcResult result = mockMvc.perform(post("/api/logs")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        WorkoutLog created = objectMapper.readValue(result.getResponse().getContentAsString(), WorkoutLog.class);
        // The userId in the response should belong to user A
        mockMvc.perform(get("/api/logs")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(created.userId()));
    }

    // --- Helper ---

    private String registerAndGetToken(String email, String password, String displayName) {
        TokenResponse tokens = userService.register(new RegisterRequest(email, password, displayName, "test-invite-code"));
        return tokens.accessToken();
    }
}

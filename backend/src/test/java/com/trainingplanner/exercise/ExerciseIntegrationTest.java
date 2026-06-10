package com.trainingplanner.exercise;

import tools.jackson.databind.ObjectMapper;
import com.trainingplanner.auth.UserRepository;
import com.trainingplanner.auth.UserService;
import com.trainingplanner.auth.dto.RegisterRequest;
import com.trainingplanner.auth.dto.TokenResponse;
import com.trainingplanner.exercise.dto.CreateExerciseRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(MongoTestContainerConfig.class)
@org.springframework.test.context.TestPropertySource(properties = "app.invite-code=test-invite-code")
class ExerciseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Autowired
    private UserService userService;

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        // Keep global seeds — only delete custom exercises
        exerciseRepository.deleteAll(
                exerciseRepository.findAll().stream()
                        .filter(e -> e.ownerId() != null)
                        .toList()
        );

        tokenA = registerAndGetToken("a@example.com", "password123", "User A");
        tokenB = registerAndGetToken("b@example.com", "password123", "User B");
    }

    // --- List exercises ---

    @Test
    void listExercises_returnsGlobalSeedsForAnyUser() throws Exception {
        mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(5))))
                .andExpect(jsonPath("$[*].name", hasItem("Bench Press")))
                .andExpect(jsonPath("$[*].name", hasItem("Conventional Deadlift")));
    }

    @Test
    void listExercises_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/exercises"))
                .andExpect(status().isUnauthorized());
    }

    // --- Create custom exercise ---

    @Test
    void createExercise_validRequest_returns201() throws Exception {
        CreateExerciseRequest req = new CreateExerciseRequest("Romanian Deadlift", MovementPattern.DEADLIFT, false);

        mockMvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Romanian Deadlift"))
                .andExpect(jsonPath("$.isCustom").value(true));
    }

    // --- User isolation ---

    @Test
    void userACustomExercise_isNotVisibleToUserB() throws Exception {
        // User A creates a custom exercise
        CreateExerciseRequest req = new CreateExerciseRequest("A's Secret Exercise", MovementPattern.ACCESSORY, false);
        mockMvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // User B's list should NOT include it
        MvcResult result = mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("A's Secret Exercise");
    }

    @Test
    void userACustomExercise_isVisibleToUserA() throws Exception {
        CreateExerciseRequest req = new CreateExerciseRequest("A's Own Exercise", MovementPattern.ROW, false);
        mockMvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("A's Own Exercise")));
    }

    // --- Delete custom exercise ---

    @Test
    void deleteCustomExercise_ownedByUser_returns204() throws Exception {
        CreateExerciseRequest req = new CreateExerciseRequest("To Delete", MovementPattern.OTHER, false);
        MvcResult createResult = mockMvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/exercises/" + id)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCustomExercise_ownedByOtherUser_returns403() throws Exception {
        CreateExerciseRequest req = new CreateExerciseRequest("B's Exercise", MovementPattern.PRESS, false);
        MvcResult createResult = mockMvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        // User A tries to delete User B's exercise
        mockMvc.perform(delete("/api/exercises/" + id)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteGlobalSeed_returns403() throws Exception {
        // Find a global seed id
        MvcResult result = mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        // Find first non-custom exercise
        var exercises = objectMapper.readTree(result.getResponse().getContentAsString());
        String globalId = null;
        for (var ex : exercises) {
            if (!ex.get("isCustom").asBoolean()) {
                globalId = ex.get("id").asText();
                break;
            }
        }
        assertThat(globalId).isNotNull();

        mockMvc.perform(delete("/api/exercises/" + globalId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    // --- Update custom exercise ---

    @Test
    void updateExercise_ownCustom_returns200() throws Exception {
        CreateExerciseRequest req = new CreateExerciseRequest("Old Name", MovementPattern.SQUAT, false);
        MvcResult createResult = mockMvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        CreateExerciseRequest updateReq = new CreateExerciseRequest("New Name", MovementPattern.DEADLIFT, true);
        mockMvc.perform(put("/api/exercises/" + id)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"))
                .andExpect(jsonPath("$.movementPattern").value("DEADLIFT"))
                .andExpect(jsonPath("$.isBasic").value(true))
                .andExpect(jsonPath("$.isCustom").value(true));
    }

    @Test
    void updateExercise_globalSeed_returns403() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        var exercises = objectMapper.readTree(result.getResponse().getContentAsString());
        String globalId = null;
        for (var ex : exercises) {
            if (!ex.get("isCustom").asBoolean()) {
                globalId = ex.get("id").asText();
                break;
            }
        }
        assertThat(globalId).isNotNull();

        CreateExerciseRequest updateReq = new CreateExerciseRequest("Hacked Name", MovementPattern.SQUAT, false);
        mockMvc.perform(put("/api/exercises/" + globalId)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateExercise_otherUserExercise_returns403() throws Exception {
        CreateExerciseRequest req = new CreateExerciseRequest("B's Exercise to Update", MovementPattern.PRESS, false);
        MvcResult createResult = mockMvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        CreateExerciseRequest updateReq = new CreateExerciseRequest("A Hacking B", MovementPattern.SQUAT, false);
        mockMvc.perform(put("/api/exercises/" + id)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateExercise_notFound_returns404() throws Exception {
        CreateExerciseRequest updateReq = new CreateExerciseRequest("Does Not Matter", MovementPattern.SQUAT, false);
        mockMvc.perform(put("/api/exercises/nonexistent-id-12345")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());
    }

    // --- Seed idempotency ---

    @Test
    void seedIdempotency_runningSeedTwiceDoesNotDuplicateSeeds() throws Exception {
        // Get initial count of global seeds
        MvcResult before = mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();
        var beforeList = objectMapper.readTree(before.getResponse().getContentAsString());
        long seedCountBefore = 0;
        for (var ex : beforeList) {
            if (!ex.get("isCustom").asBoolean()) seedCountBefore++;
        }

        // Run seed runner again
        ExerciseSeedRunner runner = new ExerciseSeedRunner(exerciseRepository);
        runner.run(null);

        // Count should be unchanged
        MvcResult after = mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();
        var afterList = objectMapper.readTree(after.getResponse().getContentAsString());
        long seedCountAfter = 0;
        for (var ex : afterList) {
            if (!ex.get("isCustom").asBoolean()) seedCountAfter++;
        }

        assertThat(seedCountAfter).isEqualTo(seedCountBefore);
    }

    // --- Helper ---

    private String registerAndGetToken(String email, String password, String displayName) {
        TokenResponse tokens = userService.register(new RegisterRequest(email, password, displayName, "test-invite-code"));
        return tokens.accessToken();
    }
}

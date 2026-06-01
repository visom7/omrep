package com.trainingplanner.block;

import tools.jackson.databind.ObjectMapper;
import com.trainingplanner.auth.UserRepository;
import com.trainingplanner.auth.UserService;
import com.trainingplanner.auth.dto.RegisterRequest;
import com.trainingplanner.auth.dto.TokenResponse;
import com.trainingplanner.block.dto.CreateBlockRequest;
import com.trainingplanner.block.dto.DuplicateBlockRequest;
import com.trainingplanner.exercise.MovementPattern;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(MongoTestContainerConfig.class)
class BlockIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BlockRepository blockRepository;

    @Autowired
    private UserService userService;

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        blockRepository.deleteAll();
        tokenA = registerAndGetToken("a@example.com", "password123", "User A");
        tokenB = registerAndGetToken("b@example.com", "password123", "User B");
    }

    // --- Round trip ---

    @Test
    void createAndGetBlock_fullNested_roundTripsSuccessfully() throws Exception {
        Block.SetGroup sg1 = new Block.SetGroup("sg-001", SetType.WARMUP, 60.0, 5, 3, null);
        Block.SetGroup sg2 = new Block.SetGroup("sg-002", SetType.WORKING, 100.0, 5, 5, 8.0);
        Block.ExerciseEntry entry = new Block.ExerciseEntry(
                "exercise-id-1", "Bench Press", MovementPattern.BENCH, 1, List.of(sg1, sg2));
        Block.Day day = new Block.Day(1, "Día 1 — Fuerza", List.of(entry));
        Block.Week week1 = new Block.Week(1, List.of(day));
        Block.Week week2 = new Block.Week(2, List.of(day));
        Block.Week week3 = new Block.Week(3, List.of(day));

        CreateBlockRequest req = new CreateBlockRequest("Test Block", List.of(week1, week2, week3));

        // Create
        MvcResult createResult = mockMvc.perform(post("/api/blocks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Block created = objectMapper.readValue(createResult.getResponse().getContentAsString(), Block.class);
        String blockId = created.id();

        // Get
        MvcResult getResult = mockMvc.perform(get("/api/blocks/" + blockId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        Block retrieved = objectMapper.readValue(getResult.getResponse().getContentAsString(), Block.class);
        assertThat(retrieved.name()).isEqualTo("Test Block");
        assertThat(retrieved.weeks()).hasSize(3);
        assertThat(retrieved.weeks().get(0).days().get(0).entries().get(0).setGroups()).hasSize(2);
        assertThat(retrieved.weeks().get(0).days().get(0).entries().get(0).exerciseName()).isEqualTo("Bench Press");
    }

    // --- Ownership ---

    @Test
    void getBlock_wrongOwner_returns404() throws Exception {
        // User A creates block
        CreateBlockRequest req = new CreateBlockRequest("A's Block", List.of());
        MvcResult result = mockMvc.perform(post("/api/blocks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String blockId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // User B tries to access it
        mockMvc.perform(get("/api/blocks/" + blockId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteBlock_wrongOwner_returns404() throws Exception {
        CreateBlockRequest req = new CreateBlockRequest("A's Block", List.of());
        MvcResult result = mockMvc.perform(post("/api/blocks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String blockId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/blocks/" + blockId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    // --- Duplicate with progression ---

    @Test
    void duplicate_withWeightProgression_increasesOnlyWorkingSetWeights() throws Exception {
        Block.SetGroup warmup  = new Block.SetGroup("w1", SetType.WARMUP,  60.0, 5, 3, null);
        Block.SetGroup working = new Block.SetGroup("s1", SetType.WORKING, 100.0, 5, 5, null);
        Block.ExerciseEntry entry = new Block.ExerciseEntry(
                "ex-1", "Squat", MovementPattern.SQUAT, 1, List.of(warmup, working));
        Block.Week week = new Block.Week(1, List.of(new Block.Day(1, "Day 1", List.of(entry))));
        CreateBlockRequest req = new CreateBlockRequest("Original", List.of(week));

        MvcResult createResult = mockMvc.perform(post("/api/blocks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        String blockId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        DuplicateBlockRequest dupReq = new DuplicateBlockRequest(DuplicateBlockRequest.ProgressionType.WEIGHT, 2.5);
        MvcResult dupResult = mockMvc.perform(post("/api/blocks/" + blockId + "/duplicate")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Block copy = objectMapper.readValue(dupResult.getResponse().getContentAsString(), Block.class);
        List<Block.SetGroup> copiedSgs = copy.weeks().get(0).days().get(0).entries().get(0).setGroups();

        Block.SetGroup copiedWarmup  = copiedSgs.get(0);
        Block.SetGroup copiedWorking = copiedSgs.get(1);

        // Warmup weight unchanged
        assertThat(copiedWarmup.weightKg()).isEqualTo(60.0);
        // Working weight increased by 2.5
        assertThat(copiedWorking.weightKg()).isEqualTo(102.5);
        // Name appended with (copy)
        assertThat(copy.name()).isEqualTo("Original (copy)");
    }

    @Test
    void duplicate_noProgression_producesIdenticalContentWithNewIds() throws Exception {
        Block.SetGroup sg = new Block.SetGroup("orig-sg-1", SetType.WORKING, 80.0, 8, 4, null);
        Block.ExerciseEntry entry = new Block.ExerciseEntry("ex-1", "Row", MovementPattern.ROW, 1, List.of(sg));
        Block.Week week = new Block.Week(1, List.of(new Block.Day(1, "Day", List.of(entry))));
        CreateBlockRequest req = new CreateBlockRequest("Original", List.of(week));

        MvcResult createResult = mockMvc.perform(post("/api/blocks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        String blockId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult dupResult = mockMvc.perform(post("/api/blocks/" + blockId + "/duplicate")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        Block copy = objectMapper.readValue(dupResult.getResponse().getContentAsString(), Block.class);
        Block.SetGroup copiedSg = copy.weeks().get(0).days().get(0).entries().get(0).setGroups().get(0);

        assertThat(copiedSg.weightKg()).isEqualTo(80.0);
        assertThat(copiedSg.reps()).isEqualTo(8);
        // SetGroup id should be new (not "orig-sg-1")
        assertThat(copiedSg.id()).isNotEqualTo("orig-sg-1");
    }

    // --- Helper ---

    private String registerAndGetToken(String email, String password, String displayName) {
        TokenResponse tokens = userService.register(new RegisterRequest(email, password, displayName));
        return tokens.accessToken();
    }
}

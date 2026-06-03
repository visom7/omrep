package com.trainingplanner.export;

import com.trainingplanner.auth.UserRepository;
import com.trainingplanner.auth.UserService;
import com.trainingplanner.auth.dto.RegisterRequest;
import com.trainingplanner.auth.dto.TokenResponse;
import com.trainingplanner.block.SetType;
import com.trainingplanner.exercise.Exercise;
import com.trainingplanner.exercise.ExerciseRepository;
import com.trainingplanner.exercise.MovementPattern;
import com.trainingplanner.log.WorkoutLog;
import com.trainingplanner.log.WorkoutLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.trainingplanner.support.MongoTestContainerConfig;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(MongoTestContainerConfig.class)
@org.springframework.test.context.TestPropertySource(properties = "app.invite-code=test-invite-code")
class CsvExportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkoutLogRepository logRepository;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Autowired
    private UserService userService;

    private String tokenA;
    private String tokenB;
    private String userId;
    private String exerciseId;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        logRepository.deleteAll();

        TokenResponse tokens = userService.register(new RegisterRequest("csv@example.com", "password123", "CSV User", "test-invite-code"));
        tokenA = tokens.accessToken();

        // Get user id from token (JWT sub)
        String[] parts = tokenA.split("\\.");
        String payload = new String(java.util.Base64.getDecoder().decode(parts[1]));
        userId = payload.replaceAll(".*\"sub\":\"([^\"]+)\".*", "$1");

        TokenResponse tokensB = userService.register(new RegisterRequest("other@example.com", "password123", "Other User", "test-invite-code"));
        tokenB = tokensB.accessToken();

        // Ensure Bench Press seed exists
        exerciseId = exerciseRepository.findByOwnerIdIsNull().stream()
                .filter(e -> e.name().equals("Bench Press"))
                .map(Exercise::id)
                .findFirst()
                .orElseGet(() -> exerciseRepository.save(
                        new Exercise(null, null, "Bench Press", MovementPattern.BENCH, true)).id());

        // Seed 3 logs for user A
        saveLog(userId, "Bench Press", MovementPattern.BENCH, SetType.WORKING, 100.0, 5, 8.0, 116.67);
        saveLog(userId, "Squat",       MovementPattern.SQUAT, SetType.WORKING, 140.0, 3, null, 154.0);
        saveLog(userId, "Calentamiento;especial", MovementPattern.BENCH, SetType.WARMUP, 60.0, 10, null, 0.0);
    }

    @Test
    void export_responseHasCorrectContentType() throws Exception {
        mockMvc.perform(get("/api/export/logs.csv")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment")));
    }

    @Test
    void export_responseStartsWithUtf8Bom() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/export/logs.csv")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        // BOM: EF BB BF
        assertThat(body[0]).isEqualTo((byte) 0xEF);
        assertThat(body[1]).isEqualTo((byte) 0xBB);
        assertThat(body[2]).isEqualTo((byte) 0xBF);
    }

    @Test
    void export_headerRowPresentAfterBom() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/export/logs.csv")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString();
        String[] lines = csv.split("\n");
        // First line (after BOM, which is stripped by getContentAsString in some cases)
        String header = lines[0].stripLeading().replace("﻿", "").trim();
        assertThat(header).contains("date").contains("exerciseName").contains("weightKg");
    }

    @Test
    void export_threeLogsProduceFourLines() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/export/logs.csv")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString().replace("﻿", "");
        long dataLines = java.util.Arrays.stream(csv.split("\n"))
                .filter(line -> !line.isBlank())
                .count();
        // 1 header + 3 data rows = 4
        assertThat(dataLines).isEqualTo(4);
    }

    @Test
    void export_semicolonDelimiterUsed() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/export/logs.csv")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString();
        String[] lines = csv.split("\n");
        // Header should have 10 semicolons (11 columns)
        String header = lines[0].replace("﻿", "").trim();
        assertThat(header.chars().filter(c -> c == ';').count()).isEqualTo(10);
    }

    @Test
    void export_exerciseNameWithSemicolon_isEscaped() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/export/logs.csv")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString();
        // The exercise with semicolon in name should be quoted
        assertThat(csv).contains("\"Calentamiento;especial\"");
    }

    @Test
    void export_onlyExportsOwnLogs() throws Exception {
        // User B's export should be empty (only header)
        MvcResult result = mockMvc.perform(get("/api/export/logs.csv")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString().replace("﻿", "");
        long dataLines = java.util.Arrays.stream(csv.split("\n"))
                .filter(line -> !line.isBlank())
                .count();
        // Only header row
        assertThat(dataLines).isEqualTo(1);
    }

    @Test
    void export_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/export/logs.csv"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Helper ----------

    private void saveLog(String uid, String name, MovementPattern pattern, SetType type,
                         double weight, int reps, Double rpe, double oneRm) {
        WorkoutLog log = new WorkoutLog(
                null, uid, Instant.now(), null, null, exerciseId, name,
                pattern, true, type, weight, reps, rpe, true, oneRm
        );
        logRepository.save(log);
    }
}

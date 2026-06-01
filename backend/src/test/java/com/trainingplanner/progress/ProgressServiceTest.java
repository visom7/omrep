package com.trainingplanner.progress;

import com.trainingplanner.block.SetType;
import com.trainingplanner.exercise.MovementPattern;
import com.trainingplanner.log.WorkoutLog;
import com.trainingplanner.log.WorkoutLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.trainingplanner.support.MongoTestContainerConfig;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

@SpringBootTest
@Import(MongoTestContainerConfig.class)
class ProgressServiceTest {

    @Autowired
    private ProgressService progressService;

    @Autowired
    private WorkoutLogRepository logRepository;

    private static final String USER_ID = "test-user-progress";
    private static final String FROM = "2026-01-01";
    private static final String TO   = "2026-12-31";

    @BeforeEach
    void setUp() {
        // Remove only this test user's logs
        logRepository.findByUserId(USER_ID).forEach(l -> logRepository.delete(l));
    }

    // ---------- one-rm-total ----------

    @Test
    void oneRmTotal_basicSetsInOneWeek_sumsMaxPerPattern() {
        // Week 2026-W10 (Mon 2026-03-02)
        Instant week10 = Instant.parse("2026-03-02T10:00:00Z");

        // SQUAT: max 200 (High-Bar 180 vs Low-Bar 200 → only 200 counted)
        saveLog(USER_ID, week10, MovementPattern.SQUAT, SetType.WORKING, true, 180.0);
        saveLog(USER_ID, week10, MovementPattern.SQUAT, SetType.WORKING, true, 200.0);
        // DEADLIFT: max 220
        saveLog(USER_ID, week10, MovementPattern.DEADLIFT, SetType.WORKING, true, 220.0);
        // BENCH: 130
        saveLog(USER_ID, week10, MovementPattern.BENCH, SetType.WORKING, true, 130.0);

        List<WeeklyOneRmTotal> result = progressService.getWeeklyOneRmTotal(USER_ID, FROM, TO);

        assertThat(result).hasSize(1);
        // Total = 200 + 220 + 130 = 550
        assertThat(result.get(0).totalOneRm()).isCloseTo(550.0, within(0.1));
        assertThat(result.get(0).week()).isEqualTo("2026-W10");
    }

    @Test
    void oneRmTotal_twoSquatVariants_neverDoubleCountsPattern() {
        Instant week10 = Instant.parse("2026-03-02T10:00:00Z");

        // Two SQUAT variants — only the max (250) should count, not both
        saveLog(USER_ID, week10, MovementPattern.SQUAT, SetType.WORKING, true, 200.0);
        saveLog(USER_ID, week10, MovementPattern.SQUAT, SetType.WORKING, true, 250.0);
        saveLog(USER_ID, week10, MovementPattern.DEADLIFT, SetType.WORKING, true, 220.0);
        saveLog(USER_ID, week10, MovementPattern.BENCH, SetType.WORKING, true, 130.0);

        List<WeeklyOneRmTotal> result = progressService.getWeeklyOneRmTotal(USER_ID, FROM, TO);

        // 250 + 220 + 130 = 600, not 450 + 220 + 130 = 800 (no double-counting)
        assertThat(result.get(0).totalOneRm()).isCloseTo(600.0, within(0.1));
    }

    @Test
    void oneRmTotal_warmupSetsNotCounted() {
        Instant week10 = Instant.parse("2026-03-02T10:00:00Z");

        // Only warmup sets — should contribute nothing
        saveLog(USER_ID, week10, MovementPattern.SQUAT, SetType.WARMUP, true, 300.0);
        saveLog(USER_ID, week10, MovementPattern.DEADLIFT, SetType.WORKING, true, 220.0);

        List<WeeklyOneRmTotal> result = progressService.getWeeklyOneRmTotal(USER_ID, FROM, TO);

        // Only deadlift counts (300kg warmup ignored)
        assertThat(result.get(0).totalOneRm()).isCloseTo(220.0, within(0.1));
    }

    @Test
    void oneRmTotal_onlyOwnUserLogsContribute() {
        Instant week10 = Instant.parse("2026-03-02T10:00:00Z");

        // Another user's log — should not appear
        saveLog("other-user", week10, MovementPattern.SQUAT, SetType.WORKING, true, 500.0);
        saveLog(USER_ID, week10, MovementPattern.SQUAT, SetType.WORKING, true, 200.0);

        List<WeeklyOneRmTotal> result = progressService.getWeeklyOneRmTotal(USER_ID, FROM, TO);

        assertThat(result.get(0).totalOneRm()).isCloseTo(200.0, within(0.1));
    }

    // ---------- volume ----------

    @Test
    void volume_workingSetsForExercise_sumsWeightTimesReps() {
        Instant week10 = Instant.parse("2026-03-02T10:00:00Z");

        // 3 working sets: 100×5 + 100×5 + 100×5 = 1500
        saveVolumeLog(USER_ID, week10, "ex-bench", SetType.WORKING, 100.0, 5);
        saveVolumeLog(USER_ID, week10, "ex-bench", SetType.WORKING, 100.0, 5);
        saveVolumeLog(USER_ID, week10, "ex-bench", SetType.WORKING, 100.0, 5);

        List<WeeklyVolume> result = progressService.getWeeklyVolume(USER_ID, "ex-bench", FROM, TO);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).totalVolume()).isCloseTo(1500.0, within(0.1));
    }

    @Test
    void volume_warmupSetsNotCounted() {
        Instant week10 = Instant.parse("2026-03-02T10:00:00Z");

        saveVolumeLog(USER_ID, week10, "ex-squat", SetType.WARMUP, 60.0, 5);
        saveVolumeLog(USER_ID, week10, "ex-squat", SetType.WORKING, 100.0, 5);

        List<WeeklyVolume> result = progressService.getWeeklyVolume(USER_ID, "ex-squat", FROM, TO);

        // Only 100*5=500 from WORKING set
        assertThat(result.get(0).totalVolume()).isCloseTo(500.0, within(0.1));
    }

    // ---------- Helpers ----------

    private void saveLog(String userId, Instant date, MovementPattern pattern, SetType type, boolean isBasic, double oneRm) {
        WorkoutLog log = new WorkoutLog(
                null, userId, date, null, null, "ex-id", "Exercise Name",
                pattern, isBasic, type, oneRm / 5, 5, null, true, oneRm
        );
        logRepository.save(log);
    }

    private void saveVolumeLog(String userId, Instant date, String exerciseId, SetType type, double weight, int reps) {
        WorkoutLog log = new WorkoutLog(
                null, userId, date, null, null, exerciseId, "Exercise",
                MovementPattern.OTHER, false, type, weight, reps, null, true, 0.0
        );
        logRepository.save(log);
    }
}

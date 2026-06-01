package com.trainingplanner.progress;

import com.trainingplanner.block.SetType;
import com.trainingplanner.exercise.MovementPattern;
import com.trainingplanner.log.WorkoutLog;
import com.trainingplanner.log.WorkoutLogRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.IsoFields;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private final WorkoutLogRepository logRepository;

    public ProgressService(WorkoutLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    /**
     * Total-of-basics 1RM per ISO week.
     *
     * Algorithm:
     *   1. Filter: isBasic=true, setType=WORKING, date in [from, to], userId matches.
     *   2. Group by { isoWeek, movementPattern }.
     *   3. Per group: max(estimatedOneRmKg).
     *   4. Group by isoWeek: sum of those per-pattern maxima.
     *
     * This naturally de-duplicates squat variants (High-Bar vs Low-Bar both map to SQUAT)
     * and deadlift variants (Conventional vs Sumo both map to DEADLIFT).
     */
    public List<WeeklyOneRmTotal> getWeeklyOneRmTotal(String userId, String from, String to) {
        Instant fromInstant = parseDate(from);
        Instant toInstant = parseDate(to, true);

        List<WorkoutLog> logs = logRepository.findByUserIdAndDateBetween(userId, fromInstant, toInstant)
                .stream()
                .filter(l -> l.isBasic() && l.setType() == SetType.WORKING)
                .toList();

        // Group by (week, movementPattern) → max estimatedOneRm
        Map<String, Map<MovementPattern, Double>> weekPatternMax = new LinkedHashMap<>();

        for (WorkoutLog log : logs) {
            String week = toIsoWeek(log.date());
            weekPatternMax.computeIfAbsent(week, k -> new EnumMap<>(MovementPattern.class))
                    .merge(log.movementPattern(), log.estimatedOneRmKg(), Math::max);
        }

        // Sum per-pattern maxima per week
        return weekPatternMax.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    double total = entry.getValue().values().stream().mapToDouble(Double::doubleValue).sum();
                    return new WeeklyOneRmTotal(entry.getKey(), Math.round(total * 100.0) / 100.0);
                })
                .toList();
    }

    /**
     * Volume per week for a given exercise.
     * Volume = sum(weightKg * reps) for WORKING sets.
     */
    public List<WeeklyVolume> getWeeklyVolume(String userId, String exerciseId, String from, String to) {
        Instant fromInstant = parseDate(from);
        Instant toInstant = parseDate(to, true);

        List<WorkoutLog> logs = logRepository.findByUserIdAndDateBetween(userId, fromInstant, toInstant)
                .stream()
                .filter(l -> l.exerciseId().equals(exerciseId) && l.setType() == SetType.WORKING)
                .toList();

        Map<String, Double> weekVolume = new TreeMap<>();
        for (WorkoutLog log : logs) {
            String week = toIsoWeek(log.date());
            weekVolume.merge(week, log.weightKg() * log.reps(), Double::sum);
        }

        return weekVolume.entrySet().stream()
                .map(e -> new WeeklyVolume(e.getKey(), Math.round(e.getValue() * 100.0) / 100.0))
                .toList();
    }

    private String toIsoWeek(Instant instant) {
        LocalDate date = instant.atZone(ZoneOffset.UTC).toLocalDate();
        int year = date.get(IsoFields.WEEK_BASED_YEAR);
        int week = date.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        return String.format("%d-W%02d", year, week);
    }

    private Instant parseDate(String dateStr) {
        return LocalDate.parse(dateStr).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private Instant parseDate(String dateStr, boolean endOfDay) {
        if (!endOfDay) return parseDate(dateStr);
        return LocalDate.parse(dateStr).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}

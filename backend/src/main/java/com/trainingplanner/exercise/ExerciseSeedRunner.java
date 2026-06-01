package com.trainingplanner.exercise;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds global exercises at startup (idempotent — checks before inserting).
 * Seeds the five powerlifting basics from §4.2 of the spec.
 */
@Component
public class ExerciseSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ExerciseSeedRunner.class);

    private static final List<Exercise> SEEDS = List.of(
            new Exercise(null, null, "Conventional Deadlift", MovementPattern.DEADLIFT, true),
            new Exercise(null, null, "Sumo Deadlift",         MovementPattern.DEADLIFT, true),
            new Exercise(null, null, "High-Bar Squat",        MovementPattern.SQUAT,    true),
            new Exercise(null, null, "Low-Bar Squat",         MovementPattern.SQUAT,    true),
            new Exercise(null, null, "Bench Press",           MovementPattern.BENCH,    true)
    );

    private final ExerciseRepository repository;

    public ExerciseSeedRunner(ExerciseRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        int seeded = 0;
        for (Exercise seed : SEEDS) {
            if (!repository.existsByNameAndOwnerIdIsNull(seed.name())) {
                repository.save(seed);
                seeded++;
            }
        }
        if (seeded > 0) {
            log.info("Seeded {} global exercises", seeded);
        }
    }
}

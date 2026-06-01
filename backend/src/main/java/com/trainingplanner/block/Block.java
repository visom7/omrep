package com.trainingplanner.block;

import com.trainingplanner.exercise.MovementPattern;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "blocks")
public record Block(
        @Id String id,
        @Indexed String userId,
        String name,
        int order,
        Instant createdAt,
        List<Week> weeks
) {
    public record Week(
            int number,
            List<Day> days
    ) {}

    public record Day(
            int order,
            String label,
            List<ExerciseEntry> entries
    ) {}

    public record ExerciseEntry(
            String exerciseId,
            String exerciseName,    // denormalized snapshot
            MovementPattern movementPattern,  // denormalized
            int order,
            List<SetGroup> setGroups
    ) {}

    public record SetGroup(
            String id,              // stable UUID within the block
            SetType type,
            double weightKg,
            int reps,
            int sets,
            Double targetRpe        // nullable
    ) {}
}

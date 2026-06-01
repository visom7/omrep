package com.trainingplanner.log;

import com.trainingplanner.block.SetType;
import com.trainingplanner.exercise.MovementPattern;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * One document per performed set. The REALITY, not the plan.
 * Indexes: { userId, exerciseId, date } and { userId, date } for efficient queries.
 */
@Document(collection = "workoutLogs")
@CompoundIndexes({
        @CompoundIndex(name = "user_exercise_date", def = "{'userId': 1, 'exerciseId': 1, 'date': 1}"),
        @CompoundIndex(name = "user_date",          def = "{'userId': 1, 'date': 1}")
})
public record WorkoutLog(
        @Id String id,
        String userId,
        Instant date,
        String blockId,          // nullable — may exist without a block
        String setGroupId,       // nullable — null for extra sets done off-plan
        String exerciseId,
        String exerciseName,     // denormalized snapshot (survives block deletion)
        MovementPattern movementPattern, // denormalized
        boolean isBasic,         // denormalized
        SetType setType,
        double weightKg,
        int reps,
        Double rpe,              // nullable
        boolean completed,
        double estimatedOneRmKg  // computed at write time
) {}

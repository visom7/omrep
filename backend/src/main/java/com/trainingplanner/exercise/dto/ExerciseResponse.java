package com.trainingplanner.exercise.dto;

import com.trainingplanner.exercise.Exercise;
import com.trainingplanner.exercise.MovementPattern;

public record ExerciseResponse(
        String id,
        String name,
        MovementPattern movementPattern,
        boolean isBasic,
        boolean isCustom    // true if ownerId is non-null (user-created)
) {
    public static ExerciseResponse from(Exercise exercise) {
        return new ExerciseResponse(
                exercise.id(),
                exercise.name(),
                exercise.movementPattern(),
                exercise.isBasic(),
                exercise.ownerId() != null
        );
    }
}

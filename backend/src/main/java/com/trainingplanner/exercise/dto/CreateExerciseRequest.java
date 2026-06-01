package com.trainingplanner.exercise.dto;

import com.trainingplanner.exercise.MovementPattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateExerciseRequest(
        @NotBlank String name,
        @NotNull MovementPattern movementPattern,
        boolean isBasic
) {}

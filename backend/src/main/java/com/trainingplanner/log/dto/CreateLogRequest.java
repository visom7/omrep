package com.trainingplanner.log.dto;

import com.trainingplanner.block.SetType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateLogRequest(
        @NotNull Instant date,
        String blockId,          // optional
        String setGroupId,       // optional
        @NotBlank String exerciseId,
        @NotNull SetType setType,
        @Min(0) double weightKg,
        @Min(0) int reps,
        Double rpe,              // optional
        boolean completed
) {}

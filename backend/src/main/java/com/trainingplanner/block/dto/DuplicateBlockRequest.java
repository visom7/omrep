package com.trainingplanner.block.dto;

public record DuplicateBlockRequest(
        ProgressionType progressionType,    // null = no progression
        Double progressionValue             // kg or reps to add
) {
    public enum ProgressionType {
        WEIGHT,
        REPS
    }
}

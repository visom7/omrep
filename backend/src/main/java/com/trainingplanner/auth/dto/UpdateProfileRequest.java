package com.trainingplanner.auth.dto;

import com.trainingplanner.domain.OneRmFormula;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateProfileRequest(
        @NotBlank String displayName,
        @NotNull OneRmFormula preferredOneRmFormula
) {}

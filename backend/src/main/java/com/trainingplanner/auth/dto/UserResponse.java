package com.trainingplanner.auth.dto;

import com.trainingplanner.auth.User;
import com.trainingplanner.domain.OneRmFormula;

public record UserResponse(
        String id,
        String email,
        String displayName,
        OneRmFormula preferredOneRmFormula
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.id(), user.email(), user.displayName(), user.preferredOneRmFormula());
    }
}

package com.trainingplanner.auth.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken
) {}

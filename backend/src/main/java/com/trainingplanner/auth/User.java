package com.trainingplanner.auth;

import com.trainingplanner.domain.OneRmFormula;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "users")
public record User(
        @Id String id,
        @Indexed(unique = true) String email,
        String passwordHash,
        String displayName,
        OneRmFormula preferredOneRmFormula,
        String refreshTokenHash,
        Instant createdAt
) {
    public User withRefreshTokenHash(String hash) {
        return new User(id, email, passwordHash, displayName, preferredOneRmFormula, hash, createdAt);
    }

    public User withProfile(String newDisplayName, OneRmFormula newFormula) {
        return new User(id, email, passwordHash, newDisplayName, newFormula, refreshTokenHash, createdAt);
    }
}

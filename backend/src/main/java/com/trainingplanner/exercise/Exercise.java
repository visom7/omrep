package com.trainingplanner.exercise;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Exercise catalog entry.
 * ownerId == null → global seed (read-only, visible to all users).
 * ownerId != null → custom exercise owned by that user.
 */
@Document(collection = "exercises")
public record Exercise(
        @Id String id,
        String ownerId,           // null for global seeds
        String name,              // user-authored content, may be in Spanish
        MovementPattern movementPattern,
        boolean isBasic           // counts toward total-of-basics 1RM
) {}

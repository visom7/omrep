package com.trainingplanner.exercise;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExerciseRepository extends MongoRepository<Exercise, String> {

    /** Global seeds (ownerId is null) */
    List<Exercise> findByOwnerIdIsNull();

    /** User's custom exercises */
    List<Exercise> findByOwnerId(String ownerId);

    /** Count global seeds by name (for idempotent seeding) */
    boolean existsByNameAndOwnerIdIsNull(String name);
}

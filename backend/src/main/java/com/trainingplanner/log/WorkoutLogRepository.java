package com.trainingplanner.log;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

public interface WorkoutLogRepository extends MongoRepository<WorkoutLog, String> {

    List<WorkoutLog> findByUserId(String userId);

    @Query("{ 'userId': ?0, 'date': { $gte: ?1, $lte: ?2 } }")
    List<WorkoutLog> findByUserIdAndDateBetween(String userId, Instant from, Instant to);

    @Query("{ 'userId': ?0, 'date': { $gte: ?1, $lte: ?2 }, 'blockId': ?3 }")
    List<WorkoutLog> findByUserIdAndDateBetweenAndBlockId(
            String userId, Instant from, Instant to, String blockId);

    @Query("{ 'userId': ?0, 'blockId': ?1 }")
    List<WorkoutLog> findByUserIdAndBlockId(String userId, String blockId);

    /** For CSV streaming — returns a Stream to avoid loading all into memory */
    @Query("{ 'userId': ?0 }")
    Stream<WorkoutLog> streamByUserId(String userId);
}

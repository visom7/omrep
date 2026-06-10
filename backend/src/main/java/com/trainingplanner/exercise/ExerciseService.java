package com.trainingplanner.exercise;

import com.trainingplanner.exercise.dto.CreateExerciseRequest;
import com.trainingplanner.exercise.dto.ExerciseResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;

    public ExerciseService(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    /**
     * Returns global seeds + the calling user's custom exercises.
     * Never returns other users' custom exercises (§3.3).
     */
    public List<ExerciseResponse> listForUser(String userId) {
        List<Exercise> results = new ArrayList<>();
        results.addAll(exerciseRepository.findByOwnerIdIsNull());
        results.addAll(exerciseRepository.findByOwnerId(userId));
        return results.stream().map(ExerciseResponse::from).toList();
    }

    public ExerciseResponse create(String userId, CreateExerciseRequest request) {
        Exercise exercise = new Exercise(
                null,
                userId,
                request.name(),
                request.movementPattern(),
                request.isBasic()
        );
        return ExerciseResponse.from(exerciseRepository.save(exercise));
    }

    /**
     * Updates a custom exercise.
     * Throws 403 if seed global or owned by another user, 404 if not found.
     */
    public ExerciseResponse update(String userId, String exerciseId, CreateExerciseRequest request) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found"));

        if (exercise.ownerId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update global exercises");
        }

        if (!exercise.ownerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update another user's exercise");
        }

        Exercise updated = new Exercise(
                exercise.id(),
                exercise.ownerId(),
                request.name(),
                request.movementPattern(),
                request.isBasic()
        );
        return ExerciseResponse.from(exerciseRepository.save(updated));
    }

    /**
     * Deletes a custom exercise.
     * Throws 403 if not owned by userId, 404 if not found.
     * Global seeds (ownerId == null) cannot be deleted.
     */
    public void delete(String userId, String exerciseId) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found"));

        if (exercise.ownerId() == null) {
            // Global seed — cannot be deleted
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete global exercises");
        }

        if (!exercise.ownerId().equals(userId)) {
            // Owned by another user — return 403 (§3.3)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete another user's exercise");
        }

        exerciseRepository.deleteById(exerciseId);
    }
}

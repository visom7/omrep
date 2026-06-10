package com.trainingplanner.exercise;

import com.trainingplanner.exercise.dto.CreateExerciseRequest;
import com.trainingplanner.exercise.dto.ExerciseResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseService exerciseService;

    public ExerciseController(ExerciseService exerciseService) {
        this.exerciseService = exerciseService;
    }

    @GetMapping
    public List<ExerciseResponse> list(@AuthenticationPrincipal String userId) {
        return exerciseService.listForUser(userId);
    }

    @PostMapping
    public ResponseEntity<ExerciseResponse> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateExerciseRequest request
    ) {
        ExerciseResponse response = exerciseService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExerciseResponse> update(
            @AuthenticationPrincipal String userId,
            @PathVariable String id,
            @Valid @RequestBody CreateExerciseRequest request
    ) {
        ExerciseResponse response = exerciseService.update(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String id
    ) {
        exerciseService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}

package com.trainingplanner.log;

import com.trainingplanner.auth.User;
import com.trainingplanner.auth.UserRepository;
import com.trainingplanner.block.SetType;
import com.trainingplanner.domain.OneRmCalculator;
import com.trainingplanner.exercise.Exercise;
import com.trainingplanner.exercise.ExerciseRepository;
import com.trainingplanner.log.dto.CreateLogRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class WorkoutLogService {

    private final WorkoutLogRepository logRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    public WorkoutLogService(
            WorkoutLogRepository logRepository,
            ExerciseRepository exerciseRepository,
            UserRepository userRepository
    ) {
        this.logRepository = logRepository;
        this.exerciseRepository = exerciseRepository;
        this.userRepository = userRepository;
    }

    public WorkoutLog create(String userId, CreateLogRequest request) {
        // Resolve exercise for denormalized fields
        Exercise exercise = exerciseRepository.findById(request.exerciseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found"));

        // Resolve user's preferred formula
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Compute estimatedOneRmKg — only for WORKING sets
        double estimatedOneRm = 0.0;
        if (request.setType() == SetType.WORKING && request.reps() > 0 && request.weightKg() > 0) {
            estimatedOneRm = OneRmCalculator.calculate(
                    request.weightKg(),
                    request.reps(),
                    user.preferredOneRmFormula()
            );
        }

        WorkoutLog log = new WorkoutLog(
                null,
                userId,               // always from JWT — never from request
                request.date(),
                request.blockId(),
                request.setGroupId(),
                request.exerciseId(),
                exercise.name(),      // denormalized
                exercise.movementPattern(), // denormalized
                exercise.isBasic(),   // denormalized
                request.setType(),
                request.weightKg(),
                request.reps(),
                request.rpe(),
                request.completed(),
                estimatedOneRm
        );

        return logRepository.save(log);
    }

    public List<WorkoutLog> query(String userId, String from, String to, String blockId) {
        if (from != null && to != null && blockId != null) {
            return logRepository.findByUserIdAndDateBetweenAndBlockId(
                    userId, parseDate(from), parseDate(to, true), blockId);
        }
        if (from != null && to != null) {
            return logRepository.findByUserIdAndDateBetween(
                    userId, parseDate(from), parseDate(to, true));
        }
        if (blockId != null) {
            return logRepository.findByUserIdAndBlockId(userId, blockId);
        }
        return logRepository.findByUserId(userId);
    }

    private Instant parseDate(String dateStr) {
        return LocalDate.parse(dateStr).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private Instant parseDate(String dateStr, boolean endOfDay) {
        if (!endOfDay) return parseDate(dateStr);
        return LocalDate.parse(dateStr).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}

package com.trainingplanner.log;

import com.trainingplanner.log.dto.CreateLogRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class WorkoutLogController {

    private final WorkoutLogService logService;

    public WorkoutLogController(WorkoutLogService logService) {
        this.logService = logService;
    }

    @PostMapping
    public ResponseEntity<WorkoutLog> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateLogRequest request
    ) {
        WorkoutLog log = logService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(log);
    }

    @GetMapping
    public List<WorkoutLog> query(
            @AuthenticationPrincipal String userId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String blockId
    ) {
        return logService.query(userId, from, to, blockId);
    }
}

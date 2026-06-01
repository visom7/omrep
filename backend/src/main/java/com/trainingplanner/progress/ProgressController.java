package com.trainingplanner.progress;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    /**
     * GET /api/progress/one-rm-total?from=&to=&bucket=week
     * Returns total-of-basics 1RM per week: best estimatedOneRmKg per movementPattern (isBasic),
     * summed per week. De-duplicates squat/deadlift variants by taking the max per pattern.
     */
    @GetMapping("/one-rm-total")
    public List<WeeklyOneRmTotal> getOneRmTotal(
            @AuthenticationPrincipal String userId,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "week") String bucket
    ) {
        return progressService.getWeeklyOneRmTotal(userId, from, to);
    }

    /**
     * GET /api/progress/volume?exerciseId=&from=&to=&bucket=week
     * Returns sum(weightKg * reps) for WORKING sets per week for a given exercise.
     */
    @GetMapping("/volume")
    public List<WeeklyVolume> getVolume(
            @AuthenticationPrincipal String userId,
            @RequestParam String exerciseId,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "week") String bucket
    ) {
        return progressService.getWeeklyVolume(userId, exerciseId, from, to);
    }
}

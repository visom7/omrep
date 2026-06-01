package com.trainingplanner.progress;

/**
 * Result of the one-rm-total aggregation for one ISO week.
 * totalOneRm = sum of best estimatedOneRmKg per movementPattern (isBasic exercises only).
 */
public record WeeklyOneRmTotal(
        String week,     // ISO week string, e.g. "2026-W01"
        double totalOneRm
) {}

package com.trainingplanner.progress;

/**
 * Volume (sum of weightKg * reps for WORKING sets) for one exercise in one week.
 */
public record WeeklyVolume(
        String week,       // ISO week string, e.g. "2026-W01"
        double totalVolume
) {}

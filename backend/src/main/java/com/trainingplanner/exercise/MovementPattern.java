package com.trainingplanner.exercise;

/**
 * Movement pattern categories for exercises.
 * Used for 1RM grouping (de-duplicate squat variants, deadlift variants) in progress charts.
 */
public enum MovementPattern {
    SQUAT,
    DEADLIFT,
    BENCH,
    PRESS,
    ROW,
    ACCESSORY,
    OTHER
}

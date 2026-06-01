package com.trainingplanner.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Pure utility for estimating one-rep max (1RM) from a performed set.
 *
 * Spec (§5 of REQUIREMENTS.md):
 *   - Epley:   1RM = w * (1 + reps / 30)
 *   - Brzycki: 1RM = w * 36 / (37 - reps)
 *   - Lombardi:1RM = w * reps^0.10
 *
 * Edge cases:
 *   - reps == 1  → 1RM = w (by definition)
 *   - reps == 0  → returns w (treat as single unloaded rep; caller should not log 0-rep sets)
 *   - Brzycki with reps >= 37 → throws IllegalArgumentException (guard required by spec)
 *
 * Result is rounded to 2 decimal places.
 * This class has no Spring dependencies and is safe to use in any context.
 */
public final class OneRmCalculator {

    private OneRmCalculator() {
        // utility class — no instances
    }

    /**
     * Compute the estimated 1RM.
     *
     * @param weightKg weight lifted in kilograms (must be > 0)
     * @param reps     number of repetitions performed (must be >= 0)
     * @param formula  the formula to apply
     * @return estimated 1RM in kg, rounded to 2 decimal places
     * @throws IllegalArgumentException if weightKg <= 0, or Brzycki is used with reps >= 37
     */
    public static double calculate(double weightKg, int reps, OneRmFormula formula) {
        if (weightKg <= 0) {
            throw new IllegalArgumentException("weightKg must be positive, got: " + weightKg);
        }
        if (reps <= 1) {
            // reps == 1: definitionally a 1RM; reps == 0: guard/no-op, return weight
            return round(weightKg);
        }

        double result = switch (formula) {
            case EPLEY    -> epley(weightKg, reps);
            case BRZYCKI  -> brzycki(weightKg, reps);
            case LOMBARDI -> lombardi(weightKg, reps);
        };

        return round(result);
    }

    // --- formula implementations ---

    private static double epley(double w, int reps) {
        // 1RM = w * (1 + reps / 30)
        return w * (1.0 + reps / 30.0);
    }

    private static double brzycki(double w, int reps) {
        // Guard: denominator becomes 0 or negative at reps >= 37
        if (reps >= 37) {
            throw new IllegalArgumentException(
                "Brzycki formula is undefined for reps >= 37 (got " + reps + "). " +
                "Switch to Epley or Lombardi for high-rep sets.");
        }
        // 1RM = w * 36 / (37 - reps)
        return w * 36.0 / (37 - reps);
    }

    private static double lombardi(double w, int reps) {
        // 1RM = w * reps^0.10
        return w * Math.pow(reps, 0.10);
    }

    private static double round(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}

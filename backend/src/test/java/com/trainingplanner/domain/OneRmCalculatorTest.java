package com.trainingplanner.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.*;

class OneRmCalculatorTest {

    // --- Epley ---

    @Test
    void epley_happyPath_100kgFor5Reps() {
        // 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
        double result = OneRmCalculator.calculate(100.0, 5, OneRmFormula.EPLEY);
        assertThat(result).isCloseTo(116.67, within(0.01));
    }

    @Test
    void epley_10Reps_computesCorrectly() {
        // 80 * (1 + 10/30) = 80 * 1.333 = 106.67
        double result = OneRmCalculator.calculate(80.0, 10, OneRmFormula.EPLEY);
        assertThat(result).isCloseTo(106.67, within(0.01));
    }

    // --- Brzycki ---

    @Test
    void brzycki_happyPath_100kgFor5Reps() {
        // 100 * 36 / (37 - 5) = 100 * 36 / 32 = 112.5
        double result = OneRmCalculator.calculate(100.0, 5, OneRmFormula.BRZYCKI);
        assertThat(result).isCloseTo(112.5, within(0.01));
    }

    @Test
    void brzycki_36Reps_stillWorks() {
        // reps = 36: 37 - 36 = 1, so 1RM = w * 36
        double result = OneRmCalculator.calculate(10.0, 36, OneRmFormula.BRZYCKI);
        assertThat(result).isCloseTo(360.0, within(0.01));
    }

    @Test
    void brzycki_37Reps_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> OneRmCalculator.calculate(100.0, 37, OneRmFormula.BRZYCKI))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("37");
    }

    @Test
    void brzycki_40Reps_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> OneRmCalculator.calculate(100.0, 40, OneRmFormula.BRZYCKI))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- Lombardi ---

    @Test
    void lombardi_happyPath_100kgFor5Reps() {
        // 100 * 5^0.10 = 100 * 1.17462... = 117.46
        double result = OneRmCalculator.calculate(100.0, 5, OneRmFormula.LOMBARDI);
        assertThat(result).isCloseTo(117.46, within(0.01));
    }

    @Test
    void lombardi_10Reps_computesCorrectly() {
        // 100 * 10^0.10 = 100 * 1.25893 = 125.89
        double result = OneRmCalculator.calculate(100.0, 10, OneRmFormula.LOMBARDI);
        assertThat(result).isCloseTo(125.89, within(0.01));
    }

    // --- Edge case: reps == 1 ---

    @ParameterizedTest
    @EnumSource(OneRmFormula.class)
    void reps1_allFormulas_returnsWeightKg(OneRmFormula formula) {
        double result = OneRmCalculator.calculate(100.0, 1, formula);
        assertThat(result).isEqualTo(100.0);
    }

    @ParameterizedTest
    @EnumSource(OneRmFormula.class)
    void reps1_differentWeights_returnsWeightKg(OneRmFormula formula) {
        double result = OneRmCalculator.calculate(142.5, 1, formula);
        assertThat(result).isEqualTo(142.5);
    }

    // --- Edge case: reps == 0 ---

    @ParameterizedTest
    @EnumSource(OneRmFormula.class)
    void reps0_allFormulas_returnsWeightKg(OneRmFormula formula) {
        // 0 reps is a degenerate case; we return weight as a safe fallback
        double result = OneRmCalculator.calculate(100.0, 0, formula);
        assertThat(result).isEqualTo(100.0);
    }

    // --- Edge case: invalid weight ---

    @Test
    void negativeWeight_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> OneRmCalculator.calculate(-50.0, 5, OneRmFormula.EPLEY))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void zeroWeight_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> OneRmCalculator.calculate(0.0, 5, OneRmFormula.EPLEY))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- Rounding ---

    @Test
    void result_roundedToTwoDecimalPlaces() {
        // Epley: 102.5 * (1 + 7/30) = 102.5 * 1.2333... = 126.42
        double result = OneRmCalculator.calculate(102.5, 7, OneRmFormula.EPLEY);
        // Verify it's rounded (not a long decimal)
        String str = Double.toString(result);
        int dotIndex = str.indexOf('.');
        if (dotIndex >= 0) {
            assertThat(str.length() - dotIndex - 1).isLessThanOrEqualTo(2);
        }
    }
}

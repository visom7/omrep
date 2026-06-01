package com.trainingplanner.block.dto;

import com.trainingplanner.block.Block;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateBlockRequest(
        @NotBlank String name,
        List<Block.Week> weeks
) {}

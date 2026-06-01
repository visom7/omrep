package com.trainingplanner.block.dto;

import com.trainingplanner.block.Block;

import java.time.Instant;

/**
 * List view — metadata only, no nested weeks/days/entries.
 */
public record BlockSummary(
        String id,
        String name,
        int order,
        Instant createdAt,
        int weekCount
) {
    public static BlockSummary from(Block block) {
        return new BlockSummary(
                block.id(),
                block.name(),
                block.order(),
                block.createdAt(),
                block.weeks() != null ? block.weeks().size() : 0
        );
    }
}

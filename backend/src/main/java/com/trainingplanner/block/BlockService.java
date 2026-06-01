package com.trainingplanner.block;

import com.trainingplanner.block.dto.BlockSummary;
import com.trainingplanner.block.dto.CreateBlockRequest;
import com.trainingplanner.block.dto.DuplicateBlockRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BlockService {

    private final BlockRepository blockRepository;

    public BlockService(BlockRepository blockRepository) {
        this.blockRepository = blockRepository;
    }

    public List<BlockSummary> listForUser(String userId) {
        return blockRepository.findByUserIdOrderByOrder(userId)
                .stream()
                .map(BlockSummary::from)
                .toList();
    }

    public Block create(String userId, CreateBlockRequest request) {
        // Order = current count + 1 (simple ordering)
        int order = (int) blockRepository.findByUserIdOrderByOrder(userId).size() + 1;
        Block block = new Block(
                null,
                userId,
                request.name(),
                order,
                Instant.now(),
                request.weeks() != null ? request.weeks() : List.of()
        );
        return blockRepository.save(block);
    }

    public Block getById(String userId, String blockId) {
        return blockRepository.findByIdAndUserId(blockId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
    }

    public Block update(String userId, String blockId, CreateBlockRequest request) {
        Block existing = getById(userId, blockId);
        Block updated = new Block(
                existing.id(),
                existing.userId(),
                request.name(),
                existing.order(),
                existing.createdAt(),
                request.weeks() != null ? request.weeks() : List.of()
        );
        return blockRepository.save(updated);
    }

    public void delete(String userId, String blockId) {
        if (!blockRepository.existsByIdAndUserId(blockId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found");
        }
        blockRepository.deleteByIdAndUserId(blockId, userId);
    }

    public Block duplicate(String userId, String blockId, DuplicateBlockRequest request) {
        Block source = getById(userId, blockId);

        List<Block.Week> newWeeks = source.weeks().stream()
                .map(week -> duplicateWeek(week, request))
                .toList();

        int newOrder = (int) blockRepository.findByUserIdOrderByOrder(userId).size() + 1;
        Block copy = new Block(
                null,
                userId,
                source.name() + " (copy)",
                newOrder,
                Instant.now(),
                newWeeks
        );
        return blockRepository.save(copy);
    }

    private Block.Week duplicateWeek(Block.Week week, DuplicateBlockRequest request) {
        List<Block.Day> newDays = week.days().stream()
                .map(day -> duplicateDay(day, request))
                .toList();
        return new Block.Week(week.number(), newDays);
    }

    private Block.Day duplicateDay(Block.Day day, DuplicateBlockRequest request) {
        List<Block.ExerciseEntry> newEntries = day.entries().stream()
                .map(entry -> duplicateEntry(entry, request))
                .toList();
        return new Block.Day(day.order(), day.label(), newEntries);
    }

    private Block.ExerciseEntry duplicateEntry(Block.ExerciseEntry entry, DuplicateBlockRequest request) {
        List<Block.SetGroup> newSetGroups = entry.setGroups().stream()
                .map(sg -> duplicateSetGroup(sg, request))
                .toList();
        return new Block.ExerciseEntry(
                entry.exerciseId(),
                entry.exerciseName(),
                entry.movementPattern(),
                entry.order(),
                newSetGroups
        );
    }

    private Block.SetGroup duplicateSetGroup(Block.SetGroup sg, DuplicateBlockRequest request) {
        // Always assign a new UUID for the copy
        String newId = UUID.randomUUID().toString();

        if (request == null || request.progressionType() == null || sg.type() == SetType.WARMUP) {
            // No progression, or warmup sets are never progressed
            return new Block.SetGroup(newId, sg.type(), sg.weightKg(), sg.reps(), sg.sets(), sg.targetRpe());
        }

        return switch (request.progressionType()) {
            case WEIGHT -> new Block.SetGroup(
                    newId,
                    sg.type(),
                    sg.weightKg() + (request.progressionValue() != null ? request.progressionValue() : 0),
                    sg.reps(),
                    sg.sets(),
                    sg.targetRpe()
            );
            case REPS -> new Block.SetGroup(
                    newId,
                    sg.type(),
                    sg.weightKg(),
                    sg.reps() + (request.progressionValue() != null ? request.progressionValue().intValue() : 0),
                    sg.sets(),
                    sg.targetRpe()
            );
        };
    }
}

package com.trainingplanner.block;

import com.trainingplanner.block.dto.BlockSummary;
import com.trainingplanner.block.dto.CreateBlockRequest;
import com.trainingplanner.block.dto.DuplicateBlockRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blocks")
public class BlockController {

    private final BlockService blockService;

    public BlockController(BlockService blockService) {
        this.blockService = blockService;
    }

    @GetMapping
    public List<BlockSummary> list(@AuthenticationPrincipal String userId) {
        return blockService.listForUser(userId);
    }

    @PostMapping
    public ResponseEntity<Block> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateBlockRequest request
    ) {
        Block block = blockService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(block);
    }

    @GetMapping("/{id}")
    public Block getById(
            @AuthenticationPrincipal String userId,
            @PathVariable String id
    ) {
        return blockService.getById(userId, id);
    }

    @PutMapping("/{id}")
    public Block update(
            @AuthenticationPrincipal String userId,
            @PathVariable String id,
            @Valid @RequestBody CreateBlockRequest request
    ) {
        return blockService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String id
    ) {
        blockService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<Block> duplicate(
            @AuthenticationPrincipal String userId,
            @PathVariable String id,
            @RequestBody(required = false) DuplicateBlockRequest request
    ) {
        Block copy = blockService.duplicate(userId, id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(copy);
    }
}

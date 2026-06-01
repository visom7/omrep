package com.trainingplanner.block;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends MongoRepository<Block, String> {
    List<Block> findByUserIdOrderByOrder(String userId);
    Optional<Block> findByIdAndUserId(String id, String userId);
    boolean existsByIdAndUserId(String id, String userId);
    void deleteByIdAndUserId(String id, String userId);
}

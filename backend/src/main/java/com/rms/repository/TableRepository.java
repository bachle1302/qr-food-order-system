package com.rms.repository;

import com.rms.model.Table;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface TableRepository extends MongoRepository<Table, String> {
    Optional<Table> findByQrToken(String qrToken);
    boolean existsByQrToken(String qrToken);
}

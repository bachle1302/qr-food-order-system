package com.rms.repository;

import com.rms.model.Discount;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface DiscountRepository extends MongoRepository<Discount, String> {
    Optional<Discount> findByCode(String code);
}

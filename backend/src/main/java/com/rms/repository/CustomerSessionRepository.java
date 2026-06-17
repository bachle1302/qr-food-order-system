package com.rms.repository;

import com.rms.model.CustomerSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerSessionRepository extends MongoRepository<CustomerSession, String> {
    Optional<CustomerSession> findByIdAndActiveTrue(String id);
    List<CustomerSession> findByCustomerIdAndActiveTrue(String customerId);
}

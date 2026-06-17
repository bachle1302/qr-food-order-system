package com.rms.repository;

import com.rms.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    Optional<Customer> findByPhone(String phone);
    boolean existsByPhone(String phone);
}

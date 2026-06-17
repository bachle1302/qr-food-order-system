package com.rms.repository;

import com.rms.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByTableId(String tableId);
    List<Order> findByStatusOrderByCreatedAtAsc(String status);
    List<Order> findByStatusInOrderByCreatedAtAsc(List<String> statuses);
    List<Order> findByCustomerSessionIdOrderByCreatedAtDesc(String customerSessionId);
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

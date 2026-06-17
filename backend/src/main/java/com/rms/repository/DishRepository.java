package com.rms.repository;

import com.rms.model.Dish;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface DishRepository extends MongoRepository<Dish, String> {
    List<Dish> findByCategoryId(String categoryId);
    List<Dish> findByAvailableTrue();
    boolean existsByName(String name);
    Optional<Dish> findByName(String name);
}

package com.rms.repository;

import com.rms.model.Dish;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DishRepository extends MongoRepository<Dish, String> {
    List<Dish> findByCategoryId(String categoryId);
    List<Dish> findByAvailableTrue();
}

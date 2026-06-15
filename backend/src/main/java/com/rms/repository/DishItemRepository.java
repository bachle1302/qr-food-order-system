package com.rms.repository;

import com.rms.model.DishItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DishItemRepository extends MongoRepository<DishItem, String> {
    List<DishItem> findByComboId(String comboId);
    List<DishItem> findByProductId(String productId);
}

package com.rms.service;

import com.rms.dto.request.DishItemRequest;
import com.rms.dto.response.DishItemResponse;

import java.util.List;

public interface DishItemService {
    DishItemResponse create(DishItemRequest request);
    DishItemResponse update(String id, DishItemRequest request);
    void delete(String id);
    DishItemResponse getById(String id);
    List<DishItemResponse> getByComboId(String comboId);
    List<DishItemResponse> getByProductId(String productId);
    List<DishItemResponse> getAll();
}

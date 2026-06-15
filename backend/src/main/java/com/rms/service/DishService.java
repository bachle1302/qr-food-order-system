package com.rms.service;

import com.rms.dto.request.DishRequest;
import com.rms.dto.response.DishResponse;

import java.util.List;

public interface DishService {
    DishResponse create(DishRequest request);
    DishResponse update(String id, DishRequest request);
    void delete(String id);
    DishResponse getById(String id);
    List<DishResponse> getAll();
    List<DishResponse> getByCategory(String categoryId);
    List<DishResponse> getAvailable();
}

package com.rms.service;

import com.rms.dto.request.CategoryRequest;
import com.rms.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse create(CategoryRequest request);
    CategoryResponse update(String id, CategoryRequest request);
    void delete(String id);
    CategoryResponse getById(String id);
    List<CategoryResponse> getAll();
}

package com.rms.service;

import com.rms.dto.request.CategoryRequest;
import com.rms.dto.response.CategoryResponse;
import com.rms.exception.ResourceNotFoundException;
import com.rms.model.Category;
import com.rms.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public CategoryResponse create(CategoryRequest request) {
        Category c = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        categoryRepository.save(c);
        return toResponse(c);
    }

    @Override
    public CategoryResponse update(String id, CategoryRequest request) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        c.setName(request.getName());
        c.setDescription(request.getDescription());
        categoryRepository.save(c);
        return toResponse(c);
    }

    @Override
    public void delete(String id) {
        if (!categoryRepository.existsById(id)) throw new ResourceNotFoundException("Category not found");
        categoryRepository.deleteById(id);
    }

    @Override
    public CategoryResponse getById(String id) {
        return categoryRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    @Override
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    private CategoryResponse toResponse(Category c) {
        CategoryResponse r = new CategoryResponse();
        r.setId(c.getId());
        r.setName(c.getName());
        r.setDescription(c.getDescription());
        return r;
    }
}

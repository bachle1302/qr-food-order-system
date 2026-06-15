package com.rms.service;

import com.rms.dto.request.DishRequest;
import com.rms.dto.response.DishResponse;
import com.rms.exception.ResourceNotFoundException;
import com.rms.model.Dish;
import com.rms.repository.DishRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DishServiceImpl implements DishService {

    private final DishRepository dishRepository;

    @Override
    public DishResponse create(DishRequest request) {
        Dish d = Dish.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .categoryId(request.getCategoryId())
                .imageUrl(request.getImageUrl())
                .available(request.getAvailable() == null ? true : request.getAvailable())
                .build();
        dishRepository.save(d);
        return toResponse(d);
    }

    @Override
    public DishResponse update(String id, DishRequest request) {
        Dish d = dishRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish not found"));
        
        // Update only provided fields
        if (request.getName() != null && !request.getName().isEmpty()) {
            d.setName(request.getName());
        }
        if (request.getDescription() != null) {
            d.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            d.setPrice(request.getPrice());
        }
        if (request.getCategoryId() != null && !request.getCategoryId().isEmpty()) {
            d.setCategoryId(request.getCategoryId());
        }
        if (request.getImageUrl() != null) {
            d.setImageUrl(request.getImageUrl());
        }
        if (request.getAvailable() != null) {
            d.setAvailable(request.getAvailable());
        }
        
        dishRepository.save(d);
        return toResponse(d);
    }

    @Override
    public void delete(String id) {
        if (!dishRepository.existsById(id)) throw new ResourceNotFoundException("Dish not found");
        dishRepository.deleteById(id);
    }

    @Override
    public DishResponse getById(String id) {
        return dishRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Dish not found"));
    }

    @Override
    public List<DishResponse> getAll() {
        return dishRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<DishResponse> getByCategory(String categoryId) {
        return dishRepository.findByCategoryId(categoryId).stream().map(this::toResponse).toList();
    }

    @Override
    public List<DishResponse> getAvailable() {
        return dishRepository.findByAvailableTrue().stream().map(this::toResponse).toList();
    }

    private DishResponse toResponse(Dish d) {
        DishResponse r = new DishResponse();
        r.setId(d.getId());
        r.setName(d.getName());
        r.setDescription(d.getDescription());
        r.setPrice(d.getPrice());
        r.setCategoryId(d.getCategoryId());
        r.setAvailable(d.isAvailable());
        r.setImageUrl(d.getImageUrl());
        return r;
    }
}

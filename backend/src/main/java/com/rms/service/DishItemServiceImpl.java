package com.rms.service;

import com.rms.dto.request.DishItemRequest;
import com.rms.dto.response.DishItemResponse;
import com.rms.exception.BadRequestException;
import com.rms.exception.ResourceNotFoundException;
import com.rms.model.DishItem;
import com.rms.repository.DishItemRepository;
import com.rms.repository.DishRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DishItemServiceImpl implements DishItemService {

    private final DishItemRepository dishItemRepository;
    private final DishRepository dishRepository;

    @Override
    public DishItemResponse create(DishItemRequest request) {
        // Validate combo exists
        if (!dishRepository.existsById(request.getComboId())) {
            throw new BadRequestException("Combo dish not found");
        }

        // Validate product exists
        if (!dishRepository.existsById(request.getProductId())) {
            throw new BadRequestException("Product dish not found");
        }

        DishItem dishItem = DishItem.builder()
                .comboId(request.getComboId())
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .build();

        dishItemRepository.save(dishItem);
        return toResponse(dishItem);
    }

    @Override
    public DishItemResponse update(String id, DishItemRequest request) {
        DishItem dishItem = dishItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DishItem not found"));

        // Validate combo exists
        if (!dishRepository.existsById(request.getComboId())) {
            throw new BadRequestException("Combo dish not found");
        }

        // Validate product exists
        if (!dishRepository.existsById(request.getProductId())) {
            throw new BadRequestException("Product dish not found");
        }

        dishItem.setComboId(request.getComboId());
        dishItem.setProductId(request.getProductId());
        dishItem.setQuantity(request.getQuantity());

        dishItemRepository.save(dishItem);
        return toResponse(dishItem);
    }

    @Override
    public void delete(String id) {
        if (!dishItemRepository.existsById(id)) {
            throw new ResourceNotFoundException("DishItem not found");
        }
        dishItemRepository.deleteById(id);
    }

    @Override
    public DishItemResponse getById(String id) {
        return dishItemRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("DishItem not found"));
    }

    @Override
    public List<DishItemResponse> getByComboId(String comboId) {
        return dishItemRepository.findByComboId(comboId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<DishItemResponse> getByProductId(String productId) {
        return dishItemRepository.findByProductId(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<DishItemResponse> getAll() {
        return dishItemRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private DishItemResponse toResponse(DishItem dishItem) {
        DishItemResponse response = new DishItemResponse();
        response.setId(dishItem.getId());
        response.setComboId(dishItem.getComboId());
        response.setProductId(dishItem.getProductId());
        response.setQuantity(dishItem.getQuantity());
        return response;
    }
}

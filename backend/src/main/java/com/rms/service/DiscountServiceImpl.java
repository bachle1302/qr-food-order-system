package com.rms.service;

import com.rms.dto.request.DiscountRequest;
import com.rms.dto.response.DiscountResponse;
import com.rms.exception.ResourceNotFoundException;
import com.rms.model.Discount;
import com.rms.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountServiceImpl implements DiscountService {

    private final DiscountRepository discountRepository;

    @Override
    public DiscountResponse create(DiscountRequest request) {
        Discount discount = Discount.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .discountPercent(request.getDiscountPercent())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .usageCount(0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        discountRepository.save(discount);
        return toResponse(discount);
    }

    @Override
    public DiscountResponse update(String id, DiscountRequest request) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount not found"));
        
        if (request.getCode() != null && !request.getCode().isEmpty()) {
            discount.setCode(request.getCode());
        }
        if (request.getDescription() != null && !request.getDescription().isEmpty()) {
            discount.setDescription(request.getDescription());
        }
        if (request.getDiscountPercent() != null) {
            discount.setDiscountPercent(request.getDiscountPercent());
        }
        if (request.getMinOrderAmount() != null) {
            discount.setMinOrderAmount(request.getMinOrderAmount());
        }
        if (request.getMaxDiscountAmount() != null) {
            discount.setMaxDiscountAmount(request.getMaxDiscountAmount());
        }
        if (request.getStartDate() != null) {
            discount.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            discount.setEndDate(request.getEndDate());
        }
        if (request.getUsageLimit() != null) {
            discount.setUsageLimit(request.getUsageLimit());
        }
        if (request.getActive() != null) {
            discount.setActive(request.getActive());
        }
        
        discountRepository.save(discount);
        return toResponse(discount);
    }

    @Override
    public void delete(String id) {
        if (!discountRepository.existsById(id)) {
            throw new ResourceNotFoundException("Discount not found");
        }
        discountRepository.deleteById(id);
    }

    @Override
    public DiscountResponse getById(String id) {
        return discountRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Discount not found"));
    }

    @Override
    public DiscountResponse getByCode(String code) {
        return discountRepository.findByCode(code)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Discount not found with code: " + code));
    }

    @Override
    public List<DiscountResponse> getAll() {
        return discountRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private DiscountResponse toResponse(Discount discount) {
        DiscountResponse response = new DiscountResponse();
        response.setId(discount.getId());
        response.setCode(discount.getCode());
        response.setDescription(discount.getDescription());
        response.setDiscountPercent(discount.getDiscountPercent());
        response.setMinOrderAmount(discount.getMinOrderAmount());
        response.setMaxDiscountAmount(discount.getMaxDiscountAmount());
        response.setStartDate(discount.getStartDate());
        response.setEndDate(discount.getEndDate());
        response.setUsageLimit(discount.getUsageLimit());
        response.setUsageCount(discount.getUsageCount());
        response.setActive(discount.getActive());
        return response;
    }
}

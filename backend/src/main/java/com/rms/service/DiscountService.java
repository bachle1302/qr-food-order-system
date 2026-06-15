package com.rms.service;

import com.rms.dto.request.DiscountRequest;
import com.rms.dto.response.DiscountResponse;

import java.util.List;

public interface DiscountService {
    DiscountResponse create(DiscountRequest request);
    DiscountResponse update(String id, DiscountRequest request);
    void delete(String id);
    DiscountResponse getById(String id);
    DiscountResponse getByCode(String code);
    List<DiscountResponse> getAll();
}

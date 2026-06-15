package com.rms.controller;

import com.rms.dto.request.DiscountRequest;
import com.rms.dto.response.DiscountResponse;
import com.rms.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountController {

    private final DiscountService discountService;

    @PostMapping
    public DiscountResponse create(@RequestBody DiscountRequest request) {
        return discountService.create(request);
    }

    @PutMapping("/{id}")
    public DiscountResponse update(@PathVariable String id, @RequestBody DiscountRequest request) {
        return discountService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        discountService.delete(id);
    }

    @GetMapping("/{id}")
    public DiscountResponse getById(@PathVariable String id) {
        return discountService.getById(id);
    }

    @GetMapping("/code/{code}")
    public DiscountResponse getByCode(@PathVariable String code) {
        return discountService.getByCode(code);
    }

    @GetMapping
    public List<DiscountResponse> getAll() {
        return discountService.getAll();
    }
}

package com.rms.controller;

import com.rms.dto.request.DishItemRequest;
import com.rms.dto.response.DishItemResponse;
import com.rms.service.DishItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dish-items")
@RequiredArgsConstructor
public class DishItemController {

    private final DishItemService dishItemService;

    @PostMapping
    public DishItemResponse create(@RequestBody DishItemRequest request) {
        return dishItemService.create(request);
    }

    @PutMapping("/{id}")
    public DishItemResponse update(@PathVariable String id, @RequestBody DishItemRequest request) {
        return dishItemService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        dishItemService.delete(id);
    }

    @GetMapping("/{id}")
    public DishItemResponse getById(@PathVariable String id) {
        return dishItemService.getById(id);
    }

    @GetMapping("/combo/{comboId}")
    public List<DishItemResponse> getByComboId(@PathVariable String comboId) {
        return dishItemService.getByComboId(comboId);
    }

    @GetMapping("/product/{productId}")
    public List<DishItemResponse> getByProductId(@PathVariable String productId) {
        return dishItemService.getByProductId(productId);
    }

    @GetMapping
    public List<DishItemResponse> getAll() {
        return dishItemService.getAll();
    }
}

package com.rms.controller;

import com.rms.dto.request.DishRequest;
import com.rms.dto.response.DishResponse;
import com.rms.service.DishService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dishes")
@RequiredArgsConstructor
public class DishController {

    private final DishService dishService;

    @PostMapping
    public DishResponse create(@RequestBody DishRequest req) {
        return dishService.create(req);
    }

    @PutMapping("/{id}")
    public DishResponse update(@PathVariable String id, @RequestBody DishRequest req) {
        return dishService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        dishService.delete(id);
    }

    @GetMapping("/{id}")
    public DishResponse getById(@PathVariable String id) {
        return dishService.getById(id);
    }

    @GetMapping
    public List<DishResponse> getAll(@RequestParam(required = false) String categoryId,
                                     @RequestParam(required = false) Boolean available) {
        if (categoryId != null) return dishService.getByCategory(categoryId);
        if (available != null && available) return dishService.getAvailable();
        return dishService.getAll();
    }
}

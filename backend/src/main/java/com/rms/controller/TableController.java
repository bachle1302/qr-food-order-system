package com.rms.controller;

import com.rms.dto.request.TableRequest;
import com.rms.dto.response.TableQrTokenResponse;
import com.rms.dto.response.TableResponse;
import com.rms.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @PostMapping
    public TableResponse create(@RequestBody TableRequest request) {
        return tableService.create(request);
    }

    @PutMapping("/{id}")
    public TableResponse update(@PathVariable String id, @RequestBody TableRequest request) {
        return tableService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        tableService.delete(id);
    }

    @GetMapping("/{id}")
    public TableResponse getById(@PathVariable String id) {
        return tableService.getById(id);
    }

    @GetMapping("/qr/{qrToken}")
    public TableResponse getByQrToken(@PathVariable String qrToken) {
        return tableService.getByQrToken(qrToken);
    }

    @PostMapping("/{id}/regenerate-qr-token")
    public TableQrTokenResponse regenerateQrToken(@PathVariable String id) {
        return tableService.regenerateQrToken(id);
    }

    @GetMapping
    public List<TableResponse> getAll() {
        return tableService.getAll();
    }
}

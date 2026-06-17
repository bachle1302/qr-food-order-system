package com.rms.service;

import com.rms.dto.request.TableRequest;
import com.rms.dto.response.TableQrTokenResponse;
import com.rms.dto.response.TableResponse;
import com.rms.exception.BadRequestException;
import com.rms.exception.ResourceNotFoundException;
import com.rms.model.Table;
import com.rms.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private static final int QR_TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final TableRepository tableRepository;

    @Override
    public TableResponse create(TableRequest request) {
        Table table = Table.builder()
                .name(request.getName())
                .seats(request.getSeats())
                .available(true)
                .qrToken(generateUniqueQrToken())
                .build();
        tableRepository.save(table);
        return toResponse(table);
    }

    @Override
    public TableResponse update(String id, TableRequest request) {
        Table table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        table.setName(request.getName());
        table.setSeats(request.getSeats());
        ensureQrToken(table);

        tableRepository.save(table);
        return toResponse(table);
    }

    @Override
    public void delete(String id) {
        if (!tableRepository.existsById(id)) {
            throw new ResourceNotFoundException("Table not found");
        }
        tableRepository.deleteById(id);
    }

    @Override
    public TableResponse getById(String id) {
        Table table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        ensureQrToken(table);
        return toResponse(table);
    }

    @Override
    public TableResponse getByQrToken(String qrToken) {
        if (qrToken == null || qrToken.isBlank()) {
            throw new BadRequestException("QR token is required");
        }

        Table table = tableRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new BadRequestException("Invalid QR token"));

        return toResponse(table);
    }

    @Override
    public TableQrTokenResponse regenerateQrToken(String id) {
        Table table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        table.setQrToken(generateUniqueQrToken());
        tableRepository.save(table);

        return TableQrTokenResponse.builder()
                .tableId(table.getId())
                .qrToken(table.getQrToken())
                .build();
    }

    @Override
    public List<TableResponse> getAll() {
        return tableRepository.findAll()
                .stream()
                .map(table -> {
                    ensureQrToken(table);
                    return toResponse(table);
                })
                .toList();
    }

    private void ensureQrToken(Table table) {
        if (table.getQrToken() == null || table.getQrToken().isBlank()) {
            table.setQrToken(generateUniqueQrToken());
            tableRepository.save(table);
        }
    }

    private TableResponse toResponse(Table table) {
        TableResponse res = new TableResponse();
        res.setId(table.getId());
        res.setName(table.getName());
        res.setSeats(table.getSeats());
        res.setQrToken(table.getQrToken());
        res.setAvailable(table.isAvailable());
        return res;
    }

    private String generateUniqueQrToken() {
        String token;
        do {
            byte[] randomBytes = new byte[QR_TOKEN_BYTES];
            SECURE_RANDOM.nextBytes(randomBytes);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        } while (tableRepository.existsByQrToken(token));
        return token;
    }
}

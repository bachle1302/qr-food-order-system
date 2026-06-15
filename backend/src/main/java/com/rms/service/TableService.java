package com.rms.service;

import com.rms.dto.request.TableRequest;
import com.rms.dto.response.TableQrTokenResponse;
import com.rms.dto.response.TableResponse;

import java.util.List;

public interface TableService {
    TableResponse create(TableRequest request);
    TableResponse update(String id, TableRequest request);
    void delete(String id);
    TableResponse getById(String id);
    TableResponse getByQrToken(String qrToken);
    TableQrTokenResponse regenerateQrToken(String id);
    List<TableResponse> getAll();
}

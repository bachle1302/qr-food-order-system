package com.rms.service;

import com.rms.dto.request.CustomerCheckInRequest;
import com.rms.dto.response.CustomerSessionResponse;
import com.rms.exception.BadRequestException;
import com.rms.model.Customer;
import com.rms.model.CustomerSession;
import com.rms.model.Table;
import com.rms.repository.CustomerRepository;
import com.rms.repository.CustomerSessionRepository;
import com.rms.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomerSessionServiceImpl implements CustomerSessionService {

    private final CustomerRepository customerRepository;
    private final CustomerSessionRepository customerSessionRepository;
    private final TableRepository tableRepository;

    @Override
    public CustomerSessionResponse checkIn(CustomerCheckInRequest request) {
        if (request == null) {
            throw new BadRequestException("Check-in request is required");
        }

        String qrToken = normalizeRequired(request.getQrToken(), "QR token is required");
        String name = normalizeRequired(request.getName(), "Customer name is required");
        String phone = normalizeOptional(request.getPhone());

        Table table = tableRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new BadRequestException("Invalid QR token"));

        LocalDateTime now = LocalDateTime.now();
        CustomerLookupResult customerResult = findOrCreateCustomer(name, phone, now);

        CustomerSession session = CustomerSession.builder()
                .customerId(customerResult.customer().getId())
                .tableId(table.getId())
                .qrToken(qrToken)
                .startedAt(now)
                .lastActiveAt(now)
                .active(true)
                .build();
        customerSessionRepository.save(session);

        return toResponse(session, customerResult.customer(), table, customerResult.isNewCustomer());
    }

    private CustomerLookupResult findOrCreateCustomer(String name, String phone, LocalDateTime now) {
        if (phone != null) {
            return customerRepository.findByPhone(phone)
                    .map(customer -> {
                        if (!name.equals(customer.getName())) {
                            customer.setName(name);
                            customer.setUpdatedAt(now);
                            customerRepository.save(customer);
                        }
                        return new CustomerLookupResult(customer, false);
                    })
                    .orElseGet(() -> new CustomerLookupResult(createCustomer(name, phone, now), true));
        }

        return new CustomerLookupResult(createCustomer(name, null, now), true);
    }

    private Customer createCustomer(String name, String phone, LocalDateTime now) {
        Customer customer = Customer.builder()
                .name(name)
                .phone(phone)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return customerRepository.save(customer);
    }

    private CustomerSessionResponse toResponse(CustomerSession session, Customer customer, Table table, boolean isNewCustomer) {
        CustomerSessionResponse response = new CustomerSessionResponse();
        response.setSessionId(session.getId());
        response.setCustomerId(customer.getId());
        response.setCustomerName(customer.getName());
        response.setCustomerPhone(customer.getPhone());
        response.setTableId(table.getId());
        response.setTableName(table.getName());
        response.setQrToken(session.getQrToken());
        response.setIsNewCustomer(isNewCustomer);
        response.setStartedAt(session.getStartedAt());
        return response;
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new BadRequestException(message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record CustomerLookupResult(Customer customer, boolean isNewCustomer) {
    }
}

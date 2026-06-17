package com.rms.controller;

import com.rms.dto.request.CustomerCheckInRequest;
import com.rms.dto.response.CustomerSessionResponse;
import com.rms.service.CustomerSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer-sessions")
@RequiredArgsConstructor
public class CustomerSessionController {

    private final CustomerSessionService customerSessionService;

    @PostMapping("/check-in")
    public CustomerSessionResponse checkIn(@Valid @RequestBody CustomerCheckInRequest request) {
        return customerSessionService.checkIn(request);
    }
}

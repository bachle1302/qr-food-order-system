package com.rms.service;

import com.rms.dto.request.CustomerCheckInRequest;
import com.rms.dto.response.CustomerSessionResponse;

public interface CustomerSessionService {
    CustomerSessionResponse checkIn(CustomerCheckInRequest request);
}

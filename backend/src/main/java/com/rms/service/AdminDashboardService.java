package com.rms.service;

import com.rms.dto.response.AdminDashboardResponse;

import java.time.LocalDate;

public interface AdminDashboardService {
    AdminDashboardResponse getDashboard(LocalDate date);
}

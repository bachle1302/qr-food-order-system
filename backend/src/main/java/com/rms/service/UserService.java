package com.rms.service;

import com.rms.dto.request.UpdateUserRequest;
import com.rms.dto.response.UserResponse;
import com.rms.model.Role;

import java.util.List;

public interface UserService {
    
    /**
     * Get user by ID
     */
    UserResponse getById(String id);
    
    /**
     * Get all users
     */
    List<UserResponse> getAll();
    
    /**
     * Get users by role
     */
    List<UserResponse> getByRole(Role role);
    
    /**
     * Update user active status
     */
    UserResponse updateActiveStatus(String id, Boolean isActive);
    
    /**
     * Update user information
     */
    UserResponse updateUser(String id, UpdateUserRequest request);
}

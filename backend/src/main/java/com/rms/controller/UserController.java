package com.rms.controller;

import com.rms.dto.request.UpdateUserRequest;
import com.rms.dto.response.ApiResponse;
import com.rms.dto.response.UserResponse;
import com.rms.model.Role;
import com.rms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    /**
     * Get user by ID (ADMIN only)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable String id) {
        UserResponse user = userService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }
    
    /**
     * Get all users (ADMIN only)
     * Optional: Filter by role using query param ?role=STAFF or ?role=ADMIN
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAll(
            @RequestParam(required = false) String role) {
        
        List<UserResponse> users;
        
        if (role != null) {
            Role roleEnum = Role.valueOf(role.toUpperCase());
            users = userService.getByRole(roleEnum);
        } else {
            users = userService.getAll();
        }
        
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }
    
    /**
     * Update user information (ADMIN only)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
    }
    
    /**
     * Update user active status (ADMIN only)
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateActiveStatus(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body) {
        
        Boolean isActive = body.get("isActive");
        UserResponse user = userService.updateActiveStatus(id, isActive);
        
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", user));
    }
}

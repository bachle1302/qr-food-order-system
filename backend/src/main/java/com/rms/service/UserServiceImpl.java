package com.rms.service;

import com.rms.adapter.impl.UserResponseAdapter;
import com.rms.dto.request.UpdateUserRequest;
import com.rms.dto.response.UserResponse;
import com.rms.exception.ResourceNotFoundException;
import com.rms.model.Role;
import com.rms.model.User;
import com.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final UserResponseAdapter userAdapter; // Using Adapter Pattern
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public UserResponse getById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Using Adapter Pattern to convert Entity to DTO
        return userAdapter.toDto(user);
    }
    
    @Override
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(userAdapter::toDto) // Using Adapter Pattern
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserResponse> getByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(userAdapter::toDto) // Using Adapter Pattern
                .collect(Collectors.toList());
    }
    
    @Override
    public UserResponse updateActiveStatus(String id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setIsActive(isActive);
        userRepository.save(user);
        
        // Using Adapter Pattern to convert Entity to DTO
        return userAdapter.toDto(user);
    }
    
    @Override
    public UserResponse updateUser(String id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Update only provided fields
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        if (request.getDisplayName() != null && !request.getDisplayName().isEmpty()) {
            user.setDisplayName(request.getDisplayName());
        }
        
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        
        userRepository.save(user);
        
        // Using Adapter Pattern to convert Entity to DTO
        return userAdapter.toDto(user);
    }
}

package com.rms.adapter.impl;

import com.rms.adapter.EntityDtoAdapter;
import com.rms.dto.response.UserResponse;
import com.rms.model.User;
import org.springframework.stereotype.Component;

/**
 * Adapter Pattern: Converts between User entity and UserResponse DTO
 */
@Component
public class UserResponseAdapter implements EntityDtoAdapter<User, UserResponse> {
    
    @Override
    public UserResponse toDto(User entity) {
        if (entity == null) {
            return null;
        }
        
        return UserResponse.builder()
                .id(entity.getId())
                .email(entity.getEmail())
                .displayName(entity.getDisplayName())
                .avatar(entity.getAvatar())
                .role(entity.getRole())
                .createdAt(entity.getCreatedAt())
                .build();
    }
    
    @Override
    public User toEntity(UserResponse dto) {
        if (dto == null) {
            return null;
        }
        
        return User.builder()
                .id(dto.getId())
                .email(dto.getEmail())
                .displayName(dto.getDisplayName())
                .avatar(dto.getAvatar())
                .role(dto.getRole())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}

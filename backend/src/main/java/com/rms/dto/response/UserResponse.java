package com.rms.dto.response;

import com.rms.model.Role;
import com.rms.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private String id;
    private String email;
    private String displayName;
    private String avatar;
    private Role role;
    private LocalDateTime createdAt;
    
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

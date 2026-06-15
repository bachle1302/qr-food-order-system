package com.rms.config;

import com.rms.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - không cần authentication
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/refresh").permitAll()
                        .requestMatchers("/api/orders/public").permitAll()
                        .requestMatchers("/api/orders/public/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        
                        // Cho phép tạo order (POST only)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/orders").permitAll()
                        
                        // Cho phép xem thông tin món ăn (GET only)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/dishes/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/dishes").permitAll()
                        
                        // Cho phép xem thông tin bàn (GET only)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/tables/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/tables").permitAll()
                        
                        // Cho phép xem thông tin danh mục (GET only)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/categories").permitAll()
                        
                        // Cho phép xem thông tin món trong combo (GET only)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/dish-items/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/dish-items").permitAll()
                        
                        // Quản lý users - chỉ ADMIN
                        .requestMatchers("/api/users/**").hasAuthority("ADMIN")
                        
                        // Chỉ ADMIN mới có thể tạo tài khoản mới
                        .requestMatchers("/api/auth/register").hasAuthority("ADMIN")
                        
                        // ADMIN có quyền truy cập tất cả
                        .requestMatchers("/api/**").hasAnyAuthority("ADMIN", "STAFF")
                        
                        .anyRequest().authenticated())

                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

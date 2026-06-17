package com.rms.config;

import com.rms.security.JwtAuthenticationFilter;
import com.rms.security.ratelimit.RateLimitFilter;
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
    private final RateLimitFilter rateLimitFilter;
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
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/orders/public").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/orders/public/qr").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/orders/public/session/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/customer-sessions/check-in").permitAll()
                        
                        // Cho phép tạo order (POST only)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/orders").permitAll()

                        // Realtime order events cho STAFF/ADMIN
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/orders/events").hasAnyAuthority("ADMIN", "STAFF")

                        // Quan ly order cho STAFF/ADMIN
                        .requestMatchers("/api/orders/manage").hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/orders/manage/**").hasAnyAuthority("ADMIN", "STAFF")
                        
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
                        // API Thống kê/Doanh thu - chỉ ADMIN
                        .requestMatchers("/api/orders/summary/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/orders/revenue/**").hasAuthority("ADMIN")

                        // CRUD Categories - chỉ ADMIN
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/categories").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/categories/**").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/categories/**").hasAuthority("ADMIN")

                        // CRUD Dishes - chỉ ADMIN
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/dishes").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/dishes/**").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/dishes/**").hasAuthority("ADMIN")

                        // CRUD Tables - chỉ ADMIN
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/tables").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/tables/**/regenerate-qr-token").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/tables/**").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/tables/**").hasAuthority("ADMIN")

                        // CRUD Discounts - chỉ ADMIN
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/discounts").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/discounts/**").hasAuthority("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/discounts/**").hasAuthority("ADMIN")
                        
                        // GET Discount cho khách kiểm tra code
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/discounts/code/**").permitAll()

                        // Xóa Order - chỉ ADMIN
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/orders/**").hasAuthority("ADMIN")

                        // ADMIN có quyền truy cập tất cả
                        .requestMatchers("/api/**").hasAnyAuthority("ADMIN", "STAFF")
                        
                        .anyRequest().authenticated())

                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class);
        
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

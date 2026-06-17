package com.rms.security;

import com.rms.model.Role;
import com.rms.model.User;
import com.rms.repository.*;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.oneOf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    // Mock repositories to prevent real MongoDB connection
    @MockBean
    private UserRepository userRepository;
    @MockBean
    private TableRepository tableRepository;
    @MockBean
    private CategoryRepository categoryRepository;
    @MockBean
    private DishRepository dishRepository;
    @MockBean
    private DiscountRepository discountRepository;
    @MockBean
    private OrderRepository orderRepository;
    @MockBean
    private PaymentRepository paymentRepository;
    @MockBean
    private DishItemRepository dishItemRepository;
    @MockBean
    private CustomerSessionRepository customerSessionRepository;
    @MockBean
    private CustomerRepository customerRepository;

    private String getAdminToken() {
        User admin = User.builder()
                .id("admin-id")
                .email("admin@test.local")
                .displayName("Admin Test")
                .role(Role.ADMIN)
                .isActive(true)
                .build();
        Mockito.when(userRepository.findById("admin-id")).thenReturn(Optional.of(admin));
        return jwtTokenProvider.generateAccessToken("admin-id");
    }

    private String getStaffToken() {
        User staff = User.builder()
                .id("staff-id")
                .email("staff@test.local")
                .displayName("Staff Test")
                .role(Role.STAFF)
                .isActive(true)
                .build();
        Mockito.when(userRepository.findById("staff-id")).thenReturn(Optional.of(staff));
        return jwtTokenProvider.generateAccessToken("staff-id");
    }

    private String getInactiveToken() {
        User inactive = User.builder()
                .id("inactive-id")
                .email("inactive@test.local")
                .displayName("Inactive Test")
                .role(Role.STAFF)
                .isActive(false)
                .build();
        Mockito.when(userRepository.findById("inactive-id")).thenReturn(Optional.of(inactive));
        return jwtTokenProvider.generateAccessToken("inactive-id");
    }

    @Test
    public void testPublicEndpointsNoAuthRequired() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().is(not(oneOf(401, 403))));

        mockMvc.perform(get("/api/dishes"))
                .andExpect(status().is(not(oneOf(401, 403))));

        mockMvc.perform(get("/api/tables/qr/test-qr-token"))
                .andExpect(status().is(not(oneOf(401, 403))));

        mockMvc.perform(post("/api/customer-sessions/check-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"test-token\",\"customerName\":\"Test\"}"))
                .andExpect(status().is(not(oneOf(401, 403))));

        mockMvc.perform(post("/api/orders/public/qr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tableId\":\"table1\",\"items\":[]}"))
                .andExpect(status().is(not(oneOf(401, 403))));

        mockMvc.perform(get("/api/orders/public/session/test-session-id?qrToken=test-qr-token"))
                .andExpect(status().is(not(oneOf(401, 403))));
    }

    @Test
    public void testStaffBlockedFromAdminEndpoints() throws Exception {
        String token = getStaffToken();

        mockMvc.perform(post("/api/dishes").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/dishes/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/dishes/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/categories").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/categories/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/categories/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/tables").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/tables/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/tables/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/tables/1/regenerate-qr-token").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/discounts").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/discounts/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/discounts/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/auth/register").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders/revenue/daily").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders/summary/daily").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testStaffAllowedOrderEndpoints() throws Exception {
        String token = getStaffToken();

        mockMvc.perform(get("/api/orders/manage").header("Authorization", "Bearer " + token))
                .andExpect(status().is(not(403)));

        mockMvc.perform(get("/api/orders/manage/kitchen").header("Authorization", "Bearer " + token))
                .andExpect(status().is(not(403)));

        mockMvc.perform(put("/api/orders/1/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"CONFIRMED\""))
                .andExpect(status().is(not(403)));

        mockMvc.perform(get("/api/orders/events").header("Authorization", "Bearer " + token))
                .andExpect(status().is(not(403)));
    }

    @Test
    public void testAdminAllowedAdminEndpoints() throws Exception {
        String token = getAdminToken();

        mockMvc.perform(post("/api/dishes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test Dish\",\"price\":1000}"))
                .andExpect(status().is(not(403)));

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test Category\"}"))
                .andExpect(status().is(not(403)));

        mockMvc.perform(post("/api/tables")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test Table\",\"seats\":4}"))
                .andExpect(status().is(not(403)));

        mockMvc.perform(post("/api/discounts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"TESTDISC\",\"discountPercent\":10}"))
                .andExpect(status().is(not(403)));

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().is(not(403)));

        mockMvc.perform(post("/api/auth/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"newuser@test.local\",\"password\":\"Pass@123456\",\"displayName\":\"New User\",\"role\":\"STAFF\"}"))
                .andExpect(status().is(not(403)));

        mockMvc.perform(get("/api/orders/revenue/daily").header("Authorization", "Bearer " + token))
                .andExpect(status().is(not(403)));

        mockMvc.perform(get("/api/orders/summary/daily").header("Authorization", "Bearer " + token))
                .andExpect(status().is(not(403)));
    }

    @Test
    public void testInactiveUserTokenIsBlocked() throws Exception {
        String token = getInactiveToken();

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().is(oneOf(HttpStatus.UNAUTHORIZED.value(), HttpStatus.FORBIDDEN.value())));
    }
}

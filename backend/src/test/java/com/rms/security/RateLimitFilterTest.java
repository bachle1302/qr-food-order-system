package com.rms.security;

import com.rms.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RateLimitFilterTest {

    @Autowired
    private MockMvc mockMvc;

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

    @Test
    public void testRateLimitingOnCheckIn() throws Exception {
        String testIp = "1.2.3.4";
        String checkInUrl = "/api/customer-sessions/check-in";
        String requestBody = "{\"qrToken\":\"test-token\",\"customerName\":\"Test Client\"}";

        // First request - Allowed (returns 400 or 404 since it's mock/invalid data, but not 429)
        mockMvc.perform(post(checkInUrl)
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().is(not(429)));

        // Second request - Allowed (returns 400 or 404, not 429)
        mockMvc.perform(post(checkInUrl)
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().is(not(429)));

        // Third request - Blocked (must return 429)
        mockMvc.perform(post(checkInUrl)
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().is(429))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Bạn thao tác quá nhanh")))
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    public void testRateLimitingDifferentIpsAreIndependent() throws Exception {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";
        String tableQrUrl = "/api/tables/qr/test-token";

        // Call twice for ip1 -> still allowed
        mockMvc.perform(get(tableQrUrl).header("X-Forwarded-For", ip1)).andExpect(status().is(not(429)));
        mockMvc.perform(get(tableQrUrl).header("X-Forwarded-For", ip1)).andExpect(status().is(not(429)));

        // Call 3rd time for ip1 -> 429
        mockMvc.perform(get(tableQrUrl).header("X-Forwarded-For", ip1)).andExpect(status().is(429));

        // Call for ip2 -> should be allowed since it's a different IP!
        mockMvc.perform(get(tableQrUrl).header("X-Forwarded-For", ip2)).andExpect(status().is(not(429)));
    }
}

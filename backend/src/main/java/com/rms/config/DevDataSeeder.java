package com.rms.config;

import com.rms.model.Category;
import com.rms.model.Discount;
import com.rms.model.Dish;
import com.rms.model.Role;
import com.rms.model.Table;
import com.rms.model.User;
import com.rms.repository.CategoryRepository;
import com.rms.repository.DiscountRepository;
import com.rms.repository.DishRepository;
import com.rms.repository.TableRepository;
import com.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    private static final int QR_TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final TableRepository tableRepository;
    private final CategoryRepository categoryRepository;
    private final DishRepository dishRepository;
    private final DiscountRepository discountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("Dev seed data is disabled.");
            return;
        }

        log.info("Starting dev seed data.");

        seedUsers();
        seedTables();
        seedCategories();
        seedDishes();
        seedDiscounts();

        log.info("Dev seed data completed.");
    }

    private void seedUsers() {
        seedUser("admin@qrfood.local", "Admin@123456", "Admin Demo", Role.ADMIN);
        seedUser("staff@qrfood.local", "Staff@123456", "Staff Demo", Role.STAFF);
    }

    private void seedUser(String email, String rawPassword, String displayName, Role role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .displayName(displayName)
                .role(role)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("Seeded dev user: {}", email);
    }

    private void seedTables() {
        seedTable("Bàn 1", 2);
        seedTable("Bàn 2", 4);
        seedTable("Bàn 3", 4);
        seedTable("Bàn VIP 1", 6);
    }

    private void seedTable(String name, int seats) {
        if (tableRepository.existsByName(name)) {
            return;
        }

        Table table = Table.builder()
                .name(name)
                .seats(seats)
                .qrToken(generateUniqueQrToken())
                .available(true)
                .build();

        tableRepository.save(table);
        log.info("Seeded dev table: {} seats={} qrToken={}", name, seats, table.getQrToken());
    }

    private String generateUniqueQrToken() {
        String token;
        do {
            byte[] randomBytes = new byte[QR_TOKEN_BYTES];
            SECURE_RANDOM.nextBytes(randomBytes);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        } while (tableRepository.existsByQrToken(token));

        return token;
    }

    private void seedCategories() {
        seedCategory("Khai vị", "Các món khai vị nhẹ trước bữa ăn.");
        seedCategory("Món chính", "Các món ăn chính của nhà hàng.");
        seedCategory("Đồ uống", "Nước giải khát, nước ép và cà phê.");
        seedCategory("Tráng miệng", "Các món ngọt dùng sau bữa ăn.");
        seedCategory("Combo", "Các phần ăn kết hợp món chính và đồ uống.");
    }

    private void seedCategory(String name, String description) {
        if (categoryRepository.existsByName(name)) {
            return;
        }

        Category category = Category.builder()
                .name(name)
                .description(description)
                .build();

        categoryRepository.save(category);
        log.info("Seeded dev category: {}", name);
    }

    private void seedDishes() {
        Category appetizer = categoryRepository.findByName("Khai vị").orElseThrow();
        Category mainCourse = categoryRepository.findByName("Món chính").orElseThrow();
        Category drink = categoryRepository.findByName("Đồ uống").orElseThrow();
        Category dessert = categoryRepository.findByName("Tráng miệng").orElseThrow();
        Category combo = categoryRepository.findByName("Combo").orElseThrow();

        seedDish("Salad rau củ", "Salad rau củ tươi với sốt mè rang.", 35000.0, appetizer.getId());
        seedDish("Khoai tây chiên", "Khoai tây chiên giòn dùng kèm tương cà.", 25000.0, appetizer.getId());

        seedDish("Cơm gà sốt tiêu", "Cơm gà sốt tiêu đen đậm vị.", 45000.0, mainCourse.getId());
        seedDish("Bún bò", "Bún bò nước dùng đậm đà.", 40000.0, mainCourse.getId());
        seedDish("Mì Ý bò bằm", "Mì Ý với sốt bò bằm cà chua.", 49000.0, mainCourse.getId());

        seedDish("Trà đào", "Trà đào mát lạnh.", 20000.0, drink.getId());
        seedDish("Nước cam", "Nước cam vắt tươi.", 25000.0, drink.getId());
        seedDish("Cà phê sữa", "Cà phê sữa đá pha phin.", 18000.0, drink.getId());

        seedDish("Panna cotta", "Panna cotta mềm mịn.", 30000.0, dessert.getId());
        seedDish("Chè khúc bạch", "Chè khúc bạch thanh mát.", 28000.0, dessert.getId());

        seedDish("Combo cơm gà + trà đào", "Combo cơm gà sốt tiêu và trà đào.", 59000.0, combo.getId());
        seedDish("Combo mì Ý + nước cam", "Combo mì Ý bò bằm và nước cam.", 69000.0, combo.getId());
    }

    private void seedDish(String name, String description, double price, String categoryId) {
        if (dishRepository.existsByName(name)) {
            return;
        }

        Dish dish = Dish.builder()
                .name(name)
                .description(description)
                .imageUrl("")
                .price(price)
                .categoryId(categoryId)
                .available(true)
                .build();

        dishRepository.save(dish);
        log.info("Seeded dev dish: {}", name);
    }

    private void seedDiscounts() {
        seedDiscount(
                "WELCOME10",
                "Giảm 10% cho đơn hàng đầu tiên.",
                10.0,
                100000.0,
                30000.0,
                100
        );
        seedDiscount(
                "LUNCH20",
                "Giảm 20% cho khung giờ trưa.",
                20.0,
                150000.0,
                50000.0,
                50
        );
    }

    private void seedDiscount(
            String code,
            String description,
            double discountPercent,
            double minOrderAmount,
            double maxDiscountAmount,
            int usageLimit
    ) {
        if (discountRepository.existsByCode(code)) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        Discount discount = Discount.builder()
                .code(code)
                .description(description)
                .discountPercent(discountPercent)
                .minOrderAmount(minOrderAmount)
                .maxDiscountAmount(maxDiscountAmount)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(90))
                .usageLimit(usageLimit)
                .usageCount(0)
                .active(true)
                .build();

        discountRepository.save(discount);
        log.info("Seeded dev discount: {}", code);
    }
}

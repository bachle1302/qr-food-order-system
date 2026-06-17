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
import java.util.Optional;

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

    private Category getOrCreateCategory(String name, String description) {
        return categoryRepository.findByName(name)
                .orElseGet(() -> {
                    Category category = Category.builder()
                            .name(name)
                            .description(description)
                            .build();
                    Category saved = categoryRepository.save(category);
                    log.info("Seeded dev category: {}", name);
                    return saved;
                });
    }

    private void seedCategories() {
        getOrCreateCategory("Cơm", "Các món cơm Việt thơm ngon, chắc bụng.");
        getOrCreateCategory("Bún - Phở - Mì", "Bún, phở, mì truyền thống đậm đà hương vị.");
        getOrCreateCategory("Món gà", "Các món gà chiên, gà nướng và hấp dẫn.");
        getOrCreateCategory("Món bò", "Bò lúc lắc, bò né, bò kho đậm vị.");
        getOrCreateCategory("Món heo", "Thịt heo quay giòn, sườn nướng BBQ.");
        getOrCreateCategory("Hải sản", "Hải sản tươi ngon chế biến đa dạng.");
        getOrCreateCategory("Lẩu", "Các món lẩu nóng hổi cho cả gia đình.");
        getOrCreateCategory("Nướng", "Các món nướng xèo xèo thơm phức.");
        getOrCreateCategory("Ăn vặt", "Khoai tây chiên, nem chua rán ăn kèm.");
        getOrCreateCategory("Rau - Salad", "Rau xào tỏi, salad thanh mát.");
        getOrCreateCategory("Đồ uống", "Nước ngọt, nước ép trái cây giải khát.");
        getOrCreateCategory("Trà sữa", "Trà sữa nhiều vị kết hợp trân châu.");
        getOrCreateCategory("Cà phê", "Cà phê pha phin đậm chất Việt.");
        getOrCreateCategory("Tráng miệng", "Các món chè, bánh ngọt nhẹ nhàng.");
    }

    private void createDishIfMissing(String name, String description, double price, String categoryId) {
        Optional<Dish> existingOpt = dishRepository.findByName(name);
        if (existingOpt.isPresent()) {
            Dish existing = existingOpt.get();
            // Force update all seeded image URLs so we can redistribute them uniquely
            existing.setImageUrl(getFoodImageUrl(name));
            dishRepository.save(existing);
            log.info("Refreshed image for existing dish: {}", name);
            return;
        }

        Dish dish = Dish.builder()
                .name(name)
                .description(description)
                .imageUrl(getFoodImageUrl(name))
                .price(price)
                .categoryId(categoryId)
                .available(true)
                .build();

        dishRepository.save(dish);
        log.info("Seeded dev dish: {}", name);
    }

    private String getFoodImageUrl(String name) {
        String lower = name.toLowerCase();
        int hash = Math.abs(name.hashCode());

        String[] cơm = {
            "1512058564366-18510be2db19",
            "1541832676-9b763b0239ab",
            "1546069901-ba9599a7e63c",
            "1600891964599-f61ba0e24092",
            "1626082927389-6cd097cdc6ec"
        };
        String[] mì_bún = {
            "1582878826629-29b7ad1cdc43",
            "1625398407796-82650a8c135f",
            "1569718212165-3a8278d5f624",
            "1585032226651-759b368d7246",
            "1617093727343-374698b1b08d",
            "1552611052-33e04de081de"
        };
        String[] gà = {
            "1569058242253-92a9c755a0ec",
            "1604503468506-a8da13d82791",
            "1598515214211-89d3c73ae83b",
            "1626082927389-6cd097cdc6ec",
            "1562967914-608f82629a8a"
        };
        String[] bò = {
            "1600891964599-f61ba0e24092",
            "1544025162-d76694265947",
            "1558030006-450675393462",
            "1603048588665-791ca8aea617",
            "1514516345957-556ca7d90a29"
        };
        String[] heo = {
            "1602489114781-42dbb9ea9ff9",
            "1532550907401-a500c9a57435",
            "1624462966581-bc6d768cbce5",
            "1544025162-d76694265947"
        };
        String[] hải_sản = {
            "1565557623262-b51c2513a641",
            "1519708227418-c8fd9a32b7a2",
            "1534422298391-e4f8c172dddb",
            "1559737221-7a2d09d038ac",
            "1615141982883-c7ad0e69fd62"
        };
        String[] lẩu = {
            "1547928500-300fc8e22330",
            "1555126634-323283e090fa",
            "1563245372-f21724e3856d"
        };
        String[] nướng = {
            "1555939594-58d7cb561ad1",
            "1482049016688-2d3e1b311543",
            "1529193591184-b1d58069ecdd"
        };
        String[] ăn_vặt = {
            "1573080496219-bb080dd4f877",
            "1607330289024-1535c6b4e1c1",
            "1581263750988-d31671958cfd",
            "1534308983496-4fabb1a015ee",
            "1541532713592-79a0317b6b77"
        };
        String[] rau_salad = {
            "1512621776951-a57141f2eefd",
            "1540420773420-3366772f4999",
            "1623428187969-5da2d87e0af9",
            "1546069901-ba9599a7e63c"
        };
        String[] trà_sữa = {
            "1541658016709-82535e94bc69",
            "1507133750040-4a8f57021571",
            "1596797038530-2c107229654b"
        };
        String[] cà_phê = {
            "1509042239860-f550ce710b93",
            "1514432324607-a09d9b4aefdd",
            "1541167760496-1628856ab772",
            "1497515114629-f71d768fd07c",
            "1578314675249-a6910f80cc4e"
        };
        String[] nước_ngọt = {
            "1622483767028-3f66f32aef97",
            "1513558161293-cdaf765ed2fd"
        };
        String[] trà_cam_chanh = {
            "1556679343-c7306c1976bc",
            "1600271886742-f049cd451bba",
            "1595981267035-7b04ca84a82d",
            "1536935338788-846bb9981813"
        };
        String[] tráng_miệng = {
            "1551024601-bec78aea704b",
            "1587314168485-3236d6710814",
            "1563729784474-d77dbb933a9e",
            "1579372786545-d24232daf58c",
            "1551024709-8f23befc6f87"
        };

        String photoId = "1546069901-ba9599a7e63c"; // fallback

        if (lower.contains("trà sữa") || lower.contains("hồng trà") || lower.contains("ô long")) {
            photoId = trà_sữa[hash % trà_sữa.length];
        } else if (lower.contains("cà phê") || lower.contains("bạc xỉu") || lower.contains("cappuccino") || lower.contains("latte") || lower.contains("americano") || lower.contains("cold brew")) {
            photoId = cà_phê[hash % cà_phê.length];
        } else if (lower.contains("coca") || lower.contains("pepsi") || lower.contains("sprite") || lower.contains("nước suối")) {
            photoId = nước_ngọt[hash % nước_ngọt.length];
        } else if (lower.contains("trà đào") || lower.contains("trà chanh") || lower.contains("nước cam") || lower.contains("chanh dây") || lower.contains("sinh tố")) {
            photoId = trà_cam_chanh[hash % trà_cam_chanh.length];
        } else if (lower.contains("bánh flan") || lower.contains("chè") || lower.contains("sữa chua") || lower.contains("kem") || lower.contains("panna cotta") || lower.contains("tiramisu")) {
            photoId = tráng_miệng[hash % tráng_miệng.length];
        } else if (lower.contains("phở") || lower.contains("bún") || lower.contains("hủ tiếu") || lower.contains("miến") || lower.contains("mì xào")) {
            photoId = mì_bún[hash % mì_bún.length];
        } else if (lower.contains("cơm")) {
            photoId = cơm[hash % cơm.length];
        } else if (lower.contains("gà")) {
            photoId = gà[hash % gà.length];
        } else if (lower.contains("bò")) {
            photoId = bò[hash % bò.length];
        } else if (lower.contains("sườn nướng") || lower.contains("ba chỉ nướng") || lower.contains("sườn cây")) {
            photoId = nướng[hash % nướng.length];
        } else if (lower.contains("heo") || lower.contains("ba chỉ") || lower.contains("sườn") || lower.contains("thịt kho")) {
            photoId = heo[hash % heo.length];
        } else if (lower.contains("tôm") || lower.contains("mực") || lower.contains("cua") || lower.contains("nghêu") || lower.contains("hàu") || lower.contains("cá hồi") || lower.contains("bạch tuộc") || lower.contains("hải sản")) {
            photoId = hải_sản[hash % hải_sản.length];
        } else if (lower.contains("lẩu")) {
            photoId = lẩu[hash % lẩu.length];
        } else if (lower.contains("nướng")) {
            photoId = nướng[hash % nướng.length];
        } else if (lower.contains("khoai") || lower.contains("nem") || lower.contains("phô mai") || lower.contains("tokbokki") || lower.contains("xúc xích") || lower.contains("viên chiên")) {
            photoId = ăn_vặt[hash % ăn_vặt.length];
        } else if (lower.contains("salad") || lower.contains("rau") || lower.contains("cải") || lower.contains("đậu hũ") || lower.contains("nấm")) {
            photoId = rau_salad[hash % rau_salad.length];
        }

        return "https://images.unsplash.com/photo-" + photoId + "?auto=format&fit=crop&w=600&q=80";
    }

    private void seedDishes() {
        Category com = getOrCreateCategory("Cơm", "Các món cơm Việt thơm ngon, chắc bụng.");
        Category bunPhoMi = getOrCreateCategory("Bún - Phở - Mì", "Bún, phở, mì truyền thống đậm đà hương vị.");
        Category monGa = getOrCreateCategory("Món gà", "Các món gà chiên, gà nướng và hấp dẫn.");
        Category monBo = getOrCreateCategory("Món bò", "Bò lúc lắc, bò né, bò kho đậm vị.");
        Category monHeo = getOrCreateCategory("Món heo", "Thịt heo quay giòn, sườn nướng BBQ.");
        Category haiSan = getOrCreateCategory("Hải sản", "Hải sản tươi ngon chế biến đa dạng.");
        Category lau = getOrCreateCategory("Lẩu", "Các món lẩu nóng hổi cho cả gia đình.");
        Category nuong = getOrCreateCategory("Nướng", "Các món nướng xèo xèo thơm phức.");
        Category anVat = getOrCreateCategory("Ăn vặt", "Khoai tây chiên, nem chua rán ăn kèm.");
        Category rauSalad = getOrCreateCategory("Rau - Salad", "Rau xào tỏi, salad thanh mát.");
        Category doUong = getOrCreateCategory("Đồ uống", "Nước ngọt, nước ép trái cây giải khát.");
        Category traSua = getOrCreateCategory("Trà sữa", "Trà sữa nhiều vị kết hợp trân châu.");
        Category caPhe = getOrCreateCategory("Cà phê", "Cà phê pha phin đậm chất Việt.");
        Category trangMieng = getOrCreateCategory("Tráng miệng", "Các món chè, bánh ngọt nhẹ nhàng.");

        // Cơm
        createDishIfMissing("Cơm gà xối mỡ", "Cơm chiên vàng giòn ăn kèm đùi gà xối mỡ giòn rụm.", 65000.0, com.getId());
        createDishIfMissing("Cơm gà sốt teriyaki", "Cơm trắng dẻo thơm kèm thịt đùi gà sốt Nhật đậm đà.", 60000.0, com.getId());
        createDishIfMissing("Cơm sườn nướng", "Cơm tấm hạt nhuyễn dùng kèm sườn cốt lết nướng mật ong.", 55000.0, com.getId());
        createDishIfMissing("Cơm bò lúc lắc", "Bò cắt khối xào cùng hành tây, ớt chuông, kèm cơm chiên tỏi.", 85000.0, com.getId());
        createDishIfMissing("Cơm cá kho tộ", "Cơm niêu nóng hổi ăn kèm cá lóc kho tộ đậm đà.", 75000.0, com.getId());
        createDishIfMissing("Cơm chiên hải sản", "Cơm chiên tơi xốp cùng tôm, mực và rau củ.", 69000.0, com.getId());
        createDishIfMissing("Cơm chiên dương châu", "Món cơm chiên kinh điển với lạp sườn, xá xíu, đậu Hà Lan.", 59000.0, com.getId());
        createDishIfMissing("Cơm tấm đặc biệt", "Cơm tấm sườn, bì, chả và trứng ốp la béo ngậy.", 79000.0, com.getId());

        // Bún - Phở - Mì
        createDishIfMissing("Phở bò tái", "Nước dùng thanh ngọt từ xương ống, bò tái mềm thơm.", 55000.0, bunPhoMi.getId());
        createDishIfMissing("Phở bò chín", "Nước dùng thanh ngọt, thịt nạm bò chín mềm vừa ăn.", 55000.0, bunPhoMi.getId());
        createDishIfMissing("Phở gà", "Bánh phở mềm cùng thịt gà ta xé phay dai ngọt thơm lá chanh.", 50000.0, bunPhoMi.getId());
        createDishIfMissing("Bún bò Huế", "Nước lèo đậm đà cay nồng mùi sả ớt, kèm móng giò, chả cua.", 65000.0, bunPhoMi.getId());
        createDishIfMissing("Bún chả Hà Nội", "Thịt băm viên nướng than hoa, dùng kèm nước mắm đu đủ chua ngọt.", 60000.0, bunPhoMi.getId());
        createDishIfMissing("Bún thịt nướng", "Bún ăn kèm thịt heo nướng, nem nướng, rau sống và nước mắm chua ngọt.", 55000.0, bunPhoMi.getId());
        createDishIfMissing("Mì xào bò", "Mì trứng xào cùng thịt bò phi lê và cải ngọt giòn mát.", 65000.0, bunPhoMi.getId());
        createDishIfMissing("Mì xào hải sản", "Mì trứng xào tôm, mực dai giòn và rau củ thập cẩm.", 70000.0, bunPhoMi.getId());
        createDishIfMissing("Miến gà", "Miến dong dai mềm chan nước dùng gà thanh ngọt.", 50000.0, bunPhoMi.getId());
        createDishIfMissing("Hủ tiếu Nam Vang", "Hủ tiếu khô hoặc nước với tôm, gan heo, thịt băm hấp dẫn.", 60000.0, bunPhoMi.getId());

        // Món gà
        createDishIfMissing("Gà rang muối", "Thịt gà chiên vàng xóc đều với bột muối thơm bùi.", 120000.0, monGa.getId());
        createDishIfMissing("Gà chiên mắm", "Cánh gà chiên giòn rụm áo sốt nước mắm tỏi ớt kẹo ngọt.", 95000.0, monGa.getId());
        createDishIfMissing("Gà nướng mật ong", "Thịt gà ướp mật ong rừng nướng vàng óng, thơm phức.", 150000.0, monGa.getId());
        createDishIfMissing("Cánh gà chiên giòn", "Cánh gà tẩm bột chiên xù giòn tan bên ngoài, mọng nước bên trong.", 80000.0, monGa.getId());
        createDishIfMissing("Đùi gà sốt cay", "Đùi gà chiên giòn rưới sốt cay nồng kiểu Hàn Quốc.", 85000.0, monGa.getId());
        createDishIfMissing("Gà sốt phô mai", "Thịt ức gà cắt viên chiên giòn phủ lớp phô mai kéo sợi béo ngậy.", 110000.0, monGa.getId());
        createDishIfMissing("Gà hấp lá chanh", "Gà ta hấp chín tới, da vàng giòn thơm hương lá chanh.", 180000.0, monGa.getId());
        createDishIfMissing("Gà popcorn", "Gà viên không xương tẩm vị chiên giòn vừa miệng.", 49000.0, monGa.getId());

        // Món bò
        createDishIfMissing("Bò lúc lắc", "Bò cắt khối xào cùng hành tây, ớt chuông, kèm cơm chiên tỏi.", 85000.0, monBo.getId());
        createDishIfMissing("Bò sốt tiêu đen", "Thịt bò phi lê xào sốt tiêu đen cay nồng ấm nóng.", 140000.0, monBo.getId());
        createDishIfMissing("Bò xào hành cần", "Thịt bò xào nhanh tay với hành tây và cần tây giòn ngọt.", 95000.0, monBo.getId());
        createDishIfMissing("Bò né", "Bò bít tết bản Việt trên chảo gang nóng hổi kèm trứng, patê.", 85000.0, monBo.getId());
        createDishIfMissing("Bò kho bánh mì", "Bò nạm hầm nhừ với cà rốt thơm hương thảo mộc, kèm bánh mì đặc ruột.", 75000.0, monBo.getId());
        createDishIfMissing("Bò cuộn nấm kim châm", "Ba chỉ bò Mỹ cuộn nấm kim châm nướng sốt BBQ.", 110000.0, monBo.getId());
        createDishIfMissing("Bò nướng lá lốt", "Thịt bò băm ướp gia vị cuộn lá lốt nướng thơm ngào ngạt.", 90000.0, monBo.getId());

        // Món heo
        createDishIfMissing("Sườn nướng BBQ", "Sườn heo non nướng sốt BBQ đậm đà chuẩn vị.", 165000.0, monHeo.getId());
        createDishIfMissing("Thịt kho trứng", "Thịt ba chỉ kho tàu mềm rục cùng trứng vịt thấm đẫm nước dừa.", 75000.0, monHeo.getId());
        createDishIfMissing("Ba chỉ rang cháy cạnh", "Thịt ba chỉ rang sém cạnh thơm mùi hành tỏi.", 65000.0, monHeo.getId());
        createDishIfMissing("Heo quay giòn bì", "Thịt heo quay da giòn rụm ăn kèm củ kiệu dưa muối.", 95000.0, monHeo.getId());
        createDishIfMissing("Nem nướng", "Nem lụi nướng than hoa cuộn bánh tráng và rau sống.", 80000.0, monHeo.getId());
        createDishIfMissing("Xúc xích Đức", "Xúc xích Đức nướng xém da thơm bùi béo ngậy.", 55000.0, monHeo.getId());
        createDishIfMissing("Sườn non rim mặn", "Sườn non heo chặt nhỏ rim nước màu dừa mặn ngọt đưa cơm.", 85000.0, monHeo.getId());

        // Hải sản
        createDishIfMissing("Tôm rang muối", "Tôm sú tươi chiên giòn xóc muối ớt Hong Kong cay mặn.", 185000.0, haiSan.getId());
        createDishIfMissing("Tôm sốt bơ tỏi", "Tôm sú xào bơ tỏi thơm ngậy béo bùi.", 180000.0, haiSan.getId());
        createDishIfMissing("Mực chiên giòn", "Mực ống cắt khoanh tẩm bột chiên xù giòn tan.", 135000.0, haiSan.getId());
        createDishIfMissing("Mực xào sa tế", "Mực tươi xào sa tế cay nồng giòn sần sật.", 140000.0, haiSan.getId());
        createDishIfMissing("Cá hồi áp chảo", "File cá hồi áp chảo sốt chanh leo chua ngọt tinh tế.", 220000.0, haiSan.getId());
        createDishIfMissing("Nghêu hấp sả", "Nghêu hấp sả ớt cay nồng ấm bụng, nước nghêu ngọt lịm.", 75000.0, haiSan.getId());
        createDishIfMissing("Hàu nướng mỡ hành", "Hàu sữa tươi nướng mỡ hành, đậu phộng rang béo ngậy.", 95000.0, haiSan.getId());
        createDishIfMissing("Cua rang me", "Cua thịt chắc ngọt xào sốt me chua cay đậm đà.", 320000.0, haiSan.getId());

        // Lẩu
        createDishIfMissing("Lẩu Thái hải sản", "Nước lẩu chua cay đậm đà kèm tôm, mực, nghêu và rau nấm tươi.", 280000.0, lau.getId());
        createDishIfMissing("Lẩu bò nhúng giấm", "Thịt bò tươi thái mỏng nhúng nước giấm chua ngọt thanh mát.", 290000.0, lau.getId());
        createDishIfMissing("Lẩu gà lá é", "Đặc sản lẩu gà tre thơm nồng vị lá é tươi.", 260000.0, lau.getId());
        createDishIfMissing("Lẩu riêu cua bắp bò", "Lẩu riêu cua đồng gạch béo ngậy nhúng kèm bắp bò hoa.", 320000.0, lau.getId());
        createDishIfMissing("Lẩu kim chi", "Lẩu kim chi chua cay cay nhúng ba chỉ heo và đậu hũ non.", 240000.0, lau.getId());
        createDishIfMissing("Lẩu nấm chay", "Nước dùng rau củ thanh đạm cùng các loại nấm tươi bổ dưỡng.", 195000.0, lau.getId());
        createDishIfMissing("Lẩu cá kèo", "Lẩu cá kèo lá giang chua thanh đặc trưng miền Tây Nam Bộ.", 230000.0, lau.getId());

        // Nướng
        createDishIfMissing("Ba chỉ bò nướng", "Thịt ba chỉ bò Mỹ thái mỏng nướng sốt mật ong.", 125000.0, nuong.getId());
        createDishIfMissing("Ba chỉ heo nướng", "Ba chỉ heo dày miếng nướng muối ớt cay xè.", 95000.0, nuong.getId());
        createDishIfMissing("Sườn cây nướng", "Sườn heo nguyên cây nướng sốt ướp đặc biệt.", 155000.0, nuong.getId());
        createDishIfMissing("Xiên que thập cẩm", "Thịt xiên nướng xen kẽ ớt chuông, hành tây bắt mắt.", 75000.0, nuong.getId());
        createDishIfMissing("Tôm nướng muối ớt", "Tôm sú xiên que nướng muối ớt giòn rụm cay cay.", 145000.0, nuong.getId());
        createDishIfMissing("Mực nướng sa tế", "Mực lá nguyên con nướng sa tế cay đậm vị.", 165000.0, nuong.getId());
        createDishIfMissing("Bạch tuộc nướng", "Bạch tuộc nướng sa tế giòn sần sật dai ngọt.", 135000.0, nuong.getId());
        createDishIfMissing("Rau củ nướng", "Đậu bắp, cà tím, bắp ngọt nướng mỡ hành thanh đạm.", 45000.0, nuong.getId());

        // Ăn vặt
        createDishIfMissing("Khoai tây chiên", "Khoai tây chiên giòn dùng kèm tương cà.", 25000.0, anVat.getId());
        createDishIfMissing("Khoai lang kén", "Khoai lang nghiền trộn cốt dừa chiên vàng giòn thơm bùi.", 30000.0, anVat.getId());
        createDishIfMissing("Nem chua rán", "Nem chua tẩm bột chiên giòn rụm nóng hổi chuẩn phố cổ.", 45000.0, anVat.getId());
        createDishIfMissing("Phô mai que", "Phô mai mozzarella tẩm xù chiên giòn kéo sợi béo ngậy.", 40000.0, anVat.getId());
        createDishIfMissing("Xúc xích chiên", "Xúc xích đỏ chiên hoa khế ăn kèm tương ớt.", 30000.0, anVat.getId());
        createDishIfMissing("Gà viên chiên", "Gà viên chiên thơm mùi gia vị đậm đà.", 35000.0, anVat.getId());
        createDishIfMissing("Cá viên chiên", "Cá viên chiên dai giòn xóc tỏi ớt sa tế.", 25000.0, anVat.getId());
        createDishIfMissing("Bánh gạo cay", "Bánh gạo tokbokki xào sốt ớt cay Hàn Quốc.", 49000.0, anVat.getId());
        createDishIfMissing("Tokbokki phô mai", "Bánh gạo xào sốt cay phủ lớp phô mai chảy béo ngậy.", 59000.0, anVat.getId());

        // Rau - Salad
        createDishIfMissing("Salad rau củ", "Salad rau củ tươi với sốt mè rang.", 35000.0, rauSalad.getId());
        createDishIfMissing("Salad cá ngừ", "Salad rau xà lách tươi trộn cá ngừ ngâm dầu béo ngậy.", 55000.0, rauSalad.getId());
        createDishIfMissing("Salad gà áp chảo", "Ức gà áp chảo thơm mềm trộn rau xà lách, sốt dầu giấm.", 60000.0, rauSalad.getId());
        createDishIfMissing("Salad bò", "Thịt bò phi lê xào tái trộn rau mầm và cà chua bi.", 75000.0, rauSalad.getId());
        createDishIfMissing("Rau muống xào tỏi", "Rau muống xanh giòn xào tỏi phi thơm lừng.", 35000.0, rauSalad.getId());
        createDishIfMissing("Cải thìa xào nấm", "Cải thìa ngọt mát xào cùng nấm đông cô sốt dầu hào.", 45000.0, rauSalad.getId());
        createDishIfMissing("Đậu hũ sốt nấm", "Đậu hũ non hấp nóng sốt nấm đông cô, hành lá thanh đạm.", 49000.0, rauSalad.getId());
        createDishIfMissing("Nấm xào thập cẩm", "Nấm đùi gà, nấm kim châm xào cùng rau củ quả ngọt mát.", 55000.0, rauSalad.getId());

        // Đồ uống
        createDishIfMissing("Coca Cola", "Nước ngọt Coca Cola lon 320ml mát lạnh.", 15000.0, doUong.getId());
        createDishIfMissing("Pepsi", "Nước ngọt Pepsi lon 320ml sảng khoái.", 15000.0, doUong.getId());
        createDishIfMissing("Sprite", "Nước ngọt vị chanh Sprite lon 320ml sảng khoái.", 15000.0, doUong.getId());
        createDishIfMissing("Nước suối", "Nước khoáng tinh khiết đóng chai 500ml thanh mát.", 10000.0, doUong.getId());
        createDishIfMissing("Trà đào cam sả", "Trà đào thơm nức kết hợp cam tươi và hương sả nồng nàn.", 35000.0, doUong.getId());
        createDishIfMissing("Trà chanh", "Trà đen pha chanh tươi đường phèn chua ngọt mát lạnh.", 18000.0, doUong.getId());
        createDishIfMissing("Nước cam", "Nước cam vắt tươi.", 25000.0, doUong.getId());
        createDishIfMissing("Chanh dây", "Nước cốt chanh dây chua chua ngọt ngọt thơm mát mát.", 25000.0, doUong.getId());
        createDishIfMissing("Sinh tố xoài", "Xoài chín thơm xay nhuyễn với sữa đặc béo ngậy.", 39000.0, doUong.getId());
        createDishIfMissing("Sinh tố bơ", "Bơ sáp Đắk Lắk xay sữa đặc ngậy béo ngất ngây.", 45000.0, doUong.getId());

        // Trà sữa
        createDishIfMissing("Trà sữa truyền thống", "Hồng trà pha sữa béo ngậy đậm hương vị trà truyền thống.", 30000.0, traSua.getId());
        createDishIfMissing("Trà sữa trân châu đường đen", "Sữa tươi béo ngậy hòa quyện trân châu đường đen dẻo ngọt.", 45000.0, traSua.getId());
        createDishIfMissing("Trà sữa matcha", "Trà sữa vị matcha Nhật Bản thơm mát thanh thanh.", 35000.0, traSua.getId());
        createDishIfMissing("Trà sữa socola", "Trà sữa vị socola đậm đà ngọt đắng lôi cuốn.", 35000.0, traSua.getId());
        createDishIfMissing("Trà sữa khoai môn", "Trà sữa vị khoai môn bùi bùi thơm béo ngọt dịu.", 38000.0, traSua.getId());
        createDishIfMissing("Hồng trà sữa", "Hồng trà thơm nồng kết hợp sữa béo ngậy ngon tuyệt.", 32000.0, traSua.getId());
        createDishIfMissing("Ô long sữa", "Trà ô long thơm đậm kết hợp sữa béo dịu dàng tinh tế.", 35000.0, traSua.getId());
        createDishIfMissing("Trà sữa kem cheese", "Trà sữa truyền thống phủ lớp kem cheese mặn béo ngậy.", 45000.0, traSua.getId());

        // Cà phê
        createDishIfMissing("Cà phê đen đá", "Cà phê Robusta nguyên chất pha phin đậm vị truyền thống.", 20000.0, caPhe.getId());
        createDishIfMissing("Cà phê sữa đá", "Cà phê sữa đá pha phin.", 18000.0, caPhe.getId());
        createDishIfMissing("Bạc xỉu", "Sữa đặc pha cà phê Robusta thơm béo ngậy.", 25000.0, caPhe.getId());
        createDishIfMissing("Cappuccino", "Cà phê Espresso pha sữa nóng phủ lớp bọt mịn màng nghệ thuật.", 39000.0, caPhe.getId());
        createDishIfMissing("Latte", "Cà phê Espresso sữa nóng béo ngậy nhẹ nhàng dễ uống.", 39000.0, caPhe.getId());
        createDishIfMissing("Americano", "Cà phê Espresso pha loãng mát lạnh sảng khoái ngày mới.", 29000.0, caPhe.getId());
        createDishIfMissing("Cold brew", "Cà phê ủ lạnh thanh mát mang hương hoa quả tự nhiên.", 45000.0, caPhe.getId());
        createDishIfMissing("Cà phê muối", "Sự kết hợp độc đáo giữa cà phê phin đậm đà và kem muối mặn béo ngậy.", 35000.0, caPhe.getId());

        // Tráng miệng
        createDishIfMissing("Bánh flan", "Bánh flan mềm mịn thơm hương trứng sữa caramel ngọt đắng nhẹ.", 20000.0, trangMieng.getId());
        createDishIfMissing("Chè khúc bạch", "Chè khúc bạch thanh mát.", 28000.0, trangMieng.getId());
        createDishIfMissing("Chè thái", "Chè thái sầu riêng ngập tràn thạch, mít tươi, nước cốt dừa béo.", 35000.0, trangMieng.getId());
        createDishIfMissing("Sữa chua nếp cẩm", "Sữa chua nếp cẩm dẻo bùi thơm ngon tốt cho tiêu hóa.", 30000.0, trangMieng.getId());
        createDishIfMissing("Kem vani", "Kem vani viên mát lạnh ngọt ngào.", 22000.0, trangMieng.getId());
        createDishIfMissing("Kem socola", "Kem socola đậm đà sảng khoái.", 22000.0, trangMieng.getId());
        createDishIfMissing("Panna cotta", "Panna cotta mềm mịn.", 30000.0, trangMieng.getId());
        createDishIfMissing("Tiramisu", "Bánh Tiramisu mềm mịn thơm hương cà phê và rượu nhẹ nhàng.", 45000.0, trangMieng.getId());
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

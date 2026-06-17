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

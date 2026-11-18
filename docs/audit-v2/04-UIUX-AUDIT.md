# 04. BÁO CÁO KIỂM TOÁN GIAO DIỆN VÀ TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX FULL AUDIT)

**Dự án:** Gia Phả OS (Gia Phả Họ Chu)  
**Tiêu chuẩn đánh giá:** Hiện đại, Tinh tế, Đậm tính văn hóa gia tộc Việt Nam, Tối ưu cho người cao tuổi và thiết bị di động (Accessibility & Mobile-first).

---

## 1. KIỂM TOÁN THIẾT KẾ TRỰC QUAN (VISUAL DESIGN AUDIT)

### 1.1. Hệ thống Design Tokens hiện tại (DESIGN.md)
Codebase hiện áp dụng bảng màu và kiểu chữ được định nghĩa tại `DESIGN.md`:
- **Bảng màu (Color Palette):**
  - Primary (Màu chính): `#1c1917` (Stone-900: Đá trầm cổ kính, trang nghiêm).
  - Secondary (Màu phụ): `#57534e` (Stone-600: Xám ấm, dễ đọc).
  - Tertiary (Nhấn văn hóa): `#d97706` (Amber-600: Hổ phách, hoàng thổ truyền thống).
  - Neutral (Màu nền): `#fafaf9` (Stone-50: Trắng ngà, mô phỏng màu giấy dó).
  - Surface: `#ffffff` (Trắng tinh khiết cho thẻ card).
  - Border: `#e7e5e4` (Stone-200: Đường viền nhẹ nhàng, không gắt).
  - Error: `#dc2626` (Red-600: Cảnh báo).
- **Typography:**
  - Tiêu đề (Headlines): Font *Playfair Display* (Serif cổ điển, trang trọng).
  - Nội dung & Thẻ (Body & Labels): Font *Inter* (Sans-serif hiện đại, độ rõ nét cao).
- **Đánh giá thẩm mỹ:**
  - *Ưu điểm:* Bộ màu rất phù hợp với sản phẩm văn hóa, không bị lòe loẹt "AI-slop", tạo cảm giác ấm áp và tôn nghiêm của dòng tộc.
  - *Nhược điểm:* Font size mặc định ở một số nơi (`body-sm: 14px`, label `12px - 14px`) còn hơi nhỏ đối với các cụ cao niên khi đọc trên máy tính bảng hoặc điện thoại. Tỷ lệ tương phản một số nhãn ngày tháng màu xám nhạt chưa đạt chuẩn WCAG AAA.

### 1.2. Khả năng tiếp cận đối với Người cao tuổi (Elderly Accessibility)
1. **Kích thước điểm chạm (Touch Targets):**
   - Nút thu gọn nhánh cây `TreeExpandToggle` có kích thước `size-6` (24x24px). Chuẩn WCAG 2.2 khuyến nghị tối thiểu 44x44px trên thiết bị cảm ứng. Các cụ bấm ngón tay trên điện thoại rất dễ bấm trượt vào node thẻ thành viên bên cạnh.
2. **Cỡ chữ & Độ tương phản (Font Scale & Contrast):**
   - Cần bổ sung nút chuyển đổi cỡ chữ nhanh (Chế độ đọc chữ lớn: A- / A+) trên thanh công cụ cho người cao tuổi.
   - Các thông tin quan trọng như "Ngày giỗ âm lịch", "Nơi an táng" cần có màu sắc nhận diện riêng biệt, không để lẫn với chữ ghi chú thông thường.

---

## 2. KIỂM TOÁN KIẾN TRÚC THÔNG TIN (INFORMATION ARCHITECTURE - IA)

### 2.1. Vấn đề nghiêm trọng ở Menu Điều Hướng (Navigation Bottleneck)
- **Bằng chứng thực tế trong mã nguồn (`components/HeaderMenu.tsx` & `components/DashboardHeader.tsx`):**
  - Thanh Header chỉ có Logo, Ô tìm kiếm, Nút chuyển ngôn ngữ và một Nút Avatar tròn góc phải.
  - Toàn bộ danh mục tính năng chính (Bảng tin, Cây gia phả, Tìm xưng hô, Phả ký, Thống kê, Quản trị) **bị giấu hoàn toàn bên trong Pop-up Menu khi bấm vào Avatar**.
  - Hai chức năng quan trọng là **Sự kiện / Lịch giỗ (`/dashboard/events`)** và **Phòng trưng bày tư liệu (`/dashboard/gallery`)** thậm chí **KHÔNG HỀ CÓ TRONG MENU POP-UP**, người dùng chỉ có thể tìm thấy nếu tình cờ cuộn màn hình trang chủ Dashboard để thấy các thẻ liên kết.
- **Tác động đến người dùng:**
  - Người dùng mới hoặc người lớn tuổi vào ứng dụng hoàn toàn không biết hệ thống có những tính năng gì, gây cảm giác ứng dụng "trống rỗng" và khó thao tác.

### 2.2. Đề xuất Kiến trúc Điều hướng Mới V2
Chuyển đổi từ mô hình Pop-up sang **Top Navigation Bar phân tầng kết hợp Mobile Bottom Navigation Bar**:
- **Thanh Menu Chính (Luôn hiển thị trên Desktop):**
  1. *Trang chủ (Tổng quan dòng họ)*
  2. *Cây gia phả (Xem cây, danh sách, sơ đồ)*
  3. *Chi nhánh (Danh sách các chi phái họ Chu)*
  4. *Lịch giỗ & Sự kiện (Giỗ tết âm lịch, việc họ)*
  5. *Nhà truyền thống (Lịch sử, nhà thờ tổ, tư liệu, ảnh)*
  6. *Tra cứu xưng hô (Tìm danh xưng)*
  7. *Phả ký (In ấn gia phả thành sách)*
- **Menu Quản trị (Dành riêng cho Admin/Trưởng chi):**
  - Đề xuất chỉnh sửa (Phê duyệt yêu cầu từ thành viên).
  - Quản lý thành viên & Chi nhánh.
  - Số hóa gia phả giấy (OCR/AI Staging).
  - Sao lưu, kiểm tra dữ liệu & Cài đặt hệ thống.
- **Thanh Bottom Tab Bar (Tối ưu cho Mobile):**
  - 5 tab cố định: [Cây Gia Phả] - [Chi Nhánh] - [Lịch Giỗ] - [Tìm Kiếm] - [Cá Nhân/Menu].

---

## 3. KIỂM TOÁN TRẢI NGHIỆM CÂY GIA PHẢ (FAMILY TREE UX)

### 3.1. Điểm mạnh hiện tại (Strengths)
1. Cơ chế Pan/Zoom qua `usePanZoom` hỗ trợ chuột, bánh xe cuộn, bàn phím (`+`, `-`, phím mũi tên) và cảm ứng đa điểm (pinch-to-zoom) mượt mà.
2. Xử lý logic gập nhánh (`autoCollapseLevel`) giúp cây không bị tràn toàn bộ ngay lần vẽ đầu tiên.
3. Hỗ trợ hiển thị nhiều vợ/chồng trên cùng một hàng ngang với các biểu tượng nhẫn cưới và dấu liên kết tinh tế (`FamilyTreeNodeRenderer.tsx`).
4. Hỗ trợ bộ lọc hiển thị nhanh: Ẩn dâu, Ẩn rể, Ẩn con gái, Ẩn con trai, Ẩn ảnh đại diện để tiết kiệm diện tích màn hình.

### 3.2. Điểm yếu & Hạn chế cần khắc phục (Weaknesses)
1. **Chưa có tính năng Focus & Đi theo nhánh trực hệ (Trace Ancestry Path):**
   - Khi bấm vào một thành viên ở đời thứ 10, người dùng không có nút để "Làm nổi bật đường nối về Thủy Tổ" hoặc "Thu gọn mọi nhánh khác chỉ giữ lại nhánh của người này".
2. **Hiển thị trên màn hình điện thoại khổ dọc (Portrait Mobile Display):**
   - Cây phả hệ phân nhánh theo chiều ngang (Horizontal expansion) khiến trên màn hình điện thoại người dùng phải vuốt ngang liên tục rất mỏi tay.
   - Chưa có chế độ xem Cây dọc dạng Thác nước (Vertical Cascade Tree) tối ưu riêng cho smartphone.
3. **Hiệu năng khi dòng họ đạt 1.000 - 5.000 thành viên:**
   - Việc tạo hàng ngàn phần tử HTML DOM kèm hàm đo chiều cao đồng bộ `equalizeNodeHeights` trước mỗi lần vẽ (`useLayoutEffect`) sẽ gây hiện tượng Layout Thrashing (giật khung hình) khi người dùng mở rộng nhiều nhánh cùng lúc.

---

## 4. CHI TIẾT AUDIT TỪNG MÀN HÌNH CHÍNH & PHƯƠNG ÁN NÂNG CẤP V2

---

### MÀN HÌNH 01: Trang chủ / Landing Page (`app/page.tsx`)
- **Vấn đề hiện tại:** Trang landing mang tính chất giới thiệu sản phẩm phần mềm mã nguồn mở ("Gia Phả OS - Phần mềm mã nguồn mở của HomieLab") hơn là cổng thông tin trang trọng của Dòng Họ Chu.
- **Bằng chứng:** Header có nút GitHub, footer có disclaimer về mã nguồn mở.
- **Tác động:** Không tạo được cảm giác tự hào và thiêng liêng của một dòng tộc khi con cháu truy cập vào trang chủ.
- **Phương án cải thiện V2 (P1):**
  - Thiết kế lại trang chủ thành **Cổng Thông Tin Dòng Họ Chu**.
  - Hiển thị: Lời tựa tộc phả, Hình ảnh Nhà thờ họ, Thủy tổ khai sáng, Các đời truyền thừa tóm lược, Tin tức sự kiện họp họ sắp diễn ra, Nút "Đăng nhập dành cho con cháu họ Chu".
- **Acceptance Criteria:** Trang chủ mang đậm văn hóa họ Chu, không chứa các thành phần kỹ thuật mã nguồn mở ở giao diện chính.

---

### MÀN HÌNH 02: Bảng điều khiển chính (`app/dashboard/page.tsx`)
- **Vấn đề hiện tại:** Màn hình Launchpad chứa danh sách sự kiện 30 ngày tới kèm một lưới thẻ tính năng (Feature cards). Bố cục bị phân mảnh, chưa làm nổi bật cây phả hệ và các thông báo gia tộc quan trọng.
- **Tác động:** Người dùng phải mất thêm 1 click mới vào được cây phả hệ.
- **Phương án cải thiện V2 (P1):**
  - Bổ sung Widget: "Hồ sơ của bạn trên cây", "Sự kiện giỗ sắp tới trong tuần", "Thống kê nhanh dòng họ Chu (Tổng số đời, nhân khẩu, số chi)".
  - Đưa Cây gia phả thành trung tâm hoặc tab mở sẵn.

---

### MÀN HÌNH 03: Màn hình Cây Gia Phả (`app/dashboard/members/page.tsx`)
- **Vấn đề hiện tại:**
  - Nút chuyển chế độ xem (Cây / Danh sách / Mindmap / Bong bóng) nằm trên thanh sub-header nhưng giao diện điều khiển zoom và bộ lọc (`TreeToolbar.tsx`) chiếm diện tích khá lớn trên mobile.
  - Nút bấm thu phóng và mở nhánh quá nhỏ trên màn hình cảm ứng.
- **Phương án cải thiện V2 (P0):**
  - Thiết kế lại thanh công cụ dạng nổi tối giản (Floating Pill Toolbar).
  - Tăng kích thước nút mở nhánh lên 44px trên mobile.
  - Bổ sung thanh chọn nhanh Chi phái (Branch Selector Dropdown) ngay trên đầu cây.
  - Thêm tính năng "Nhảy về vị trí của tôi" (Locate Me on Tree).

---

### MÀN HÌNH 04: Danh sách thành viên (`components/MemberList.tsx`)
- **Vấn đề hiện tại:** Tìm kiếm nhanh, lọc theo đời tốt, nhưng thiếu phân loại theo Chi nhánh, Quê quán hiện tại, Tình trạng hôn nhân.
- **Phương án cải thiện V2 (P1):**
  - Bổ sung bảng dữ liệu chuyên nghiệp (Data Table) có thể ẩn/hiện cột theo nhu cầu (Năm sinh, Năm mất, Nơi an táng, Tên cha, Tên mẹ, Chi phái).
  - Cho phép xuất danh sách thành viên ra file Excel/CSV theo từng Chi phục vụ việc kiểm kê họ tộc.

---

### MÀN HÌNH 05: Hồ sơ cá nhân (`components/modal/MemberDetailModal.tsx` & `/members/[id]`)
- **Vấn đề hiện tại:**
  - Hồ sơ hiện tại chỉ gồm một số trường cơ bản, phần ghi chú (Note) dùng chung cho mọi thứ.
  - Chưa phân tách rõ ràng giữa: Thông tin hành chính, Tiểu sử cuộc đời, Thành tựu/Đóng góp cho họ tộc, Mộ phần/An táng, và Nguồn tư liệu gốc.
- **Phương án cải thiện V2 (P1):**
  - Thiết kế lại trang hồ sơ cá nhân dạng Thẻ danh nhân gia tộc (Tộc biểu cá nhân):
    - Tab 1: *Thông tin cơ bản & Gia đình* (Vợ chồng, con cái, cha mẹ, thứ tự con).
    - Tab 2: *Tiểu sử & Sự nghiệp* (Học vấn, chức vụ, thành tựu, công đức đóng góp xây dựng nhà thờ họ).
    - Tab 3: *Tâm linh & Mộ phần* (Ngày mất âm/dương lịch, nơi an táng, bản đồ chỉ dẫn mộ phần).
    - Tab 4: *Ảnh & Tư liệu lịch sử* (Ảnh scan trang gia phả giấy gốc có tên cụ, ảnh bia mộ, tài liệu liên quan).
    - Tab 5: *Lịch sử chỉnh sửa* (Dành cho Admin).

---

### MÀN HÌNH 06: Form Thêm / Sửa thành viên (`components/MemberForm.tsx`)
- **Vấn đề hiện tại:**
  - Form cuộn dài (Long single-scroll form) với nhiều trường dữ liệu phức tạp (ngày dương, ngày âm, nơi an táng, thông tin riêng tư).
  - Trên điện thoại, việc cuộn form dài dễ dẫn đến bấm nhầm nút Hủy hoặc bỏ sót các trường quan trọng.
- **Phương án cải thiện V2 (P0):**
  - Chuyển thành **Form phân bước thông minh (Multi-step Wizard)**:
    - Bước 1: Thông tin nhân thân cốt lõi (Họ tên, Giới tính, Đời, Năm sinh).
    - Bước 2: Quan hệ gia đình (Gắn với ai trên cây: Con của ai, Vợ của ai).
    - Bước 3: Thông tin tạ thế & Mộ phần (nếu đã mất).
    - Bước 4: Ảnh đại diện & Ghi chú tư liệu.
  - Tự động lưu nháp (Auto-draft) vào LocalStorage để không mất dữ liệu khi lỡ tay đóng tab trình duyệt.

---

### MÀN HÌNH 07: Tra cứu danh xưng (`app/dashboard/kinship/page.tsx`)
- **Vấn đề hiện tại:** Giao diện chọn 2 người để tìm danh xưng dùng 2 selector dropdown khá dài. Kết quả hiển thị text giải thích chi tiết nhưng thiếu sơ đồ đường dẫn huyết thống trực quan.
- **Phương án cải thiện V2 (P2):**
  - Bổ sung sơ đồ đồ thị thu nhỏ (Mini-path diagram) vẽ đường dẫn quan hệ: `Bạn → Bố → Bác trưởng → Người cần gọi`.
  - Giúp con cháu trẻ tuổi dễ dàng hiểu tại sao lại gọi người đó bằng Bác, Chú hay Cụ.

---

### MÀN HÌNH 08: Phả ký thành sách (`app/dashboard/lineage/book/page.tsx`)
- **Vấn đề hiện tại:** Trang in ấn rất tiện lợi, nhưng bìa sách và định dạng trang còn đơn giản, thiếu tính mỹ thuật truyền thống.
- **Phương án cải thiện V2 (P1):**
  - Bổ sung mẫu Bìa gia phả trang trọng có họa tiết truyền thống (chữ CHU cách điệu, hoa văn triện cổ).
  - Thêm trang "Lời tựa gia phả họ Chu" và "Tộc ước - Quy chế dòng tộc".
  - Hỗ trợ dàn trang in 2 mặt (in đóng sách gáy còng hoặc khâu chỉ truyền thống).

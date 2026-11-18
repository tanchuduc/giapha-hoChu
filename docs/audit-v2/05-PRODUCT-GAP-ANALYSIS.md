# 05. PHÂN TÍCH KHOẢNG TRỐNG TÍNH NĂNG (PRODUCT GAP ANALYSIS)

**Dự án:** Gia Phả OS (Gia Phả Họ Chu)  
**Mục tiêu:** Định vị khoảng cách giữa nền tảng hiện tại (v2.5.1) và một Hệ điều hành Gia phả số hoàn chỉnh (Gia Phả OS V2) phục vụ dòng họ Chu quy mô hàng nghìn người.

---

## 1. HỆ THỐNG PHÂN LOẠI ƯU TIÊN (PRIORITIZATION FRAMEWORK)
- **P0 (Critical / Blocker):** Thiết yếu cho tính đúng đắn phả hệ, an toàn dữ liệu, toàn vẹn quan hệ và vận hành cốt lõi dòng họ. Phải có trước khi triển khai rộng rãi cho toàn thể con cháu.
- **P1 (High / Core MVP V2):** Cần có để tạo nên phiên bản V2 hoàn chỉnh, giải quyết nhu cầu thực tế của các Chi phái và số hóa gia phả giấy.
- **P2 (Medium / Experience Boost):** Nâng cao trải nghiệm người dùng, hỗ trợ tiện ích phong phú cho con cháu.
- **P3 (Low / Future Vision):** Tính năng nâng cao, mở rộng trong tương lai lâu dài.

---

## 2. MA TRẬN PHÂN TÍCH KHOẢNG TRỐNG TỪNG NHÓM CHỨC NĂNG

### NHÓM A: CỐT LÕI PHẢ HỆ (CORE GENEALOGY)

| STT | Chức năng chi tiết | Trạng thái hiện tại (Current State) | Giá trị nghiệp vụ (Business Value) | Mức ưu tiên | Tính khả thi kỹ thuật | Phụ thuộc (Dependencies) | Rủi ro tiềm ẩn (Risks) |
|---|---|---|---|---|---|---|---|
| A.1 | Quản lý thành viên (CRUD Person) | Đã có đầy đủ, lưu trữ tại `persons` và `person_details_private`. | Rất cao (Cơ sở dữ liệu trung tâm). | **P0** | Đã hoàn thành. | Không. | Xung đột ghi đồng thời khi nhiều người cùng sửa. |
| A.2 | Quản lý quan hệ gia đình (Cha mẹ, con cái, hôn nhân) | Đã có tại `relationships`, hỗ trợ đa thê, con nuôi. | Rất cao. | **P0** | Đã hoàn thành. | A.1 | Lỗi quan hệ vòng lặp nếu bỏ qua validation. |
| A.3 | Quản lý Chi nhánh (Branch & Lineage Hierarchy) | **CHƯA CÓ.** Chỉ có thuật toán BFS tự tính đời và thứ tự sinh. | **CỰC KỲ CAO.** Dòng họ Chu không thể quản lý nếu thiếu phân cấp Chi. | **P0** | Rất khả thi (Tạo bảng `branches`, gắn `branch_id`). | Schema DB. | Cần migration dữ liệu cũ nếu gán chi cho người đã có. |
| A.4 | Quản lý các Đời / Thế hệ linh hoạt | Có cột `generation` trong DB; tự cập nhật bằng `update_generations`. | Rất cao. | **P0** | Đã hoàn thành 85%. | A.1 | Khi thêm cụ tổ đời trên, phải tính lùi toàn bộ cây. |
| A.5 | Cây gia phả trực quan đa chế độ | Có 3 chế độ (Cây, Mindmap, Bubble) dùng CSS DOM & D3. | Rất cao. | **P0** | Đã hoàn thành 85%. | A.1, A.2 | Tràn DOM khi render >1.000 người. |
| A.6 | Tìm kiếm & Định vị tức thì trên cây | Có `GlobalMemberSearch` tìm không dấu, focus cây. | Rất cao. | **P0** | Đã hoàn thành 95%. | A.5 | Tốt. |
| A.7 | Hồ sơ thành viên chuyên sâu (Tiểu sử, công đức) | Chỉ có trường `note` thô, chưa có tab phân loại tiểu sử. | Cao. Phục vụ giáo dục truyền thống cho con cháu. | **P1** | Khả thi (Mở rộng schema). | A.1 | Không. |
| A.8 | Tự động phát hiện dữ liệu sai & trùng lặp | Có `dataCheck.ts` và `duplicateScan.ts` quét 12 loại lỗi. | Rất cao. Đảm bảo tính trong sạch của gia phả. | **P0** | Đã hoàn thành 90%. | A.1, A.2 | Cần chạy định kỳ tự động thay vì bấm thủ công. |

---

### NHÓM B: CỘNG TÁC, PHÂN QUYỀN & KIỂM TOÁN (COLLABORATION & GOVERNANCE)

| STT | Chức năng chi tiết | Trạng thái hiện tại | Giá trị nghiệp vụ | Mức ưu tiên | Tính khả thi | Phụ thuộc | Rủi ro tiềm ẩn |
|---|---|---|---|---|---|---|---|
| B.1 | Phân quyền Quản trị theo Chi phái (Branch Admin) | **CHƯA CÓ.** Quyền chỉ có Admin/Editor toàn họ. | **CỰC KỲ CAO.** Trưởng chi cần tự quản lý con cháu trong chi mình. | **P0** | Khả thi (Cập nhật RLS policies theo `branch_id`). | A.3 | Cấu hình RLS phức tạp dễ gây chặn nhầm quyền. |
| B.2 | Quy trình Đề xuất & Phê duyệt sửa đổi (Change Requests) | **CHƯA CÓ.** Thành viên thường không thể đề xuất sửa lỗi. | **CỰC KỲ CAO.** Đảm bảo dữ liệu không bị sửa bừa bãi nhưng vẫn huy động được con cháu đóng góp. | **P0** | Khả thi (Bảng `change_requests` và UI so sánh Diff). | B.1 | Ùn ứ yêu cầu nếu Admin/Trưởng chi chậm duyệt. |
| B.3 | Lịch sử chỉnh sửa & Nhật ký kiểm toán (Audit Trail) | **CHƯA CÓ.** Chỉ có `updated_at`, không biết ai sửa, sửa gì. | **CỰC KỲ CAO.** Tránh tranh chấp phả hệ, truy cứu trách nhiệm khi sai lệch. | **P0** | Khả thi (Tạo bảng `audit_logs` kết hợp Trigger DB). | DB Trigger. | Tăng dung lượng lưu trữ bảng log theo thời gian. |
| B.4 | Phân quyền người xem (Read-only Member) | Đã có vai trò `member`, chỉ xem sau khi Admin duyệt. | Cao. | **P0** | Đã hoàn thành. | Auth. | Tốt. |

---

### NHÓM C: VĂN HÓA, LỊCH SỬ & TÂM LINH DÒNG TỘC (HISTORICAL & CULTURAL)

| STT | Chức năng chi tiết | Trạng thái hiện tại | Giá trị nghiệp vụ | Mức ưu tiên | Tính khả thi | Phụ thuộc | Rủi ro tiềm ẩn |
|---|---|---|---|---|---|---|---|
| C.1 | Lịch sử Dòng họ Chu & Nhà thờ tổ | Trang `/about` tĩnh, nội dung còn sơ sài. | Rất cao (Lưu giữ gốc gác, nguồn cội dòng họ). | **P1** | Dễ (Xây dựng trang nội dung chuyên sâu). | CMS/Markdown. | Cần Ban trị sự họ Chu cung cấp nội dung chính thức. |
| C.2 | Lịch ngày giỗ Âm lịch & Tự động nhắc giỗ | Đã có thuật toán âm lịch VN, tính giỗ đầu, xuất file `.ics`. | Rất cao (Con cháu không bao giờ quên ngày giỗ tổ). | **P1** | Đã có nền tảng tốt. Bổ sung gửi thông báo Email/Zalo. | Resend/Zalo API. | Chi phí gửi tin nhắn Zalo/SMS nếu dùng dịch vụ trả phí. |
| C.3 | Quản lý Mộ phần & Bản đồ an táng gia tộc | Có trường `burial_place` lưu dạng text; chưa có bản đồ định vị. | Cao. Cực kỳ hữu ích cho con cháu xa quê đi viếng mộ dịp Tết. | **P2** | Khả thi (Thêm tọa độ GPS `latitude, longitude` & Google Map embed). | Schema DB. | Cần người đi thực địa chụp ảnh và lấy tọa độ GPS. |
| C.4 | Thư viện ảnh theo Chi nhánh & Sự kiện | Có module `gallery_items` nhưng hiển thị chung một danh sách phẳng. | Cao. | **P2** | Khả thi (Thêm `album_id` hoặc phân loại theo chi). | C.1 | Tốn dung lượng Storage nếu con cháu up nhiều video/ảnh lớn. |

---

### NHÓM D: SỐ HÓA GIA PHẢ GIẤY & IMPORT (DIGITIZATION & AI ASSISTANCE)

| STT | Chức năng chi tiết | Trạng thái hiện tại | Giá trị nghiệp vụ | Mức ưu tiên | Tính khả thi | Phụ thuộc | Rủi ro tiềm ẩn |
|---|---|---|---|---|---|---|---|
| D.1 | Tải lên bản chụp/scan Gia phả giấy (PDF/Ảnh) | **CHƯA CÓ.** Chưa có nơi lưu trữ và quản lý tập tin scan gốc. | Rất cao. Lưu trữ tài liệu lịch sử gốc của dòng họ. | **P1** | Dễ (Thêm bucket `historical_documents`). | Supabase Storage. | Giới hạn dung lượng lưu trữ tệp PDF nặng. |
| D.2 | OCR Tiếng Việt & Trích xuất phả hệ bằng AI | **CHƯA CÓ.** | Rất cao (Tiết kiệm hàng trăm giờ gõ tay văn bản phả hệ). | **P1** | Khả thi (Tích hợp Gemini Vision API hoặc OCR service). | External AI API. | AI nhận diện sai chữ mờ, sai dấu tiếng Việt. |
| D.3 | Khu vực kiểm soát & Đối chiếu cách ly (Staging Review) | **CHƯA CÓ.** | **BẮT BUỘC (SAFETY GATE).** Ngăn chặn thông tin rác vào gia phả chính. | **P0** | Khả thi (Bảng `staging_persons`, `staging_relationships`). | D.2 | Nếu UI đối soát khó dùng, người duyệt sẽ ngại làm. |
| D.4 | Lưu vết nguồn gốc tư liệu (Provenance Tracking) | **CHƯA CÓ.** | Rất cao (Mỗi thông tin cụ nào phải dẫn chứng trang số mấy cuốn gia phả nào). | **P1** | Khả thi (Liên kết hồ sơ Person với Document Page ID). | D.1 | Không. |

---

### NHÓM E: KẾT NỐI CỘNG ĐỒNG CON CHÁU (COMMUNITY)

| STT | Chức năng chi tiết | Trạng thái hiện tại | Giá trị nghiệp vụ | Mức ưu tiên | Tính khả thi | Phụ thuộc | Rủi ro tiềm ẩn |
|---|---|---|---|---|---|---|---|
| E.1 | Liên kết tài khoản Đăng nhập với Hồ sơ Cây phả hệ | **CHƯA CÓ.** Tài khoản đăng nhập hoàn toàn tách rời hồ sơ thành viên. | **CỰC KỲ CAO.** Mở ra trải nghiệm cá nhân hóa "Cây gia phả của tôi". | **P0** | Khả thi (Thêm `user_id` vào `persons` hoặc bảng liên kết). | Auth & Persons. | Nhận nhầm hồ sơ của người khác (Cần Trưởng chi xác nhận). |
| E.2 | Mời con cháu qua mã QR / Đường dẫn Zalo | Chỉ có link duyệt email cho Admin. Chưa có link mời con cháu. | Cao (Giúp kết nối con cháu họ Chu khắp ba miền và hải ngoại). | **P1** | Khả thi (Sinh invite token an toàn). | E.1 | Link bị lộ ra ngoài dòng họ (Khắc phục bằng bước duyệt của Trưởng chi). |

---

### NHÓM F: BẢO MẬT & QUẢN TRỊ HỆ THỐNG (ADMIN & SECURITY)

| STT | Chức năng chi tiết | Trạng thái hiện tại | Giá trị nghiệp vụ | Mức ưu tiên | Tính khả thi | Phụ thuộc | Rủi ro tiềm ẩn |
|---|---|---|---|---|---|---|---|
| F.1 | Bảo vệ thông tin riêng tư người còn sống (Living Privacy) | Bảng `person_details_private` chỉ cho Admin xem; nhưng trên cây mọi người đều thấy tên/năm sinh. | Rất cao (Tuân thủ quyền riêng tư, tránh lộ thông tin cá nhân). | **P1** | Khả thi (Ẩn thông tin chi tiết người còn sống với khách/người ngoài họ). | RLS. | Không. |
| F.2 | Sao lưu tự động & Bảo vệ toàn vẹn dữ liệu | Có sao lưu thủ công ra JSON/CSV. Chưa có tự động backup định kỳ. | Rất cao. Tránh mất mát dữ liệu hàng trăm năm của dòng họ. | **P0** | Khả thi (Cron job pg_dump hoặc Supabase Point-in-time recovery). | Infra. | Chi phí gói dịch vụ lưu trữ. |

---

### NHÓM G: TÍNH NĂNG NÂNG CAO - ĐỊNH HƯỚNG TƯƠNG LAI (OPTIONAL / ADVANCED)

| STT | Chức năng chi tiết | Trạng thái | Giá trị | Ưu tiên | Khả thi | Đánh giá |
|---|---|---|---|---|---|---|
| G.1 | Bản đồ địa lý phân bố con cháu họ Chu | Chưa có | Trung bình | **P3** | Khả thi | Hiển thị bản đồ nhiệt (Heatmap) con cháu định cư trên thế giới. |
| G.2 | AI Trợ lý Dòng họ (Hỏi đáp dựa trên dữ liệu đã kiểm chứng) | Chưa có | Khá cao | **P3** | Khả thi | Con cháu hỏi: "Cụ Chu Văn X sinh năm nào, thuộc chi nào, giỗ ngày mấy?" - AI chỉ trả lời từ DB chính thức, không bịa đặt. |
| G.3 | In ấn Cây gia phả khổ lớn (Banner / Bạt vải dòng tộc) | Có xuất PDF A3/A4 ghép tờ. Chưa có template in bạt sự kiện. | Cao vào dịp giỗ tổ | **P2** | Khả thi | Thiết kế sẵn mẫu khung viền cổ kính để in bạt rộng 3m - 5m treo Từ đường. |

# 02. DANH MỤC TÍNH NĂNG TOÀN HỆ THỐNG (FEATURE INVENTORY)

**Dự án:** Gia Phả OS (Gia Phả Họ Chu)  
**Phiên bản kiểm toán:** 2.5.1  
**Phân loại trạng thái:**
- **Fully implemented:** Đã hoàn thiện cả UI lẫn logic backend/database, hoạt động ổn định.
- **Partially implemented:** Đã có chức năng cơ bản nhưng thiếu logic nghiệp vụ nâng cao hoặc thiếu liên kết UI.
- **UI only / mock:** Chỉ có giao diện hiển thị hoặc dữ liệu giả lập, chưa lưu trữ thực tế.
- **Broken:** Có chức năng nhưng bị lỗi hoặc không thể vận hành bình thường.
- **Missing:** Nghiệp vụ cốt lõi của dòng họ Việt Nam chưa hề có trong codebase.
- **Unverified:** Có mã nguồn nhưng chưa đủ điều kiện kiểm chứng thực tế trong môi trường hiện tại.

---

## 1. BẢNG KIỂM KÊ TỔNG THỂ TÍNH NĂNG (FEATURE INVENTORY MATRIX)

| Module | Chức năng | Trạng thái | Hoàn thiện | Vấn đề phát hiện thực tế | Đề xuất cải tiến V2 |
|---|---|---|---|---|---|
| **Cây gia phả (Tree)** | Sơ đồ phả hệ dạng Cây chuẩn (CSS DOM Tree) | Fully implemented | 85% | Render toàn bộ DOM nodes, không ảo hóa (virtualization). Khi dòng họ trên 1.000 người sẽ gây lag giật trên điện thoại. | Tích hợp Virtualization/Canvas rendering cho cây lớn; thêm bộ lọc nhánh nhanh. |
| **Cây gia phả (Tree)** | Thu phóng, kéo thả (Pan & Zoom) | Fully implemented | 95% | Hỗ trợ chuột, touch pinch, bàn phím tốt. Nút toggle +/- ở node hơi nhỏ trên màn hình cảm ứng di động. | Tăng touch target kích thước tối thiểu 44x44px theo chuẩn WCAG trên mobile. |
| **Cây gia phả (Tree)** | Sơ đồ tư duy (Mindmap Tree) | Fully implemented | 90% | Dùng D3.js. Chưa hỗ trợ lọc nhanh theo từng chi phái; text node dài bị cắt xén. | Tối ưu hóa layout đóng mở node theo từng chi nhánh họ Chu. |
| **Cây gia phả (Tree)** | Sơ đồ bong bóng (Bubble Map) | Fully implemented | 80% | Trực quan dạng cụm gia đình. Khó theo dõi mạch thế hệ liên tục với các dòng họ sâu từ 7-15 đời. | Giữ làm chế độ phụ, bổ sung chỉ số đời rõ ràng ở tâm cụm. |
| **Cây gia phả (Tree)** | Xuất ảnh và PDF (Export PDF/Image) | Fully implemented | 85% | Cắt ghép trang A4/A3 thông minh bằng `jspdf` và `html-to-image`. Tuy nhiên, cây kích thước cực lớn có thể vượt giới hạn bộ nhớ canvas của trình duyệt di động. | Bổ sung cảnh báo tải bộ nhớ và cho phép chọn xuất theo từng chi/nhánh cụ thể. |
| **Thành viên (Member)** | Xem danh sách thành viên (List view) | Fully implemented | 90% | Có phân trang theo cụm (batched list), tìm kiếm không dấu, lọc theo giới tính, còn sống/đã mất, theo đời. | Bổ sung bộ lọc theo Chi nhánh, Quê quán, Nghề nghiệp. |
| **Thành viên (Member)** | Hồ sơ cá nhân (Member Details) | Fully implemented | 85% | Có ngày sinh, ngày mất, ngày giỗ âm, nơi an táng, cha mẹ, vợ chồng, con cái, ảnh tư liệu. Thiếu tiểu sử chi tiết và tư liệu gốc. | Bổ sung tab Tiểu sử - Sự nghiệp - Đóng góp dòng họ và Dẫn nguồn tư liệu lịch sử. |
| **Thành viên (Member)** | Thêm thành viên mới (Add Member) | Fully implemented | 80% | Nhập thông tin cá nhân cơ bản, tự tính ngày mất âm lịch, rà trùng tên/năm sinh. Form tương đối dài trên màn hình điện thoại. | Chia nhỏ form thành các bước (Step Wizard) thân thiện hơn với người cao tuổi. |
| **Thành viên (Member)** | Thêm nhiều con cùng lúc (Bulk Add Children) | Fully implemented | 90% | Cho phép thêm nhanh nhiều con vào một cặp cha mẹ; tự động kiểm tra trùng lặp và tính thứ tự con. | Rất hữu ích, giữ nguyên và tối ưu giao diện trên thiết bị di động. |
| **Thành viên (Member)** | Thêm nhanh vợ/chồng (Quick Add Spouse) | Fully implemented | 90% | Hỗ trợ thêm nhiều vợ/chồng (đa thê, đa phu), phân biệt dâu/rể. | Bổ sung trường ghi chú thứ bậc hôn nhân (Vợ cả, Vợ hai, Chồng trước...). |
| **Thành viên (Member)** | Thông tin riêng tư (Private Details) | Partially implemented | 60% | Bảng `person_details_private` lưu sđt, nghề nghiệp, nơi ở; chỉ Admin xem được. Tuy nhiên Editor không xem được thông tin liên lạc thành viên để phục vụ cập nhật. | Phân quyền chi tiết hơn: Cho phép Editor xem sđt để tiện liên hệ xác minh thông tin. |
| **Thành viên (Member)** | Đề xuất sửa đổi bởi thành viên (Change Proposal) | **Missing** | 0% | Thành viên thường (`member`) bị RLS chặn hoàn toàn việc sửa/bổ sung. Không có luồng gửi đề xuất sửa kèm phê duyệt. | **P0:** Bổ sung bảng `change_requests` và quy trình gửi đề xuất cho Ban quản trị duyệt. |
| **Chi nhánh (Lineage/Branch)** | Quản lý Chi / Phân chi / Nhánh | **Missing** | 10% | Không có bảng lưu Chi nhánh. Hệ thống chỉ có thuật toán BFS tự tính `generation` và `birth_order` từ gốc tại `/dashboard/lineage`. Không đặt tên được chi. | **P0:** Thêm thực thể `branches`, phân cấp Cây chi phái họ Chu (Chi Trưởng, Chi Hai, Chi Ba...). |
| **Chi nhánh (Lineage/Branch)** | Phân quyền Quản trị theo Chi (Branch Admin) | **Missing** | 0% | Chỉ có Admin toàn họ. Trưởng chi không có quyền quản trị riêng cho nhánh của mình. | **P0:** Thêm role `branch_admin` được phân quyền quản lý theo nhánh cây được ủy quyền. |
| **Phả ký & In ấn** | Phả ký thành sách (Lineage Book) | Fully implemented | 85% | Trang `/dashboard/lineage/book` tạo tài liệu phả ký hoàn chỉnh theo đời, hỗ trợ in ra giấy A4 với mục lục và liên kết trang. | Bổ sung trang bìa trang trọng họ Chu, Lời tựa gia phả, Quy ước dòng tộc. |
| **Xưng hô (Kinship)** | Tra cứu danh xưng (Kinship Finder) | Fully implemented | 95% | Thuật toán danh xưng chuẩn mực văn hóa Việt (Bác, Chú, Cô, Dì, Thím, Cậu, Mợ...), phân biệt nội ngoại, thứ bậc con thứ. | Giữ nguyên thuật toán xuất sắc này; nâng cấp giao diện trực quan hóa đường dẫn huyết thống. |
| **Sự kiện & Giỗ tết** | Lịch ngày giỗ & Sinh nhật | Fully implemented | 85% | Tính đúng Âm lịch Việt Nam (UTC+7), giỗ đầu, tháng nhuận, tháng thiếu 29 ngày. Xuất file `.ics` đồng bộ vào điện thoại. | Thêm tính năng nhắc giỗ dòng họ qua Email/Zalo notification cho con cháu. |
| **Sự kiện & Giỗ tết** | Sự kiện dòng tộc tùy chỉnh | Fully implemented | 80% | Tạo sự kiện tế lễ, họp họ, sửa nhà thờ tổ; hỗ trợ lặp hàng năm theo âm/dương lịch. | Hiển thị rõ danh sách người phụ trách tổ chức sự kiện. |
| **Phòng truyền thống (Gallery)** | Thư viện ảnh & Tư liệu | Fully implemented | 85% | Tải ảnh tối đa 10MB WebP, gắn thẻ thành viên (tagged members), liên kết trực tiếp vào hồ sơ cá nhân. | Bổ sung phân loại Album: Ảnh Nhà thờ tổ, Ảnh Mộ phần, Ảnh Đại hội họ Chu. |
| **Kiểm tra dữ liệu** | Rà soát quan hệ vô lý (Data Checks) | Fully implemented | 90% | Cảnh báo vòng lặp cha-con, con sinh sau mẹ mất, cha mất >10 tháng, cha mẹ <12 hoặc >70 tuổi, trùng thứ tự sinh. | Cung cấp nút sửa nhanh trực tiếp ngay tại bảng cảnh báo. |
| **Kiểm tra dữ liệu** | Quét & Gộp trùng (Duplicate & Merge) | Fully implemented | 90% | Quét người trùng tên/năm sinh; modal gộp 2 hồ sơ (`private.merge_persons`) chuyển đổi toàn bộ quan hệ trong 1 transaction an toàn. | Bổ sung lưu lịch sử gộp và cho phép hoàn tác nếu gộp nhầm. |
| **Sao lưu & Di chuyển** | Xuất / Nhập JSON & CSV | Fully implemented | 90% | Hỗ trợ 2 chế độ: Thay toàn bộ cây và Nhập nối thêm vào cây hiện tại; bảo vệ công thức CSV injection (`=`, `+`, `-`). | Hoạt động tốt. Cần bổ sung cơ chế lưu trữ snapshot backup định kỳ tự động lên cloud. |
| **Sao lưu & Di chuyển** | Xuất / Nhập GEDCOM | Partially implemented | 70% | Hỗ trợ chuẩn GEDCOM quốc tế. Tuy nhiên GEDCOM không phản ánh tốt các đặc thù âm lịch Việt Nam và tên đệm/tên húy. | Duy trì để trao đổi với phần mềm quốc tế; khuyến nghị dùng JSON chuẩn V2 cho nội bộ. |
| **Số hóa gia phả giấy** | Upload PDF / Ảnh scan bản in chữ Quốc ngữ | **Missing** | 0% | Chưa có module tiếp nhận tài liệu số hóa gia phả giấy. | **P1:** Xây dựng module tiếp nhận ảnh chụp/PDF gia phả giấy dòng họ Chu. |
| **Số hóa gia phả giấy** | OCR Tiếng Việt & AI Extraction | **Missing** | 0% | Chưa có pipeline trích xuất thực thể thành viên và quan hệ bằng AI. | **P1:** Tích hợp pipeline OCR tiếng Việt + AI phân tích phả hệ vào khu vực cách ly (Staging Area). |
| **Số hóa gia phả giấy** | Xác thực & Đối chiếu trước khi nhập (Human-in-the-loop) | **Missing** | 0% | Chưa có cơ chế đối soát thông tin trích xuất với dữ liệu gốc trước khi vào gia phả chính thức. | **P0:** Bắt buộc phải qua bước đối soát của Ban trị sự dòng họ, cấm AI tự động ghi đè DB. |
| **Quản trị người dùng** | Duyệt & Phân quyền tài khoản (Users) | Fully implemented | 80% | Admin duyệt tài khoản mới, cấp quyền admin/editor/member, khóa tài khoản, duyệt qua email 1 chạm. | Bổ sung phân quyền theo Chi nhánh và liên kết tài khoản User với hồ sơ Person cụ thể. |
| **Bảo mật & Kiểm toán** | Lịch sử thay đổi (Audit Log) | **Missing** | 0% | Không có bảng ghi vết thay đổi (Audit log), không lưu thông tin ai sửa ai xóa. | **P0:** Bổ sung bảng `audit_logs` ghi nhận vết mọi thao tác CRUD dữ liệu. |
| **Nâng cấp hệ thống** | Chạy Migration trong Dashboard | Fully implemented | 85% | Route `/dashboard/upgrade` phát hiện migration thiếu và áp dụng trực tiếp qua kết nối pooler. | Giữ nguyên tính năng này cho System Admin; hạn chế quyền truy cập nghiêm ngặt. |

---

## 2. NHỮNG TÍNH NĂNG BỊ ẨN HOẶC KHÓ TIẾP CẬN TRÊN GIAO DIỆN HIỆN TẠI

1. **Trang Sự kiện (`/dashboard/events`) & Thư viện ảnh (`/dashboard/gallery`):**
   - Hoàn toàn **không có trong Header Menu** (`components/HeaderMenu.tsx`).
   - Người dùng chỉ có thể tìm thấy nếu cuộn xuống cuối màn hình Dashboard chính (`/dashboard`) để bấm vào các thẻ Feature Card.
2. **Công cụ Phả ký dạng sách (`/dashboard/lineage/book`):**
   - Nằm ẩn trong menu thả xuống dưới tên "Phả ký", nhưng trên giao diện trang Thành viên không có nút tắt dẫn tới bản sách này.
3. **Công cụ Quét trùng và Kiểm tra dữ liệu:**
   - Bị đặt sâu bên trong tab của trang Sao lưu & Phục hồi (`/dashboard/data`), khiến người quản trị thông thường rất khó phát hiện để sử dụng định kỳ.

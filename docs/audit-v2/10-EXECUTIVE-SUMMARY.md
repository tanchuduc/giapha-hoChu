# 10. BÁO CÁO TỔNG HỢP KIỂM TOÁN VÀ ĐỊNH HƯỚNG V2 DÀNH CHO CHỦ DỰ ÁN (EXECUTIVE SUMMARY)

**Dự án:** Hệ Điều Hành Gia Phả Số Họ Chu (Gia Phả OS V2)  
**Kính gửi:** Ban Trị Sự Dòng Họ Chu & Chủ Quản Dự Án  
**Đơn vị thực hiện:** Nhóm Chuyên Gia Kiểm Toán Hệ Thống Toàn Diện  
**Ngày lập báo cáo:** 17/11/2026  
**Nguyên tắc làm việc:** GIAI ĐOẠN HIỆN TẠI CHỈ AUDIT, KHÔNG CHỈNH SỬA CODE PRODUCTION.

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG

Sau khi khảo sát, rà soát chi tiết toàn bộ mã nguồn (hơn 150 file mã nguồn, 16 migrations SQL, 58 bài kiểm thử đơn vị và cấu hình triển khai thực tế), nhóm chuyên gia đưa ra đánh giá tổng quát:

> **Hệ thống hiện tại (`giapha-os` v2.5.1) sở hữu một nền tảng kỹ thuật hiện đại, chuẩn mực và có chất lượng mã nguồn rất cao ở cấp độ gia đình và nhánh nhỏ.** Các thuật toán cốt lõi về văn hóa Việt Nam (tính danh xưng chính xác theo quan hệ, thuật toán âm lịch Việt Nam của Hồ Ngọc Đức, quản lý đa thê và in phả ký thành sách) đã được xây dựng công phu và kiểm thử nghiêm ngặt.
>
> **Tuy nhiên, để đáp ứng mục tiêu quản lý một ĐẠI TỘC HỌ CHU quy mô lớn (nhiều Chi phái, hàng chục thế hệ, hàng nghìn thành viên, có nhu cầu số hóa gia phả giấy chữ Quốc ngữ), hệ thống đang thiếu hụt 5 trụ cột cấu trúc then chốt.**

---

## 2. BẢNG ĐIỂM MỨC ĐỘ SẴN SÀNG THEO CHUẨN ĐẠI TỘC (READINESS SCORECARD)

Đánh giá dựa trên Rubric kiểm toán 100 điểm với các bằng chứng kỹ thuật cụ thể:

| Trụ cột đánh giá | Trọng số | Điểm hiện tại | Nhận xét chi tiết |
|---|---|---|---|
| **1. Cốt lõi phả hệ & Thuật toán văn hóa Việt** | 20% | **18 / 20** | Rất xuất sắc. Thuật toán danh xưng, âm lịch, ngày giỗ, in phả ký hoạt động chuẩn mực. |
| **2. Quản lý Chi phái & Quy mô thế hệ** | 20% | **06 / 20** | **Điểm nghẽn lớn:** Cơ sở dữ liệu hoàn toàn chưa có bảng lưu Chi nhánh; chưa có phân quyền theo Chi. |
| **3. Cộng tác, Phân quyền & Duyệt đề xuất** | 15% | **05 / 15** | Chưa có luồng cho con cháu gửi đề xuất sửa thông tin; quyền biên tập phẳng (Flat Editor), thiếu Audit Log. |
| **4. Số hóa gia phả giấy có kiểm soát (AI/OCR)** | 15% | **02 / 15** | Hoàn toàn chưa có module tải tệp scan, chưa có Staging Review để đối chiếu trước khi import. |
| **5. Trải nghiệm người dùng (UI/UX & Người cao tuổi)** | 15% | **10 / 15** | Giao diện trang nhã, màu sắc ấm áp; nhưng menu bị giấu trong Avatar, nút bấm cây nhỏ trên điện thoại. |
| **6. An toàn dữ liệu & Hiệu năng quy mô lớn** | 15% | **09 / 15** | RLS tốt, typecheck sạch; nhưng đang dùng Hard Delete nguy hiểm và tải toàn bộ dữ liệu (Unbounded Fetch). |
| **TỔNG ĐIỂM ĐÁNH GIÁ HỆ THỐNG** | **100%** | **50 / 100** | **Mức độ: Đạt chuẩn Gia phả Gia đình (Family Scale), Cần nâng cấp V2 để đạt chuẩn Đại Tộc (Clan Scale).** |

---

## 3. 5 VẤN ĐỀ NGHIÊM TRỌNG NHẤT CẦN KHẮC PHỤC NGAY (CRITICAL BOTTLENECKS)

1. **Khuyết thiếu hoàn toàn Mô hình Chi phái (Missing Branch Hierarchy):**
   - Hiện tại hệ thống không lưu trữ khái niệm Chi Trưởng, Chi Hai, Chi Ba trong cơ sở dữ liệu. Không thể lọc cây theo Chi, không thể thống kê theo Chi, và Trưởng chi không thể quản lý riêng nhánh của mình.
2. **Cơ chế Xóa Vĩnh Viễn Nguy Hiểm (Destructive Hard Delete):**
   - Bấm xóa một thành viên là xóa sạch vĩnh viễn trong database cùng các mối quan hệ liên quan (`CASCADE`), không có cờ `deleted_at` và không thể khôi phục nếu lỡ tay thao tác nhầm.
3. **Thiếu Quy Trình Đề Xuất & Phê Duyệt (No Change Proposal & Approval Workflow):**
   - Con cháu trong họ khi thấy thông tin của gia đình mình bị sai không có nút gửi đề xuất đính chính. Nếu cấp quyền Editor thì họ có thể sửa/xóa bất kỳ ai trong cả dòng họ mà không cần ai duyệt.
4. **Không Có Lịch Sử Chỉnh Sửa (No Audit Trail):**
   - Cơ sở dữ liệu không ghi lại ai đã chỉnh sửa ngày mất, ai đã đổi nơi an táng của cụ nào. Khi xảy ra sai lệch phả hệ sẽ không thể truy cứu vết lịch sử.
5. **Điểm Nghẽn Menu Điều Hướng (Hidden Navigation):**
   - Toàn bộ menu chính bị giấu kín trong menu Avatar góc phải; người cao tuổi và con cháu mới vào sẽ rất khó tìm đường tới Cây gia phả, Lịch giỗ hay Phả ký.

---

## 4. ĐỀ XUẤT KIẾN TRÚC MỤC TIÊU V2 VÀ LỢI ÍCH MANG LẠI CHO HỌ CHU

Chúng tôi khuyến nghị áp dụng **Phương án B: Tái cấu trúc có trọng điểm và mở rộng Module (Refactor & Module Extension)**:
- **Kế thừa 100% thế mạnh đã được kiểm nghiệm:** Giữ nguyên stack Next.js 16 / React 19 / Supabase cực kỳ ổn định, bảo toàn toàn bộ thuật toán danh xưng và âm lịch chuẩn xác.
- **Mở rộng Schema an toàn (Non-destructive Extension):**
  - Bổ sung bảng `branches` để quản lý các Chi phái họ Chu.
  - Bổ sung bảng `change_requests` để con cháu gửi yêu cầu cập nhật, Trưởng chi duyệt.
  - Bổ sung bảng `audit_logs` để ghi vết mọi thay đổi vĩnh viễn.
  - Bổ sung bảng `historical_documents` và `staging_records` phục vụ số hóa gia phả giấy.
- **Tái cấu trúc giao diện:** Top Navigation Bar trang trọng trên máy tính, Bottom Tab Bar dễ bấm trên điện thoại, hỗ trợ chế độ đọc chữ lớn cho các cụ cao niên.

---

## 5. TỔNG HỢP LỘ TRÌNH TRIỂN KHAI 7 SPRINTS

- **Sprint 0 (Ổn định & An toàn dữ liệu):** Chuyển sang Soft Delete chống mất dữ liệu, cấu hình lại test runner.
- **Sprint 1 (Giao diện & Điều hướng):** Đưa toàn bộ tính năng ra Top Menu chính, tối ưu nút bấm và cỡ chữ cho người cao tuổi.
- **Sprint 2 (Chi phái & Lọc cây):** Tạo bảng Chi nhánh, tích hợp bộ lọc Cây gia phả theo từng Chi họ Chu.
- **Sprint 3 (Cộng tác & Phê duyệt):** Luồng con cháu đề xuất cập nhật thông tin, Trưởng chi duyệt, kích hoạt Audit Log.
- **Sprint 4 (Lịch sử & Tâm linh):** Cổng thông tin Nhà thờ tổ họ Chu, bản đồ chỉ dẫn mộ phần, lịch giỗ tự động.
- **Sprint 5 (Số hóa Gia phả giấy):** Upload PDF scan, OCR tiếng Việt, khu vực đối chiếu cách ly (Staging Area), cấm AI tự động ghi đè DB.
- **Sprint 6 (Kiểm thử tải & Bàn giao):** Stress test 5.000 người, bảo mật toàn diện, xuất bản Gia Phả OS V2 chính thức.

---

## 6. 4 QUYẾT ĐỊNH CHIẾN LƯỢC CẦN CHỦ DỰ ÁN / BAN TRỊ SỰ PHÊ DUYỆT

Trước khi bước vào giai đoạn thực thi (Implementation), kính đề nghị Ban trị sự dòng họ Chu phê duyệt các định hướng sau:

1. **Phê duyệt Danh sách các Chi phái chính thức của Dòng họ Chu:**
   - Cung cấp danh sách tên các Chi lớn (ví dụ: Chi Trưởng, Chi Hai, Chi Ba, Nhánh Đô Thành...) và người đứng đầu từng Chi để cấu hình vào cơ sở dữ liệu V2.
2. **Quy định Thẩm quyền Phê duyệt Đề xuất:**
   - Khi con cháu gửi đề xuất chỉnh sửa, Trưởng chi sẽ duyệt trực tiếp nhánh của mình, hay toàn bộ phải qua Trưởng ban trị sự toàn họ duyệt?
3. **Chính sách Quyền riêng tư đối với Người còn sống:**
   - Đối với con cháu đang còn sống: Số điện thoại, nghề nghiệp, nơi ở hiện tại có cho phép toàn thể con cháu trong họ xem không, hay chỉ Admin/Trưởng chi mới được xem?
4. **Cung cấp Tài liệu Scan Gia phả giấy gốc:**
   - Cung cấp tệp PDF scan hoặc ảnh chụp cuốn gia phả chữ Quốc ngữ của dòng họ Chu để đội ngũ kỹ thuật tiến hành thử nghiệm bóc tách OCR tại Sprint 5.

---

*(Toàn bộ 10 tài liệu kiểm toán chi tiết đã được lưu trữ hoàn tất trong thư mục `docs/audit-v2/` để phục vụ công tác tra cứu kỹ thuật).*

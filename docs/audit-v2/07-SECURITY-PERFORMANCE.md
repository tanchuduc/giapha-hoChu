# 07. KIỂM TOÁN AN NINH, HIỆU NĂNG VÀ CHẤT LƯỢNG (SECURITY, PERFORMANCE & QA AUDIT)

**Dự án:** Gia Phả OS (Gia Phả Họ Chu)  
**Tiêu chuẩn:** OWASP Top 10, Supabase Security Best Practices, Khả năng mở rộng cho dòng tộc lớn 5.000+ thành viên.

---

## 1. KIỂM TOÁN AN NINH BẢO MẬT (SECURITY AUDIT)

### 1.1. Xác thực & Quản lý Phiên (Authentication & Session Security)
- **Cơ chế:** Dùng Supabase Auth kết hợp `@supabase/ssr` trao đổi session qua HTTP-Only cookies được ký mã hóa.
- **Bảo vệ First User Bootstrap:**
  - Cơ chế tự động thăng cấp Admin cho tài khoản đăng ký đầu tiên được khóa bằng Transaction Advisory Lock:
    ```sql
    PERFORM pg_advisory_xact_lock(hashtext('giapha_os_first_user'));
    ```
  - Điều này loại bỏ hoàn toàn rủi ro Race Condition khi có 2 người cùng đăng ký đồng thời trong giây đầu tiên.
- **Bảo mật Liên kết Duyệt 1 Chạm (One-time Approval Link Token):**
  - Token gửi qua email cho Admin được băm bằng SHA-256 (`token_hash`) trước khi lưu vào bảng `user_approval_requests`. Raw token không bao giờ lưu trực tiếp trong DB. Token có hạn sử dụng và chỉ dùng được 1 lần (`used_at`).

### 1.2. Phân quyền Tầng Dữ liệu (Row Level Security - RLS)
- **Thực tế:** Tất cả các bảng nghiệp vụ (`profiles`, `persons`, `person_details_private`, `relationships`, `custom_events`, `gallery_items`, `gallery_item_persons`) đều được `ENABLE ROW LEVEL SECURITY`.
- **Hàm kiểm tra quyền:** Sử dụng hàm SQL `SECURITY DEFINER` với `SET search_path = ''` để ngăn chặn Search Path Hijacking:
  - `public.is_admin()`
  - `public.is_editor()`
  - `public.is_active_user()`
- **Đánh giá lỗ hổng phân quyền:**
  - *Lỗ hổng 1 (Flat Editor Privilege):* Bất kỳ ai được gán vai trò `editor` đều có thể sửa đổi hoặc xóa bất kỳ ai trong toàn bộ dòng họ, không phân biệt chi nhánh.
  - *Lỗ hổng 2 (Direct Client-Side Mutation):* Ứng dụng để client-side Supabase SDK trực tiếp gọi `insert/update` bảng `persons` mà không bắt buộc đi qua Server Action có Transaction và Rate-limit.
  - *Lỗ hổng 3 (Bảo vệ thông tin người còn sống):* Bảng `persons` mở quyền SELECT cho toàn bộ `authenticated` đã kích hoạt (`is_active_user()`), do đó mọi thành viên đều thấy được ngày sinh, quê quán của tất cả người còn sống trong họ. Cần có chế độ che mờ (masking) đối với người ngoài hoặc khách.

### 1.3. An toàn Tải lên Tệp tin (File Upload Security)
- **Kiểm tra loại tệp:** Hàm `readImageType` trong `utils/imageUpload.ts` kiểm tra Magic Bytes ở đầu tệp nhị phân (Header bytes: JPEG `FF D8 FF`, PNG `89 50 4E 47`, GIF `47 49 46 38`, WebP `52 49 46 46`), từ chối tệp tin giả mạo đuôi mở rộng (ví dụ file script đổi đuôi thành `.jpg`).
- **Giới hạn kích thước:** Bucket `avatars` giới hạn 2MB; bucket `gallery` giới hạn 10MB sau khi nén client-side.
- **Quyền riêng tư của Storage:** Cả 2 bucket đều đặt `public = false`. Ảnh chỉ được xem qua Signed URLs có thời hạn (1h - 24h), được bảo vệ bởi RLS của Storage objects.

### 1.4. Phòng chống XSS, CSRF & CSV Injection
- **XSS:** Next.js React 19 tự động escape toàn bộ nội dung hiển thị trong JSX; không phát hiện việc dùng `dangerouslySetInnerHTML` tùy tiện trên dữ liệu người dùng nhập.
- **CSV Injection:** Tại `utils/csv.ts`, các ô dữ liệu bắt đầu bằng các ký tự nguy hiểm (`=`, `+`, `-`, `@`) đều được tự động thêm dấu nháy đơn `'` ở đầu khi xuất file để ngăn chặn thực thi mã macro trên Microsoft Excel.

### 1.5. Quản lý Khóa Bí mật (Secrets Management)
- Các biến môi trường nhạy cảm (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `RESEND_API_KEY`) được lưu trong `.env.local` và không có tiền tố `NEXT_PUBLIC_*`.
- File `.gitignore` đã có cấu hình loại trừ `.env*.local`.

---

## 2. ĐÁNH GIÁ HIỆU NĂNG HỆ THỐNG THEO QUY MÔ (PERFORMANCE BENCHMARK AUDIT)

*(Lưu ý: Đánh giá dưới đây dựa trên phân tích cấu trúc mã nguồn, độ phức tạp thuật toán và mô hình bộ nhớ. Hệ thống chưa chạy benchmark tải thực nghiệm bằng k6/Artillery).*

| Mốc quy mô | Thời gian nạp dữ liệu Server | Kích thước Payload JSON | Bộ nhớ Client & DOM Nodes | Trải nghiệm người dùng trên Cây | Đánh giá & Rủi ro |
|---|---|---|---|---|---|
| **100 thành viên** (Gia đình nhỏ) | ~50ms - 100ms | < 80 KB | Rất nhẹ (~150 DOM nodes) | Cực kỳ mượt mà, 60 FPS cả trên di động. | **HOÀN TOÀN TỐT (PASSED).** |
| **500 thành viên** (Một Chi họ) | ~150ms - 250ms | ~350 KB | Trung bình (~800 DOM nodes) | Mượt mà trên Desktop; trên điện thoại đời cũ có thể hơi khựng khi cuộn nhanh. | **ĐẠT YÊU CẦU.** |
| **1.000 thành viên** (Dòng họ trung bình) | ~400ms - 800ms | ~800 KB | Nặng (~1.800 DOM nodes) | Bắt đầu xuất hiện độ trễ (layout thrashing) khi mở rộng nhiều nhánh cùng lúc do hàm `equalizeNodeHeights`. | **CẦN TỐI ƯU.** Cần bật mặc định auto-collapse ở cấp độ 3. |
| **5.000 thành viên** (Đại tộc họ Chu) | > 2.5s - 4.0s (Server query + serialization) | > 4.5 MB | **RẤT NẶNG.** Gây tràn bộ nhớ trình duyệt di động (> 8.000 DOM nodes). | Đơ trình duyệt điện thoại; xuất ảnh PDF bị lỗi Canvas Out-of-Memory. | **NGUY CƠ CAO (BOTTLENECK).** Bắt buộc phải áp dụng phân trang cây theo Chi nhánh và kỹ thuật ảo hóa (Virtualization). |

### Phân tích Điểm nghẽn Hiệu năng cốt lõi (Core Performance Bottlenecks)
1. **Truy vấn tải toàn bộ (Unbounded Fetch):**
   Tại `app/dashboard/members/page.tsx`, câu lệnh `fetchAllRowsOrThrow` tải toàn bộ thành viên không phân trang. Khi dữ liệu lên 5.000 người, serverless function của Vercel có thể chạm giới hạn thời gian phản hồi (Timeout).
2. **Đo chiều cao DOM đồng bộ (`equalizeNodeHeights`):**
   Hàm này duyệt qua toàn bộ các node card trên màn hình để cân bằng chiều cao bằng JavaScript sau mỗi lần render. Khi có hàng trăm thẻ, thao tác này gây hiện tượng Forced Synchronous Layout.

---

## 3. KIỂM TOÁN CHẤT LƯỢNG MÃ NGUỒN & TEST COVERAGE (QA AUDIT)

### 3.1. Hiện trạng Bộ kiểm thử (Test Suite Status) - VERIFIED
- Tổng số file test trong repo: **58 test files** (`.test.ts`, `.test.tsx`).
- Phạm vi bao phủ rất tốt ở tầng logic thuần túy:
  - `utils/kinship/`: 4 test files kiểm tra chuẩn xác danh xưng, đường đi huyết thống.
  - `utils/lunar-vn.test.ts`: Kiểm tra quy đổi âm dương lịch Việt Nam.
  - `utils/relationshipValidation.test.ts`: Kiểm tra phát hiện vòng lặp, ngày sinh vô lý.
  - `utils/gedcom/`: Kiểm tra import/export GEDCOM.
  - `utils/backupPayload.test.ts`, `utils/csv.test.ts`: Kiểm tra toàn vẹn sao lưu.
- **Lỗ hổng kiểm thử lớn nhất:**
  - Không thể chạy bằng Node runner thông thường vì phụ thuộc `bun:test`.
  - Chưa có bài kiểm thử tự động End-to-End (E2E) bằng Playwright hoặc Cypress cho các luồng giao diện người dùng (User Flows).
  - Chưa có bài kiểm thử chịu tải (Stress/Load Test) với 5.000 bản ghi nhân tạo.

### 3.2. Bảng Ma trận Kiểm thử Edge Cases (Genealogical Edge Cases Matrix)

| Kịch bản kiểm thử (Edge Case) | Kết quả kiểm tra trong mã nguồn | File xử lý logic | Đánh giá |
|---|---|---|---|
| Cụ ông có 3 vợ, mỗi vợ sinh 2 con | **Đã xử lý đúng.** Con được gán đúng cha và mẹ tương ứng; thứ tự sinh tính riêng hoặc chung. | `utils/lineageCompute.ts`, `FamilyTreeNodeRenderer.tsx` | ĐẠT |
| Nhận con nuôi (Adopted child) | **Đã xử lý đúng.** Bỏ qua các kiểm tra tuổi sinh học bắt buộc (dưới 12 tuổi). | `utils/dataChecks.ts` | ĐẠT |
| Thành viên mất trong tháng nhuận âm lịch | **Đã xử lý đúng.** Tự động tính đúng giỗ vào tháng nhuận của các năm sau có tháng nhuận. | `utils/lunarCalendar.ts` | ĐẠT |
| Thành viên mất ngày 30 của tháng thiếu âm lịch | **Đã xử lý đúng.** Tự động lùi về ngày 29 nếu năm đó tháng đó chỉ có 29 ngày. | `docs/vi/tinh-nang.md`, `utils/eventHelpers.ts` | ĐẠT |
| Thêm cháu làm cha của ông (Vòng lặp quan hệ) | **Bị chặn thành công.** Ứng dụng từ chối lưu và báo lỗi. | `utils/relationshipValidation.ts` | ĐẠT |
| Con sinh ra sau khi mẹ mất | **Bị chặn thành công.** | `utils/relationshipValidation.ts` | ĐẠT |
| Trùng họ tên và năm sinh | **Cảnh báo xác nhận.** Ứng dụng hiển thị danh sách người nghi trùng trước khi lưu. | `utils/duplicatePeople.ts` | ĐẠT |
| Người không có cha mẹ và không có vợ chồng (Độc thân mồ côi) | Được gán làm Root độc lập ở Đời 1. | `utils/lineageCompute.ts` | Cần cho phép gán thuộc Chi cụ thể. |

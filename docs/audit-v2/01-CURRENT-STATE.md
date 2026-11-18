# 01. BÁO CÁO HIỆN TRẠNG HỆ THỐNG VÀ KIẾN TRÚC KỸ THUẬT (CURRENT STATE AUDIT)

**Dự án:** Gia Phả OS (Ứng dụng cho Gia Phả Họ Chu)  
**Phiên bản kiểm toán:** 2.5.1  
**Thời điểm thực hiện:** 17/11/2026  
**Trạng thái kiểm toán:** HOÀN TOÀN KHÁCH QUAN, DỰA TRÊN MÃ NGUỒN VÀ CẤU HÌNH THỰC TẾ (CODE-BASED AUDIT)

---

## 1. TỔNG QUAN KIẾN TRÚC VÀ CÔNG NGHỆ (TECH STACK)

### 1.1. Frontend & Giao diện người dùng
- **Core Framework:** Next.js `16.4.6` (App Router) chạy trên React `19.3.1` và React DOM `19.3.1`.
- **Ngôn ngữ:** TypeScript `6.0.3` (chế độ strict, `tsc --noEmit` kiểm tra không lỗi).
- **Styling Engine:** Tailwind CSS `4.3.5` tích hợp qua `@tailwindcss/postcss`. Dự án áp dụng bộ Design Tokens định nghĩa tại `DESIGN.md` (bảng màu ấm truyền thống: đá sẫm `#1c1917`, hổ phách `#d97706`, nền ngà `#fafaf9`).
- **Icons & Animation:** `lucide-react` (v1.73.0), `framer-motion` (v14.14.0 - cấu hình lazy qua MotionProvider và motionFeatures).
- **Trực quan hóa đồ thị gia phả (Genealogy Visualization):**
  - Cây chính (*FamilyTree*): Dựng bằng cây DOM thuần HTML/CSS (`<ul>`, `<li>` lồng nhau kết hợp `TreeLinesStyle` và connector CSS borders) kết hợp `usePanZoom` quản lý tọa độ, scale, pointer events, drag & touch pinch.
  - Sơ đồ tư duy (*MindmapTree*) & Bong bóng (*BubbleMapTree*): Dùng D3 (`d3-zoom`, `d3-force`, `d3-selection`, `d3-transition`, `d3-drag`).
- **Xử lý tệp & Xuất bản:** `html-to-image` (v1.11.13), `jspdf` (v4.2.1), `jszip` (v3.10.2), `papaparse` (v5.7.1).
- **Lịch & Thời gian:** `dayjs` (v1.11.23) kết hợp thuật toán tính Âm lịch Việt Nam múi giờ UTC+7 của Hồ Ngọc Đức (`utils/lunar-vn.ts`), xuất chuẩn iCalendar `ical.js` (v2.2.1).

### 1.2. Backend & API Architecture
- **Kiến trúc:** Next.js Server Actions kết hợp Route Handlers (RESTful endpoints).
- **Server Actions chính (`app/actions/`):**
  - `member.ts`: Xóa thành viên (`deleteMemberProfile`), cập nhật đời con cháu (`updateDescendantGenerationsAction`).
  - `data.ts`: Xuất/nhập sao lưu JSON, CSV, phục hồi dữ liệu (`restoreBackupAction`, `appendImportAction`).
  - `duplicateScan.ts`: Quét các cặp thành viên nghi trùng lặp.
  - `mergePersons.ts`: Gộp 2 hồ sơ trùng lặp vào một thông qua RPC `private.merge_persons`.
  - `dataCheck.ts`: Kiểm tra toàn vẹn dữ liệu phả hệ (vòng lặp, ngày sinh bất hợp lý).
  - `lunarRecompute.ts`: Rà soát và tính lại ngày mất âm lịch.
  - `migrations.ts`: Quản lý chạy SQL migrations trực tiếp từ giao diện `/dashboard/upgrade`.
  - `user.ts`: Quản lý người dùng, duyệt thành viên.
- **Route Handlers (`app/api/` & `app/auth/`):**
  - `app/api/avatar/route.ts`: Ký hoặc stream ảnh đại diện với kiểm tra xác thực.
  - `app/api/admin/approve/[token]/route.ts`: Endpoint xử lý duyệt tài khoản qua email 1 chạm (one-time approval link token).
  - `app/auth/callback/route.ts`: OAuth callback handler (Google/Facebook Supabase exchange).
- **Lưu ý nghiệp vụ:** Thao tác thêm/sửa thành viên thông thường được thực hiện trực tiếp từ Client component thông qua Supabase Client SDK (`utils/memberForm/save.ts`), chịu sự kiểm soát của PostgreSQL Row Level Security (RLS).

### 1.3. Cơ sở dữ liệu, ORM & Migrations
- **Hệ quản trị:** PostgreSQL 15+ lưu trữ trên nền tảng Supabase Cloud.
- **ORM / Query Builder:** Không sử dụng ORM truyền thống (Prisma hay Drizzle). Sử dụng trực tiếp Supabase JS Client (`@supabase/supabase-js` v2.119.0) với PostgREST Data API, kết hợp thư viện `postgres` (v4.1.1) thuần cho các tác vụ DDL / migration nội bộ.
- **Quản lý Schema & Migration:**
  - Thư mục migrations: `docs/migrations/*.sql` gồm 16 file migration đánh số theo thời gian (từ tháng 3/2026 đến tháng 11/2026).
  - Quá trình chạy migration được tự động hóa qua trang `/dashboard/upgrade` sử dụng chuỗi kết nối `SUPABASE_DB_URL` trực tiếp tới Postgres session pooler.
  - Cấu trúc cơ sở dữ liệu hoàn chỉnh nằm tại `docs/schema.sql` và `docs/full_bundle.sql`.

### 1.4. Cơ chế Xác thực & Phân quyền (Authentication & Authorization)
- **Authentication:** Supabase Auth (hỗ trợ Email + Mật khẩu, có hạ tầng hỗ trợ OAuth Google, Facebook).
- **Quản lý Session:** `@supabase/ssr` (v0.12.7) kết hợp Next.js Middleware (`proxy.ts` / `utils/supabase/middleware.ts`) đồng bộ phiên làm việc qua HTTP-only cookies.
- **Mô hình Phân quyền (RBAC):**
  - Gồm 3 vai trò: `admin`, `editor`, `member`.
  - Bảng `public.profiles` liên kết 1-1 với `auth.users(id)`.
  - Khóa bảo mật RLS được thực thi ở tầng DB qua các hàm SQL `SECURITY DEFINER`:
    - `public.is_admin()`: Chỉ cho phép admin.
    - `public.is_editor()`: Cho phép editor.
    - `public.is_active_user()`: Kiểm tra tài khoản đã được phê duyệt (`is_active = true`).
  - Người đăng ký đầu tiên tự động trở thành `admin` và `is_active = true` (thông qua trigger `handle_new_user()` và advisory lock `pg_advisory_xact_lock`). Các tài khoản tiếp theo mặc định là `member`, `is_active = false`, phải đợi admin phê duyệt.

### 1.5. Hệ thống Lưu trữ Tệp (File Storage)
- **Supabase Storage:**
  - Bucket `avatars`: Chứa ảnh chân dung thành viên (giới hạn 2MB/ảnh, private, chỉ cho phép ảnh JPG/PNG/GIF/WEBP; cấp signed URL có thời hạn 24 giờ và lưu cache bộ nhớ đệm server).
  - Bucket `gallery`: Chứa ảnh tư liệu/sự kiện gia đình (giới hạn 10MB/ảnh sau nén WebP, private, cấp signed URL có thời hạn 1 giờ).
- **Bảo vệ tải lên:** Kiểm tra Magic bytes đầu file (`utils/imageUpload.ts`) trước khi đẩy lên Storage, tự động nén client-side về cạnh tối đa 2048px định dạng WebP.

### 1.6. Hạ tầng Triển khai & Dịch vụ Bên thứ ba
- **Hosting:** Sẵn sàng cho Vercel (Next.js serverless) hoặc Docker container (có sẵn `Dockerfile` multi-stage build và `docker-compose.yml`).
- **Gửi Email thông báo:** Tích hợp Resend API (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) gửi email cho admin khi có tài khoản mới đăng ký kèm token phê duyệt 1-click.

---

## 2. KIỂM TOÁN CHẤT LƯỢNG MÃ NGUỒN, TECHNICAL DEBT & DEPENDENCY RISKS

### 2.1. Đánh giá kiểm thử (Testing Audit) - VERIFIED
- **Thực tế:** Hệ thống có 58 file kiểm thử đơn vị (`*.test.ts`, `*.test.tsx`) phủ khắp các thư viện tiện ích (Gedcom, Kinship, Lunar, RelationshipValidation, Backup, UI Components).
- **Vấn đề phát hiện (CRITICAL TEST RUNNER BOTTLENECK):**
  - Tất cả các bài test đều import từ runtime `bun:test` (`import { describe, it, expect } from 'bun:test'`).
  - Lệnh `npm test` trong `package.json` trỏ thẳng tới `bun test`.
  - Trên các môi trường CI/CD tiêu chuẩn hoặc máy tính không cài sẵn Bun (chẳng hạn môi trường Windows thông thường dùng Node/npm), `npm test` **thất bại hoàn toàn** do không nhận diện được lệnh `bun`.
  - *Bằng chứng:* Lệnh `bun test` báo lỗi `CommandNotFoundException` trên terminal hệ thống.
  - *Khuyến nghị:* Cần cấu hình Vitest hoặc Jest làm test runner tiêu chuẩn để dự án độc lập với runtime Bun, hoặc thiết lập workflow Bun rõ ràng trên CI.

### 2.2. Kiểm tra Static Typing & Linter - VERIFIED
- **Typecheck:** Chạy `npm run typecheck` (`tsc --noEmit`) đạt mã thoát **0** (không phát sinh lỗi type).
- **Linter:** Chạy `npm run lint` (`eslint --max-warnings 0`) đạt mã thoát **0** (tuân thủ nghiêm ngặt chuẩn cấu hình ESLint).

### 2.3. Đánh giá Technical Debt & Rủi ro Kiến trúc
1. **Thắt cổ chai tải dữ liệu cây gia phả (Full Data Fetch Pattern):**
   - Tại route `/dashboard/members/page.tsx`, hệ thống thực hiện `fetchAllRowsOrThrow` toàn bộ bảng `persons` và `relationships` vào bộ nhớ Node server rồi đẩy xuống client.
   - Khi dòng họ Chu đạt quy mô thực tế (hàng nghìn thành viên), việc serialize toàn bộ danh sách và vẽ hàng ngàn DOM nodes sẽ gây sụt giảm FPS nghiêm trọng và đơ giao diện mobile.
2. **Khuyết thiếu hoàn toàn mô hình Chi / Nhánh ở Database:**
   - Cột `generation`, `is_in_law`, `birth_order` được lưu tĩnh trong bảng `persons`.
   - Không có bảng `branches` hoặc `branch_members`. Khái niệm "chi/nhánh" hiện chỉ là nhánh cây suy diễn trên đồ thị (graph branch) chứ không phải thực thể nghiệp vụ có thể đặt tên, phân quyền hay tìm kiếm độc lập.
3. **Cơ chế ghi trực tiếp từ Client (Direct Client Mutation):**
   - Các thao tác cập nhật phả hệ quan trọng phụ thuộc trực tiếp vào client-side Supabase client kết hợp RLS thay vì đi qua Server Actions tập trung có Transaction quản lý toàn vẹn dữ liệu, kiểm toán Audit Log và kiểm tra chống xung đột đồng thời.
4. **Không có Audit Trail (Lịch sử chỉnh sửa):**
   - Cơ sở dữ liệu chỉ có trigger `handle_updated_at` ghi đè thời điểm `updated_at`. Khi một Editor chỉnh sửa sai hoặc xóa nhầm mối quan hệ, hệ thống **không lưu lại ai đã sửa, giá trị cũ là gì, và không có cơ chế hoàn tác (Rollback)**.

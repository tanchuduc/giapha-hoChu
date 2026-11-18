# 03. PHÂN TÍCH NGHIỆP VỤ VÀ CÁC LUỒNG SỬ DỤNG (BUSINESS DOMAIN & FLOWS)

**Dự án:** Gia Phả OS (Gia Phả Họ Chu)  
**Tập trung:** Nghiệp vụ dòng họ Việt Nam truyền thống, dòng tộc quy mô lớn nhiều chi phái, tính chính xác phả hệ và trải nghiệm người dùng đa thế hệ.

---

## 1. MÔ HÌNH NGHIỆP VỤ DÒNG HỌ VIỆT NAM (DÒNG HỌ CHU)

### 1.1. Đặc thù Phả hệ dòng họ Chu và quy mô lớn
1. **Phân cấp Thế hệ & Chi phái (Hierarchy of Lineage & Branches):**
   - Bắt đầu từ Thủy Tổ (Đời 1), phát triển qua các đời thành các Chi lớn (Chi Trưởng, Chi Hai, Chi Ba...), dưới Chi có các Nhánh (Phân chi), dưới Nhánh có các Cành/Nhánh nhỏ.
   - Mỗi chi nhánh thường có Nhà thờ chi, Trưởng chi, ngày giỗ tổ chi riêng bên cạnh Ngày giỗ Thủy tổ toàn họ tại Từ đường chính.
2. **Quy tắc Tính Đời (Generation Indexing):**
   - Đời 1: Thủy Tổ dòng họ.
   - Đời con: Đời 2; Đời cháu: Đời 3... Tiếp nối từ 10 đến 20+ thế hệ.
   - Dâu/Rể được quy vào cùng thế hệ (generation) với người phối ngẫu, nhưng mang cờ `is_in_law = true` để không tính gộp vào mạch truyền thừa huyết thống nam giới (đối với dòng tộc phụ hệ).
3. **Quan hệ Hôn nhân & Đa thê truyền thống:**
   - Trong lịch sử dòng tộc Việt Nam thời phong kiến/tiền cận đại, việc các cụ có nhiều vợ (Vợ cả/Chính thất, Vợ hai/Kế thất, Vợ ba/Trắc thất) là phổ biến.
   - Con cái sinh ra phải được gắn chính xác với người mẹ đẻ trực tiếp, đồng thời giữ nguyên mối liên kết chung với người cha.
4. **Vấn đề Danh xưng & Tên gọi:**
   - Người Việt có: Họ tên chính thức, Tên chữ, Tên tự, Tên hiệu, Tên húy (tên kiêng kị thời xưa), Tên thường gọi trong làng.
   - Trùng tên là hiện tượng rất phổ biến qua các đời (ví dụ nhiều đời đều có người tên Chu Văn An, Chu Văn Nam...), bắt buộc phải phân biệt bằng: Năm sinh, Đời thứ, Chi nhánh, Tên thân phụ/thân mẫu.
5. **Văn hóa Giỗ chạp, Mộ phần & Âm lịch:**
   - Mọi lễ giỗ bắt buộc phải tính theo Âm lịch Việt Nam (múi giờ UTC+7).
   - Khái niệm "Giỗ đầu" (sau 1 năm mất), năm nhuận, tháng thiếu 29 ngày phải được quy đổi chính xác.
   - Nơi an táng (mộ phần, nghĩa trang dòng họ, tọa độ địa lý) là thông tin tâm linh cực kỳ quan trọng đối với con cháu mỗi dịp Thanh minh và Tảo mộ cuối năm.

---

## 2. PHÂN TÍCH CHI TIẾT 10 USER FLOWS QUAN TRỌNG

Mỗi luồng được mô tả theo đặc tả chuẩn:
**Actor → Preconditions → Trigger → Steps → Validation → Success → Exception → Data Changes.**

---

### FLOW 01: Khởi tạo gia phả (Lineage Initialization)
- **Actor:** Trưởng tộc / Quản trị viên cấp cao (Master Admin).
- **Preconditions:** Hệ thống mới được thiết lập (hoặc cơ sở dữ liệu trống). Admin đã đăng nhập tài khoản đầu tiên.
- **Trigger:** Admin truy cập màn hình khởi tạo hoặc tạo hồ sơ đầu tiên.
- **Steps:**
  1. Admin nhập thông tin Thủy Tổ (Họ Chu, Giới tính Nam, Đời 1).
  2. Nhập thông tin Tổ Mẫu (Phối ngẫu của Thủy Tổ).
  3. Xác định các Chi phái chính (Chi Trưởng, Chi Hai, Chi Ba...) tương ứng với các con trai của Thủy Tổ/Đời 2.
  4. Lưu thông tin khởi tạo.
- **Validation:** Thủy Tổ phải có tên họ hợp lệ, giới tính xác định, đời thứ mặc định là 1.
- **Success:** Cây gia phả hiển thị Thủy Tổ làm Root node; cơ sở dữ liệu xác lập mốc thế hệ đầu tiên.
- **Exception:** Nếu người khởi tạo không có quyền Admin, hệ thống từ chối thao tác.
- **Data Changes:** Tạo 2 bản ghi trong `persons`, 1 bản ghi `marriage` trong `relationships`.
- **Đánh giá hiện trạng:**
  - *Hiện tại:* Codebase xử lý bằng cách tạo thủ công từng người rồi tự động dò root bằng BFS (`utils/treeRoot.ts`). Chưa có Wizard hướng dẫn khởi tạo dòng họ chuyên nghiệp; chưa có thực thể lưu thông tin Chi phái.

---

### FLOW 02: Thêm thành viên mới (Add Member)
- **Actor:** Admin, Editor (hoặc Trưởng chi ở V2).
- **Preconditions:** Đã đăng nhập, có quyền biên tập (`admin` hoặc `editor`).
- **Trigger:** Bấm nút "Thêm thành viên" trên thanh công cụ hoặc bấm vào node trên Cây gia phả.
- **Steps:**
  1. Chọn vị trí gắn kết: Cha/mẹ, Vợ/chồng, hoặc Con của ai trên cây.
  2. Mở Modal/Form nhập thông tin: Họ tên, Tên húy, Giới tính, Ngày tháng năm sinh (Dương lịch/Âm lịch).
  3. Chọn tình trạng: Còn sống hay Đã mất. Nếu đã mất: Nhập ngày mất, ngày giỗ âm, nơi an táng.
  4. Tải lên ảnh đại diện chân dung (tùy chọn).
  5. Hệ thống quét kiểm tra trùng lặp thời gian thực (tên + năm sinh).
  6. Bấm "Lưu thành viên".
- **Validation:** Tên không được rỗng; Năm mất không được trước năm sinh; Ngày sinh/mất không vượt quá thời gian hiện tại.
- **Success:** Thành viên được lưu vào DB, xuất hiện ngay lập tức trên Cây gia phả tại đúng nhánh; thế hệ và thứ tự sinh được tự động cập nhật.
- **Exception:**
  - Trùng lặp với thành viên đã có: Cảnh báo danh sách người nghi trùng, yêu cầu người dùng xác nhận "Tiếp tục tạo mới" hoặc "Hủy bỏ".
  - Mất kết nối mạng: Lưu nháp nội bộ và thông báo thử lại.
- **Data Changes:** Thêm dòng vào `persons`, tạo bản ghi quan hệ tương ứng trong `relationships`, tải ảnh lên bucket `avatars`.
- **Đánh giá hiện trạng:** *Đã hoạt động tốt ở mức cơ bản, nhưng thiếu tính năng chọn nhanh Chi nhánh và chưa hỗ trợ phân bước nhập liệu trên di động.*

---

### FLOW 03: Thêm vợ/chồng và con (Spouse & Children Addition)
- **Actor:** Admin, Editor.
- **Preconditions:** Thành viên gốc đã tồn tại trên cây.
- **Trigger:** Trên trang hồ sơ cá nhân hoặc modal quan hệ, chọn "Thêm vợ/chồng" hoặc "Thêm con".
- **Steps:**
  1. Để thêm vợ/chồng: Chọn "Thêm nhanh phối ngẫu", nhập họ tên, năm sinh, thứ bậc (nếu có).
  2. Để thêm con: Chọn cặp cha-mẹ (rất quan trọng khi người cha có nhiều vợ), nhập danh sách các con (họ tên, giới tính, năm sinh, con thứ).
  3. Xác nhận lưu.
- **Validation:**
  - Không cho phép kết hôn với chính mình hoặc người cùng trực hệ một chiều.
  - Con ruột không thể sinh trước cha mẹ; mẹ không thể mất trước khi sinh con; cha mất quá 10 tháng trước khi con sinh phải có cảnh báo xác nhận.
- **Success:** Quan hệ hôn nhân (`marriage`) và quan hệ phụ tử/mẫu tử (`biological_child` hoặc `adopted_child`) được thiết lập nguyên tử (atomic).
- **Exception:** Lỗi vi phạm quan hệ vòng lặp (Circular relationship) bị chặn ngay lập tức.
- **Data Changes:** Tạo bản ghi trong `persons` và `relationships`.

---

### FLOW 04: Sửa thông tin & Quy trình phê duyệt (Edit & Approval Workflow)
- **Actor:**
  - Thành viên thông thường (`member`): Người đề xuất.
  - Trưởng chi / Admin: Người phê duyệt.
- **Preconditions:** Thành viên đã đăng nhập tài khoản gắn với dòng họ.
- **Trigger:** Thành viên xem hồ sơ của mình hoặc người thân trong gia đình nhỏ của mình, thấy thông tin sai sót (sai ngày sinh, thiếu nơi an táng, sai ảnh) và bấm "Đề xuất chỉnh sửa".
- **Steps:**
  1. Thành viên chỉnh sửa các trường cần thay đổi trên giao diện đề xuất.
  2. Cung cấp lý do hoặc ảnh chụp giấy tờ/gia phả gia đình làm bằng chứng.
  3. Gửi đề xuất → Hệ thống đưa vào danh sách chờ duyệt (Pending Proposals).
  4. Trưởng chi/Admin nhận thông báo, mở màn hình kiểm tra Diff (so sánh giá trị Cũ vs Mới).
  5. Admin bấm "Phê duyệt" (Áp dụng vào gia phả chính) hoặc "Từ chối" (Kèm lý do phản hồi).
- **Validation:** Dữ liệu đề xuất phải tuân thủ toàn bộ quy tắc logic gia phả.
- **Success:** Khi duyệt, dữ liệu chính thức được cập nhật, ghi lại vết trong Audit Log; người đề xuất nhận thông báo kết quả.
- **Exception:** Đề xuất gây xung đột dữ liệu với một cập nhật khác vừa diễn ra.
- **Data Changes:** Ghi vào bảng `change_requests`; khi duyệt, cập nhật `persons` và ghi `audit_logs`.
- **Đánh giá hiện trạng:**
  - *Hiện tại:* **HOÀN TOÀN THIẾU LUỒNG NÀY (MISSING - GAP LỚN NHẤT).** Thành viên thường không có quyền đề xuất; Editor sửa là ghi đè thẳng vào DB mà không qua phê duyệt hay lưu lịch sử.

---

### FLOW 05: Khám phá gia phả (Genealogy Exploration)
- **Actor:** Toàn bộ thành viên dòng họ (kể cả người cao tuổi và thanh thiếu niên).
- **Preconditions:** Đã đăng nhập vào hệ thống.
- **Trigger:** Người dùng vào trang Cây gia phả hoặc Danh sách thành viên.
- **Steps:**
  1. Người dùng chọn chế độ xem: Cây truyền thống (Tree), Mindmap, hoặc Danh sách.
  2. Chọn xem Toàn họ Chu hoặc Lọc theo một Chi phái nhất định (Chi Trưởng, Chi Hai...).
  3. Bấm vào một thành viên:
     - Chọn "Xem hồ sơ đầy đủ": Mở trang chi tiết, tiểu sử, ảnh kỷ niệm.
     - Chọn "Xem tổ tiên": Cây tự động highlight và mở đường dẫn ngược về Thủy Tổ.
     - Chọn "Xem hậu duệ": Mở toàn bộ các nhánh con cháu của người đó.
     - Chọn "Tìm xưng hô": Tự động mở công cụ tính danh xưng giữa người đó với tài khoản đang đăng nhập.
- **Validation:** Tốc độ render dưới 1.5 giây; không bị đơ trình duyệt.
- **Success:** Người dùng di chuyển mượt mà giữa các thế hệ mà không bị lạc hướng.
- **Đánh giá hiện trạng:**
  - *Hiện tại:* Đã có Cây, Mindmap, Danh sách và Danh xưng. Tuy nhiên chưa có bộ lọc Chi phái và chưa có tính năng 1-click truy vết dòng tổ tiên trực hệ (Path to Ancestor).

---

### FLOW 06: Tìm kiếm thành viên (Member Search)
- **Actor:** Mọi người dùng.
- **Preconditions:** Đã đăng nhập.
- **Trigger:** Bấm phím tắt `Ctrl/Cmd + K` hoặc bấm vào ô tìm kiếm trên thanh tiêu đề.
- **Steps:**
  1. Gõ từ khóa tìm kiếm (họ tên có dấu hoặc không dấu, ví dụ: "chu van", "an").
  2. Bổ sung bộ lọc nâng cao (tùy chọn): Lọc theo Đời, Lọc theo Chi, Năm sinh, Trạng thái còn sống/đã mất.
  3. Danh sách kết quả hiển thị tối đa 20 người khớp nhất kèm thông tin đời, năm sinh, tên cha/mẹ để phân biệt người trùng tên.
  4. Bấm vào kết quả: Hệ thống tự động cuộn màn hình và focus đúng node của người đó trên Cây gia phả.
- **Validation:** Chuẩn hóa tiếng Việt (loại bỏ dấu, chuyển ký tự `đ` thành `d`, xử lý khoảng trắng thừa).
- **Success:** Định vị chính xác thành viên trong vòng 300ms.
- **Đánh giá hiện trạng:** *Module `GlobalMemberSearch` và `utils/search.ts` hoạt động rất tốt, đã hỗ trợ tìm không dấu và focus trên cây.*

---

### FLOW 07: Mời người thân tham gia & Gắn kết hồ sơ (Member Invitation & Claiming)
- **Actor:** Admin, Editor, Thành viên.
- **Preconditions:** Thành viên đã có hồ sơ Person trên cây nhưng chưa có tài khoản User.
- **Trigger:** Admin bấm "Tạo link mời thành viên" tại hồ sơ của một nhân vật.
- **Steps:**
  1. Hệ thống sinh một liên kết mời an toàn kèm mã xác thực có thời hạn (Invite Token).
  2. Người thân nhận link qua Zalo/Email, mở link và đăng ký tài khoản (Google hoặc Email).
  3. Hệ thống tự động liên kết tài khoản Auth User vừa đăng ký với hồ sơ Person tương ứng trên cây.
  4. Gán quyền thành viên và thông báo cho Trưởng chi/Admin.
- **Validation:** Mỗi hồ sơ Person chỉ được liên kết với tối đa 1 tài khoản Auth User đang hoạt động; token phải còn hạn và chưa qua sử dụng.
- **Success:** Thành viên đăng nhập thành công và thấy ngay hồ sơ của mình được highlight, có quyền cập nhật thông tin cá nhân của bản thân và con cháu trực tiếp.
- **Exception:** Người dùng nhận nhầm hồ sơ: Cho phép Admin hủy liên kết và xác minh lại.
- **Data Changes:** Cập nhật trường `user_id` trong hồ sơ Person (ở V2) hoặc bảng `user_person_links`.
- **Đánh giá hiện trạng:**
  - *Hiện tại:* **HOÀN TOÀN THIẾU CƠ CHẾ GẮN KẾT NÀY.** Hồ sơ gia phả (`persons`) và tài khoản đăng nhập (`profiles` / `auth.users`) hoàn toàn độc lập với nhau, không có quan hệ liên kết nào trong cơ sở dữ liệu.

---

### FLOW 08: Số hóa gia phả giấy có kiểm soát (Controlled Paper Digitization)
- **Actor:** Ban quản trị số hóa dòng họ / Admin.
- **Preconditions:** Có cuốn gia phả họ Chu bản in chữ Quốc ngữ (file PDF scan hoặc ảnh chụp các trang sách).
- **Trigger:** Admin truy cập module "Số hóa gia phả" tại `/dashboard/digitization`.
- **Steps:**
  1. Tải lên tập tin PDF scan hoặc ảnh trang gia phả giấy.
  2. Hệ thống thực hiện OCR tiếng Việt và phân tích cấu trúc văn bản phả hệ.
  3. AI trích xuất sơ bộ danh sách thực thể: Thành viên, Quan hệ cha con, vợ chồng, đời thứ, ngày giỗ âm.
  4. **Khu vực cách ly (Staging Review):** Toàn bộ dữ liệu trích xuất nằm ở bảng tạm `staging_persons` và `staging_relationships`, **TUYỆT ĐỐI CHƯA ĐƯỢC GHI VÀO GIA PHẢ CHÍNH THỨC**.
  5. Màn hình đối chiếu song song (Side-by-side): Bên trái là ảnh chụp trang sách gốc, bên phải là dữ liệu AI bóc tách.
  6. Ban biên tập đối chiếu, chỉnh sửa các lỗi sai chính tả/nhận diện sai chữ, xác nhận từng người.
  7. Bấm "Kiểm tra trùng lặp với gia phả hiện có": Hệ thống tự động so khớp đối chiếu với các nhân vật đã có trên hệ thống.
  8. Ban biên tập bấm "Duyệt nhập vào gia phả chính": Hệ thống chuyển dữ liệu vào cây chính kèm liên kết lưu trữ ảnh chụp trang gốc làm bằng chứng lịch sử (Provenance Tracking).
- **Validation:** Bắt buộc phải có xác nhận thủ công của con người (Human-in-the-loop); cấm tự động import hàng loạt mà không qua rà soát.
- **Success:** Gia phả giấy được số hóa chính xác 100%, bảo toàn nguồn gốc tư liệu.
- **Exception:** Chất lượng ảnh chụp quá mờ không thể OCR: Yêu cầu chụp lại hoặc nhập tay có dẫn nguồn.
- **Data Changes:** Ghi dữ liệu vào `staging_*`, sau khi duyệt thì ghi vào `persons`, `relationships` và `historical_sources`.
- **Đánh giá hiện trạng:**
  - *Hiện tại:* **CHƯA CÓ TRONG CODEBASE (MISSING).** Chỉ có import thô dạng JSON, CSV, GEDCOM.

---

### FLOW 09: Xuất và sao lưu gia phả (Export & Backup)
- **Actor:** Admin, Editor.
- **Preconditions:** Đã đăng nhập với quyền quản trị.
- **Trigger:** Truy cập `/dashboard/data` chọn "Sao lưu & Phục hồi" hoặc `/dashboard/lineage/book` chọn in ấn.
- **Steps:**
  1. Chọn phạm vi sao lưu: Toàn bộ dòng họ Chu, hoặc Xuất riêng một Chi/Nhánh.
  2. Chọn định dạng:
     - JSON / CSV: Dùng để sao lưu kỹ thuật, phục hồi khi có sự cố.
     - Phả ký PDF dạng sách: Dùng để in ra giấy đóng tập lưu giữ tại Từ đường hoặc phát cho các gia đình.
     - GEDCOM: Dùng để đồng bộ với các phần mềm phả hệ quốc tế.
  3. Hệ thống nén dữ liệu và tải về máy tính của người dùng.
- **Validation:** Kiểm tra toàn vẹn dữ liệu, lọc bỏ các chuỗi mã độc có nguy cơ CSV Injection (`=`, `+`, `-`, `@`).
- **Success:** Tệp tin tải xuống đầy đủ, mở được và chuẩn hóa font tiếng Việt.
- **Data Changes:** Không thay đổi dữ liệu DB; ghi nhận sự kiện xuất sao lưu vào Audit Log.
- **Đánh giá hiện trạng:** *Đã hoàn thiện tốt với JSON, CSV, GEDCOM và Phả ký in sách.*

---

### FLOW 10: Quản trị phân quyền theo Chi phái (Multi-Branch Governance)
- **Actor:** Master Admin (Tộc trưởng), Branch Admin (Trưởng chi).
- **Preconditions:** Dòng họ đã chia thành các Chi nhánh độc lập.
- **Trigger:** Trưởng chi đăng nhập để quản lý thành viên thuộc chi của mình.
- **Steps:**
  1. Trưởng chi đăng nhập vào hệ thống: Giao diện chỉ cho phép quản trị và chỉnh sửa các thành viên thuộc Chi của mình.
  2. Khi Trưởng chi thêm con cháu hoặc cập nhật ngày mất của người trong chi:
     - Dữ liệu thuộc chi được cập nhật tự động.
     - Nếu có thay đổi ảnh hưởng tới mạch thế hệ toàn họ (thêm đời mới, thay đổi thứ tự chi), hệ thống gửi yêu cầu đồng bộ tới Master Admin.
  3. Master Admin có bảng điều khiển tổng thể để xem tiến độ cập nhật dữ liệu của từng chi nhánh.
- **Validation:** RLS phân quyền theo cấp độ cây: User thuộc Chi A không thể sửa đổi hoặc xóa thành viên thuộc Chi B.
- **Success:** Trách nhiệm số hóa gia phả được san sẻ cho các Chi nhánh mà không sợ làm hỏng dữ liệu chung của cả dòng họ.
- **Data Changes:** Ràng buộc bởi `branch_id` và các chính sách RLS phân cấp.
- **Đánh giá hiện trạng:**
  - *Hiện tại:* **HOÀN TOÀN CHƯA CÓ (MISSING).** Toàn bộ hệ thống hiện đang dùng chung quyền phẳng (Flat RBAC), bất kỳ ai có quyền Editor đều có thể sửa/xóa bất kỳ ai trong cả dòng họ.

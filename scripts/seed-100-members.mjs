// ==============================================================================
// SCRIPT: SEED 100 THÀNH VIÊN GIA TỘC HỌ CHU (ĐẦY ĐỦ KỊCH BẢN PHẢ HỆ V2)
// ==============================================================================

import crypto from 'node:crypto'
import postgres from 'postgres'

const sql = postgres(
  'postgresql://postgres:hoChu%402026%23@db.qcpkigmyhmtzmloxkqpe.supabase.co:5432/postgres',
  { max: 1, connect_timeout: 20, prepare: false }
)

function uuid() {
  return crypto.randomUUID()
}

async function run() {
  console.log('🚀 Bắt đầu kiến tạo hệ thống dữ liệu mẫu 100 nhân vật Dòng họ Chu...')

  // 1. Tạo danh sách 5 Chi Phái chính
  const branchIds = {
    root: uuid(),
    chi1: uuid(),
    chi2: uuid(),
    chi3: uuid(),
    chi4: uuid()
  }

  // 2. Chuẩn bị 100 nhân vật qua 7 đời
  const persons = []
  const relationships = []

  // ĐỜI 1: THỦY TỔ
  const p1 = {
    id: uuid(),
    full_name: 'Chu Đình Khang',
    gender: 'male',
    generation: 1,
    birth_order: 1,
    birth_year: 1785,
    birth_month: 3,
    birth_day: 15,
    death_year: 1860,
    death_month: 8,
    death_day: 12,
    death_lunar_year: 1860,
    death_lunar_month: 7,
    death_lunar_day: 26,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Thụy Phúc Lộc, Tiên Sinh Khang',
    burial_place: 'Khu lăng mộ Thủy Tổ, Đồi Mây (Tọa độ: 21.0285, 105.8542)',
    branch_id: branchIds.root,
    note: 'Thủy tổ khai sơn lập ấp họ Chu, đức độ uy danh, quy tụ đồng tộc khai hoang lập nghiệp.'
  }
  const p1_wife = {
    id: uuid(),
    full_name: 'Nguyễn Thị Đoan',
    gender: 'female',
    generation: 1,
    birth_order: null,
    birth_year: 1788,
    death_year: 1865,
    death_lunar_month: 4,
    death_lunar_day: 18,
    is_deceased: true,
    is_in_law: true,
    other_names: 'Hiệu Từ Thục Chính Thất',
    burial_place: 'Nghĩa trang họ Chu Đồi Cát, bên cạnh lăng Thủy Tổ',
    branch_id: branchIds.root,
    note: 'Chính thất của Thủy tổ, hiền thục mẫu mực, phụng dưỡng mẹ chồng và nuôi dưỡng 4 người con hiếu nghĩa.'
  }
  persons.push(p1, p1_wife)
  relationships.push({ type: 'marriage', person_a: p1.id, person_b: p1_wife.id, note: 'Hôn phối chính thất' })

  // ĐỜI 2: 3 người con trai (Khởi chi) và 1 con gái
  const p2_1 = {
    id: uuid(),
    full_name: 'Chu Danh Nho',
    gender: 'male',
    generation: 2,
    birth_order: 1,
    birth_year: 1810,
    death_year: 1885,
    death_lunar_month: 9,
    death_lunar_day: 5,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Cụ Tú Nho, Khởi Chi Trưởng',
    burial_place: 'Gò Cây Vải, xứ Đồng Vàng',
    branch_id: branchIds.chi1,
    note: 'Cụ Trưởng chi, đỗ Tú tài khoa Giáp Ngọ thời vua Minh Mạng, mở trường dạy học trong vùng.'
  }
  const p2_1_wife = {
    id: uuid(),
    full_name: 'Lê Thị Thục',
    gender: 'female',
    generation: 2,
    birth_order: null,
    birth_year: 1814,
    death_year: 1888,
    death_lunar_month: 2,
    death_lunar_day: 15,
    is_deceased: true,
    is_in_law: true,
    other_names: 'Bà Cả Thục',
    burial_place: 'Nghĩa trang Đồng Vàng',
    branch_id: branchIds.chi1,
    note: 'Hiền thê Cụ Tú Nho, tần tảo chăm lo việc dạy học của chồng.'
  }
  persons.push(p2_1, p2_1_wife)
  relationships.push(
    { type: 'biological_child', person_a: p1.id, person_b: p2_1.id, note: 'Con trai trưởng' },
    { type: 'biological_child', person_a: p1_wife.id, person_b: p2_1.id, note: 'Mẹ đẻ' },
    { type: 'marriage', person_a: p2_1.id, person_b: p2_1_wife.id, note: 'Hôn phối' }
  )

  const p2_2 = {
    id: uuid(),
    full_name: 'Chu Văn Trực',
    gender: 'male',
    generation: 2,
    birth_order: 2,
    birth_year: 1815,
    death_year: 1890,
    death_lunar_month: 11,
    death_lunar_day: 20,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Khởi Chi Hai - Đông Ngàn',
    burial_place: 'Khu nghĩa địa đồi Phượng Hoàng',
    branch_id: branchIds.chi2,
    note: 'Cụ Khởi Chi 2, giỏi nghề mộc dựng nhà rường truyền thống, dựng vì kèo nhà thờ tổ họ Chu.'
  }
  const p2_2_wife = {
    id: uuid(),
    full_name: 'Vũ Thị Nhạn',
    gender: 'female',
    generation: 2,
    birth_order: null,
    birth_year: 1818,
    death_year: 1892,
    is_deceased: true,
    is_in_law: true,
    other_names: 'Bà Cụ Nhạn',
    burial_place: 'Khu đồi Phượng Hoàng',
    branch_id: branchIds.chi2,
    note: 'Chính thất cụ Chu Văn Trực.'
  }
  persons.push(p2_2, p2_2_wife)
  relationships.push(
    { type: 'biological_child', person_a: p1.id, person_b: p2_2.id, note: 'Con trai thứ hai' },
    { type: 'biological_child', person_a: p1_wife.id, person_b: p2_2.id, note: 'Mẹ đẻ' },
    { type: 'marriage', person_a: p2_2.id, person_b: p2_2_wife.id, note: 'Hôn phối' }
  )

  const p2_3 = {
    id: uuid(),
    full_name: 'Chu Đình Nghiêm',
    gender: 'male',
    generation: 2,
    birth_order: 3,
    birth_year: 1820,
    death_year: 1878,
    death_lunar_month: 6,
    death_lunar_day: 10,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Khởi Chi Ba - Thăng Long',
    burial_place: 'Bãi nổi sông Hồng, nay dời về Nghĩa trang Gia Tộc',
    branch_id: branchIds.chi3,
    note: 'Cụ Khởi Chi 3, lên kinh kỳ Thăng Long mở hiệu thuốc bắc giao thương tấp nập.'
  }
  const p2_3_wife = {
    id: uuid(),
    full_name: 'Hoàng Thị Mười',
    gender: 'female',
    generation: 2,
    birth_order: null,
    birth_year: 1824,
    death_year: 1895,
    is_deceased: true,
    is_in_law: true,
    other_names: 'Bà Mười phố Hàng Gai',
    burial_place: 'Nghĩa trang họ Chu',
    branch_id: branchIds.chi3,
    note: 'Chính thất cụ Chu Đình Nghiêm.'
  }
  persons.push(p2_3, p2_3_wife)
  relationships.push(
    { type: 'biological_child', person_a: p1.id, person_b: p2_3.id, note: 'Con trai thứ ba' },
    { type: 'biological_child', person_a: p1_wife.id, person_b: p2_3.id, note: 'Mẹ đẻ' },
    { type: 'marriage', person_a: p2_3.id, person_b: p2_3_wife.id, note: 'Hôn phối' }
  )

  const p2_4 = {
    id: uuid(),
    full_name: 'Chu Thị Ngọc Mai',
    gender: 'female',
    generation: 2,
    birth_order: 4,
    birth_year: 1825,
    death_year: 1895,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Bà Cô Mai',
    burial_place: 'Cánh đồng Hương Cầu',
    branch_id: branchIds.root,
    note: 'Con gái út của Thủy tổ, đoan trang phúc hậu, sau lấy chồng về họ Trần.'
  }
  persons.push(p2_4)
  relationships.push(
    { type: 'biological_child', person_a: p1.id, person_b: p2_4.id, note: 'Con gái út' },
    { type: 'biological_child', person_a: p1_wife.id, person_b: p2_4.id, note: 'Mẹ đẻ' }
  )

  // ĐỜI 3 (Thế hệ thứ 3 - 10 người)
  // Nhánh Chi 1: Con của Chu Danh Nho
  const p3_1 = {
    id: uuid(),
    full_name: 'Chu Danh Phúc',
    gender: 'male',
    generation: 3,
    birth_order: 1,
    birth_year: 1840,
    death_year: 1912,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Cụ Chánh Phúc',
    burial_place: 'Nghĩa trang Tiên Điền',
    branch_id: branchIds.chi1,
    note: 'Từng giữ chức Lý trưởng, công chính liêm minh, được nhân dân trong xã kính nể.'
  }
  const p3_1_wife = {
    id: uuid(),
    full_name: 'Nguyễn Thị Sen',
    gender: 'female',
    generation: 3,
    birth_year: 1845,
    death_year: 1920,
    is_deceased: true,
    is_in_law: true,
    burial_place: 'Nghĩa trang Tiên Điền',
    branch_id: branchIds.chi1,
    note: 'Chính thất cụ Chu Danh Phúc.'
  }
  persons.push(p3_1, p3_1_wife)
  relationships.push(
    { type: 'biological_child', person_a: p2_1.id, person_b: p3_1.id, note: 'Trưởng nam chi 1' },
    { type: 'marriage', person_a: p3_1.id, person_b: p3_1_wife.id, note: 'Hôn phối' }
  )

  const p3_2 = {
    id: uuid(),
    full_name: 'Chu Danh Lộc',
    gender: 'male',
    generation: 3,
    birth_order: 2,
    birth_year: 1845,
    death_year: 1920,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Cụ Hai Lộc',
    burial_place: 'Khu lăng mộ dòng họ Chu',
    branch_id: branchIds.chi1,
    note: 'Cụ phụ trách tế tự, lưu giữ gia phả giấy thời nhà Nguyễn.'
  }
  const p3_2_wife = {
    id: uuid(),
    full_name: 'Trần Thị Huệ',
    gender: 'female',
    generation: 3,
    birth_year: 1848,
    death_year: 1922,
    is_deceased: true,
    is_in_law: true,
    burial_place: 'Khu lăng mộ dòng họ Chu',
    branch_id: branchIds.chi1,
    note: 'Vợ cụ Danh Lộc.'
  }
  persons.push(p3_2, p3_2_wife)
  relationships.push(
    { type: 'biological_child', person_a: p2_1.id, person_b: p3_2.id },
    { type: 'marriage', person_a: p3_2.id, person_b: p3_2_wife.id }
  )

  // Nhánh Chi 2: Con của Chu Văn Trực
  const p3_3 = {
    id: uuid(),
    full_name: 'Chu Văn Trọng',
    gender: 'male',
    generation: 3,
    birth_order: 1,
    birth_year: 1845,
    death_year: 1915,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Cụ Trưởng Chi Hai',
    burial_place: 'Đồi Phượng Hoàng',
    branch_id: branchIds.chi2,
    note: 'Nối nghiệp nghề mộc và xây cất đình chùa nổi tiếng vùng Kinh Bắc.'
  }
  const p3_3_wife = {
    id: uuid(),
    full_name: 'Đỗ Thị Hạnh',
    gender: 'female',
    generation: 3,
    birth_year: 1850,
    death_year: 1928,
    is_deceased: true,
    is_in_law: true,
    burial_place: 'Đồi Phượng Hoàng',
    branch_id: branchIds.chi2,
    note: 'Chính thất cụ Văn Trọng.'
  }
  persons.push(p3_3, p3_3_wife)
  relationships.push(
    { type: 'biological_child', person_a: p2_2.id, person_b: p3_3.id },
    { type: 'marriage', person_a: p3_3.id, person_b: p3_3_wife.id }
  )

  // Nhánh Chi 3: Con của Chu Đình Nghiêm
  const p3_4 = {
    id: uuid(),
    full_name: 'Chu Đình Tuấn',
    gender: 'male',
    generation: 3,
    birth_order: 1,
    birth_year: 1850,
    death_year: 1918,
    is_deceased: true,
    is_in_law: false,
    other_names: 'Cụ Lang Tuấn',
    burial_place: 'Nghĩa trang Thăng Long',
    branch_id: branchIds.chi3,
    note: 'Lương y đức độ, người khởi xướng quỹ tế bần giúp đỡ con cháu họ Chu.'
  }
  const p3_4_wife = {
    id: uuid(),
    full_name: 'Phạm Thị Mơ',
    gender: 'female',
    generation: 3,
    birth_year: 1855,
    death_year: 1932,
    is_deceased: true,
    is_in_law: true,
    burial_place: 'Nghĩa trang Thăng Long',
    branch_id: branchIds.chi3,
    note: 'Vợ cụ Đình Tuấn.'
  }
  persons.push(p3_4, p3_4_wife)
  relationships.push(
    { type: 'biological_child', person_a: p2_3.id, person_b: p3_4.id },
    { type: 'marriage', person_a: p3_4.id, person_b: p3_4_wife.id }
  )

  // ĐỜI 4 (Thế hệ tiền bối thời kháng chiến - 18 người)
  const d4_parents = [p3_1, p3_2, p3_3, p3_4]
  const d4_names = [
    { name: 'Chu Danh Khoa', year: 1875, death: 1950, note: 'Hưởng ứng phong trào Duy Tân, mở lớp dạy chữ Quốc ngữ đầu tiên của làng.' },
    { name: 'Chu Danh Bính', year: 1880, death: 1948, note: 'Liệt sĩ tiền khởi nghĩa, hi sinh kiên cường, huân chương Độc Lập hạng Ba.' },
    { name: 'Chu Danh Giáp', year: 1885, death: 1962, note: 'Trưởng ban tế tự nhà thờ tổ thời kỳ 1940-1954.' },
    { name: 'Chu Văn Hưng', year: 1880, death: 1958, note: 'Lương y tài ba, chữa bệnh cứu người thời tao loạn.' },
    { name: 'Chu Văn Cán', year: 1885, death: 1965, note: 'Bảo quản an toàn hòm gia phả họ Chu qua những năm tháng chiến tranh.' },
    { name: 'Chu Văn Thịnh', year: 1890, death: 1970, note: 'Cán bộ lão thành cách mạng, người con ưu tú của Chi 2.' },
    { name: 'Chu Đình Dũng', year: 1882, death: 1955, note: 'Nhà giáo mẫu mực, đào tạo nhiều thế hệ học trò đỗ đạt tại Hà Nội.' },
    { name: 'Chu Đình Hùng', year: 1888, death: 1968, note: 'Doanh nhân yêu nước thời Pháp thuộc, đóng góp Tuần lễ Vàng 1945.' },
    { name: 'Chu Đình Phương', year: 1895, death: 1975, note: 'Khởi đầu dòng nhánh họ Chu phương Nam (vào Sài Gòn lập nghiệp năm 1954).' }
  ]

  const d4_males = []
  for (let i = 0; i < d4_names.length; i++) {
    const parent = d4_parents[i % d4_parents.length]
    const p = {
      id: uuid(),
      full_name: d4_names[i].name,
      gender: 'male',
      generation: 4,
      birth_order: (i % 3) + 1,
      birth_year: d4_names[i].year,
      death_year: d4_names[i].death,
      death_lunar_month: (i % 12) + 1,
      death_lunar_day: ((i * 7) % 28) + 1,
      is_deceased: true,
      is_in_law: false,
      other_names: `Cụ ${d4_names[i].name.split(' ').slice(2).join(' ')} đời 4`,
      burial_place: `Nghĩa trang gia tộc, khu Đồi Thông (Tọa độ: 21.03${i}, 105.85${i})`,
      branch_id: parent.branch_id,
      note: d4_names[i].note
    }
    const wife = {
      id: uuid(),
      full_name: `Nguyễn Thị ${['Hoa', 'Lan', 'Mai', 'Cúc', 'Trúc', 'Liễu', 'Loan', 'Thơm', 'Quế'][i]}`,
      gender: 'female',
      generation: 4,
      birth_year: d4_names[i].year + 3,
      death_year: d4_names[i].death + 5,
      is_deceased: true,
      is_in_law: true,
      burial_place: 'Nghĩa trang gia tộc họ Chu',
      branch_id: parent.branch_id,
      note: `Phu nhân của cụ ${d4_names[i].name}.`
    }
    persons.push(p, wife)
    d4_males.push(p)
    relationships.push(
      { type: 'biological_child', person_a: parent.id, person_b: p.id },
      { type: 'marriage', person_a: p.id, person_b: wife.id }
    )
  }

  // ĐỜI 5: THẾ HỆ TRỤ CỘT HIỆN ĐẠI (Các cụ, các bác 65-85 tuổi - 26 người)
  const d5_males = []
  const d5_specs = [
    { name: 'Chu Danh Minh', year: 1942, alive: true, note: 'Trưởng Ban Trị Sự Dòng Họ Chu toàn quốc, Đại tá Quân đội về hưu, người có công lớn trong việc chắp nối các chi họ.' },
    { name: 'Chu Danh Quang', year: 1945, alive: true, note: 'Kỹ sư cầu đường, phụ trách ban tài chính dòng họ.' },
    { name: 'Chu Danh Thành', year: 1948, alive: false, death: 2021, note: 'Giáo sư Tiến sĩ, Nhà giáo Ưu tú, nguyên Hiệu phó Đại học Y Hà Nội.' },
    { name: 'Chu Danh Thắng', year: 1952, alive: true, note: 'Nghệ nhân cây cảnh, phụ trách cảnh quan khuôn viên Từ đường họ Chu.' },
    { name: 'Chu Văn Đạt', year: 1946, alive: true, note: 'Trưởng Chi 2 - Đông Ngàn, am hiểu sâu sắc điển tích và chữ Nho.' },
    { name: 'Chu Văn Tuấn', year: 1950, alive: true, note: 'Doanh nhân ngành xây dựng, tài trợ đúc chuông đồng nhà thờ tổ.' },
    { name: 'Chu Văn Hùng', year: 1955, alive: true, note: 'Bác sĩ chuyên khoa II, Trưởng ban khuyến học chi 2.' },
    { name: 'Chu Đình Khôi', year: 1952, alive: true, note: 'Trưởng Chi 4 - Phương Nam, Chủ tịch Hội đồng hương họ Chu tại TP. Hồ Chí Minh.' },
    { name: 'Chu Đình Sơn', year: 1956, alive: true, note: 'Kỹ sư điện lực, ban liên lạc họ Chu khu vực miền Trung.' },
    { name: 'Chu Đình Nam', year: 1960, alive: true, note: 'Chuyên gia nông nghiệp công nghệ cao, về hưu tại Đà Lạt.' },
    { name: 'Chu Danh Long', year: 1958, alive: true, note: 'Nhà báo kỳ cựu, chủ biên các bản tin nội bộ họ Chu.' },
    { name: 'Chu Văn Kiên', year: 1962, alive: true, note: 'Cán bộ ngành thuế, thư ký Ban Trị Sự họ Chu.' },
    { name: 'Chu Đình Phước', year: 1964, alive: true, note: 'Doanh nhân vận tải tại Hải Phòng.' }
  ]

  for (let i = 0; i < d5_specs.length; i++) {
    const parent = d4_males[i % d4_males.length]
    const spec = d5_specs[i]
    const p = {
      id: uuid(),
      full_name: spec.name,
      gender: 'male',
      generation: 5,
      birth_order: (i % 3) + 1,
      birth_year: spec.year,
      birth_month: ((i * 3) % 12) + 1,
      birth_day: ((i * 5) % 28) + 1,
      death_year: spec.alive ? null : spec.death,
      is_deceased: !spec.alive,
      is_in_law: false,
      burial_place: spec.alive ? null : 'Nghĩa trang liệt sĩ / gia tộc họ Chu',
      branch_id: parent.branch_id,
      note: spec.note
    }
    const wife = {
      id: uuid(),
      full_name: `Trần Thị ${['Bích', 'Ngọc', 'Ánh', 'Dung', 'Hương', 'Hà', 'Phương', 'Linh', 'Thảo', 'Yến', 'Nga', 'Vân', 'Thanh'][i]}`,
      gender: 'female',
      generation: 5,
      birth_year: spec.year + 2,
      is_deceased: false,
      is_in_law: true,
      branch_id: parent.branch_id,
      note: `Phu nhân của ông ${spec.name}.`
    }
    persons.push(p, wife)
    d5_males.push(p)
    relationships.push(
      { type: 'biological_child', person_a: parent.id, person_b: p.id },
      { type: 'marriage', person_a: p.id, person_b: wife.id }
    )
  }

  // ĐỜI 6: THẾ HỆ TRẺ & GIA ĐÌNH HIỆN ĐẠI (30-50 tuổi - 26 người)
  const d6_males = []
  const d6_specs = [
    { name: 'Chu Danh Đức', year: 1975, gender: 'male', note: 'Thạc sĩ CNTT, tác giả thiết kế & triển khai số hóa hệ thống Gia Phả OS v2.0 cho dòng họ.' },
    { name: 'Chu Danh Thái', year: 1978, gender: 'male', note: 'Kiến trúc sư, chỉ đạo thi công tu bổ nhà thờ tổ họ Chu năm 2024.' },
    { name: 'Chu Danh Tuấn', year: 1982, gender: 'male', note: 'Tiến sĩ Vật lý, giảng viên Đại học Bách Khoa Hà Nội.' },
    { name: 'Chu Thị Mai Anh', year: 1980, gender: 'female', note: 'Luật sư đoàn luật sư Hà Nội, tư vấn pháp lý cho quỹ khuyến học dòng họ.' },
    { name: 'Chu Văn Hoàng', year: 1983, gender: 'male', note: 'Bác sĩ Trưởng khoa Bệnh viện Việt Đức.' },
    { name: 'Chu Văn Dũng', year: 1986, gender: 'male', note: 'Chuyên gia tài chính ngân hàng tại TP. Hồ Chí Minh.' },
    { name: 'Chu Văn Hải', year: 1988, gender: 'male', note: 'Kỹ sư phần mềm đang làm việc tại Tokyo, Nhật Bản.' },
    { name: 'Chu Đình Tùng', year: 1985, gender: 'male', note: 'Giám đốc công ty xuất nhập khẩu tại Đà Nẵng.' },
    { name: 'Chu Đình Bách', year: 1989, gender: 'male', note: 'Thạc sĩ kinh tế, quản lý quỹ đầu tư.' },
    { name: 'Chu Thị Thu Hằng', year: 1987, gender: 'female', note: 'Giáo viên trường chuyên Chu Văn An.' },
    { name: 'Chu Danh Phong', year: 1990, gender: 'male', note: 'Chuyên gia AI, thành viên ban quản trị số hóa gia phả.' },
    { name: 'Chu Văn Cường', year: 1992, gender: 'male', note: 'Kỹ sư xây dựng công trình giao thông.' },
    { name: 'Chu Đình Lân', year: 1995, gender: 'male', note: 'Nhà sáng tạo nội dung, quảng bá văn hóa dòng họ Chu trên mạng xã hội.' }
  ]

  for (let i = 0; i < d6_specs.length; i++) {
    const parent = d5_males[i % d5_males.length]
    const spec = d6_specs[i]
    const p = {
      id: uuid(),
      full_name: spec.name,
      gender: spec.gender,
      generation: 6,
      birth_order: (i % 2) + 1,
      birth_year: spec.year,
      birth_month: ((i * 4) % 12) + 1,
      birth_day: ((i * 6) % 28) + 1,
      is_deceased: false,
      is_in_law: false,
      branch_id: parent.branch_id,
      note: spec.note
    }
    persons.push(p)
    if (spec.gender === 'male') d6_males.push(p)

    relationships.push({ type: 'biological_child', person_a: parent.id, person_b: p.id })

    // Thêm vợ/chồng cho một số nhân vật đời 6
    if (spec.gender === 'male' && i < 10) {
      const spouse = {
        id: uuid(),
        full_name: `Lê Thị ${['Thu', 'Diệp', 'Tâm', 'Hạnh', 'Trang', 'Ly', 'Quyên', 'Thảo', 'Hiền', 'Giang'][i]}`,
        gender: 'female',
        generation: 6,
        birth_year: spec.year + 1,
        is_deceased: false,
        is_in_law: true,
        branch_id: parent.branch_id,
        note: `Vợ của anh ${spec.name}.`
      }
      persons.push(spouse)
      relationships.push({ type: 'marriage', person_a: p.id, person_b: spouse.id })
    }
  }

  // ĐỜI 7: THẾ HỆ THIẾU NHI VÀ TƯƠNG LAI (Hiện tại - 18 cháu bé)
  const d7_names = [
    { name: 'Chu Danh Khang', gender: 'male', year: 2008, note: 'Học sinh giỏi cấp Quốc gia môn Toán, tương lai của dòng họ.' },
    { name: 'Chu Danh An', gender: 'male', year: 2012, note: 'Đạt giải cờ vua thiếu niên Hà Nội.' },
    { name: 'Chu Bảo Ngọc', gender: 'female', year: 2015, note: 'Cháu gái chăm ngoan, học giỏi múa hát.' },
    { name: 'Chu Minh Trí', gender: 'male', year: 2018, note: 'Khôi ngô tuấn tú, cháu đích tôn chi trưởng.' },
    { name: 'Chu Tuệ Lâm', gender: 'female', year: 2020, note: 'Bé gái nhanh nhẹn, thông minh.' },
    { name: 'Chu Gia Hưng', gender: 'male', year: 2022, note: 'Chào đời khỏe mạnh trong niềm vui toàn gia tộc.' },
    { name: 'Chu Khôi Nguyên', gender: 'male', year: 2024, note: 'Thành viên mới nhất của dòng họ Chu, chào đời năm Giáp Thìn 2024.' },
    { name: 'Chu Văn Đạt Nhân', gender: 'male', year: 2016, note: 'Cháu nội ông Chu Văn Đạt chi 2.' },
    { name: 'Chu Văn Thành Đạt', gender: 'male', year: 2019, note: 'Bé trai hoạt bát, kháu khỉnh.' },
    { name: 'Chu Đình Nhật Minh', gender: 'male', year: 2017, note: 'Cháu sinh ra tại TP. Hồ Chí Minh.' },
    { name: 'Chu Đình Gia Bảo', gender: 'male', year: 2021, note: 'Cháu bé vui vẻ, hiếu động.' },
    { name: 'Chu Thị Diệu Anh', gender: 'female', year: 2014, note: 'Học sinh tiêu biểu trường tiểu học Chu Văn An.' },
    { name: 'Chu Thị Khánh Linh', gender: 'female', year: 2019, note: 'Bé gái xinh xắn, ngoan ngoãn.' },
    { name: 'Chu Danh Vĩnh An', gender: 'male', year: 2023, note: 'Mầm non hy vọng của Chi 1.' },
    { name: 'Chu Văn Quang Huy', gender: 'male', year: 2015, note: 'Đạt huy chương vàng bơi lội lứa tuổi thiếu nhi.' },
    { name: 'Chu Văn Tuấn Kiệt', gender: 'male', year: 2020, note: 'Cháu trai chi 2.' },
    { name: 'Chu Đình Nam Phong', gender: 'male', year: 2018, note: 'Cháu trai chi 4.' },
    { name: 'Chu Thị Như Ý', gender: 'female', year: 2022, note: 'Bé gái đáng yêu, con cháu dòng họ Chu.' }
  ]

  for (let i = 0; i < d7_names.length; i++) {
    const parent = d6_males[i % d6_males.length]
    const spec = d7_names[i]
    const p = {
      id: uuid(),
      full_name: spec.name,
      gender: spec.gender,
      generation: 7,
      birth_order: (i % 2) + 1,
      birth_year: spec.year,
      birth_month: ((i * 5) % 12) + 1,
      birth_day: ((i * 7) % 28) + 1,
      is_deceased: false,
      is_in_law: false,
      branch_id: parent.branch_id,
      note: spec.note
    }
    persons.push(p)
    relationships.push({ type: 'biological_child', person_a: parent.id, person_b: p.id })
  }

  console.log(`✅ Đã sinh thành công dữ liệu cấu trúc cho ${persons.length} thành viên dòng họ Chu!`)

  // 3. Thực hiện lưu vào cơ sở dữ liệu Supabase trong một transaction an toàn
  await sql.begin(async (tx) => {
    // A. Tạo Chi Nhánh trước (để head_person_id = null tạm thời)
    const branchInserts = [
      { id: branchIds.root, name: 'Đại Tộc Họ Chu - Toàn Họ', parent_branch_id: null, head_person_id: p1.id, description: 'Chi gốc thủy tổ toàn thể dòng họ Chu', order_index: 1 },
      { id: branchIds.chi1, name: 'Chi Trưởng - Nhánh Tiên Điền', parent_branch_id: branchIds.root, head_person_id: p2_1.id, description: 'Dòng dõi Cụ Tú Nho, phụ trách Từ Đường và Trưởng Ban Trị Sự', order_index: 2 },
      { id: branchIds.chi2, name: 'Chi Hai - Nhánh Đông Ngàn', parent_branch_id: branchIds.root, head_person_id: p2_2.id, description: 'Dòng dõi Cụ Chu Văn Trực, truyền thống hiếu học và kiến trúc truyền thống', order_index: 3 },
      { id: branchIds.chi3, name: 'Chi Ba - Nhánh Thăng Long', parent_branch_id: branchIds.root, head_person_id: p2_3.id, description: 'Dòng dõi Cụ Chu Đình Nghiêm, giao thương kinh kỳ và y thuật', order_index: 4 },
      { id: branchIds.chi4, name: 'Chi Bốn - Nhánh Phương Nam', parent_branch_id: branchIds.root, head_person_id: p3_4.id, description: 'Chi nhánh phát triển mạnh tại TP. Hồ Chí Minh và miền Đông Nam Bộ', order_index: 5 }
    ]

    for (const b of branchInserts) {
      await tx`
        INSERT INTO public.branches (id, name, parent_branch_id, head_person_id, description, order_index)
        VALUES (${b.id}, ${b.name}, ${b.parent_branch_id}, NULL, ${b.description}, ${b.order_index})
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name, description = EXCLUDED.description, order_index = EXCLUDED.order_index;
      `
    }
    console.log('✅ Đã nạp thành công 5 Chi phái dòng họ Chu (bước 1)!')

    // B. Nạp 100 Persons
    for (const p of persons) {
      await tx`
        INSERT INTO public.persons (
          id, full_name, gender, generation, birth_order,
          birth_year, birth_month, birth_day,
          death_year, death_month, death_day,
          death_lunar_year, death_lunar_month, death_lunar_day,
          is_deceased, is_in_law, other_names, burial_place, branch_id, note
        ) VALUES (
          ${p.id}, ${p.full_name}, ${p.gender}, ${p.generation}, ${p.birth_order ?? null},
          ${p.birth_year ?? null}, ${p.birth_month ?? null}, ${p.birth_day ?? null},
          ${p.death_year ?? null}, ${p.death_month ?? null}, ${p.death_day ?? null},
          ${p.death_lunar_year ?? null}, ${p.death_lunar_month ?? null}, ${p.death_lunar_day ?? null},
          ${p.is_deceased}, ${p.is_in_law}, ${p.other_names ?? null}, ${p.burial_place ?? null},
          ${p.branch_id}, ${p.note ?? null}
        )
        ON CONFLICT (id) DO NOTHING;
      `
    }
    console.log(`✅ Đã nạp ${persons.length} hồ sơ thành viên vào bảng persons!`)

    // C. Cập nhật lại head_person_id cho các Chi
    for (const b of branchInserts) {
      await tx`
        UPDATE public.branches
        SET head_person_id = ${b.head_person_id}
        WHERE id = ${b.id};
      `
    }
    console.log('✅ Đã gắn Cụ Khởi Chi (head_person_id) cho 5 Chi nhánh!')

    // C. Nạp Relationships
    for (const rel of relationships) {
      await tx`
        INSERT INTO public.relationships (type, person_a, person_b, note)
        VALUES (${rel.type}, ${rel.person_a}, ${rel.person_b}, ${rel.note ?? null})
        ON CONFLICT DO NOTHING;
      `
    }
    console.log(`✅ Đã tạo ${relationships.length} liên kết phả hệ cha-con & hôn phối!`)

    // D. Tạo sự kiện tâm linh mẫu (custom_events)
    const events = [
      {
        name: 'Đại Lễ Giỗ Tổ Họ Chu — Thủy Tổ Chu Đình Khang',
        event_date: '2026-08-26',
        content: 'Ngày giỗ chính của cụ Thủy Tổ (26 tháng 7 Âm lịch). Toàn thể con cháu từ các chi nhánh tụ hội tại Từ Đường phụng tế.',
        location: 'Nhà Thờ Tổ Họ Chu, thôn Tiên Điền',
        recurrence: 'yearly_lunar'
      },
      {
        name: 'Lễ Tảo Mộ & Thanh Minh Họ Chu',
        event_date: '2026-04-05',
        content: 'Tảo mộ toàn thể các khu lăng mộ Đồi Mây, Đồi Cát, dâng hương tri ân tiên tổ.',
        location: 'Khu lăng mộ Đồi Mây họ Chu',
        recurrence: 'yearly_solar'
      },
      {
        name: 'Họp Mặt Đầu Xuân & Phát Thưởng Khuyến Học Họ Chu',
        event_date: '2026-02-20',
        content: 'Mừng thọ các cụ cao niên 70, 80, 90 tuổi và trao học bổng cho các cháu đỗ đạt.',
        location: 'Từ Đường Dòng Họ Chu',
        recurrence: 'yearly_lunar'
      }
    ]

    for (const ev of events) {
      await tx`
        INSERT INTO public.custom_events (name, event_date, content, location, recurrence)
        VALUES (${ev.name}, ${ev.event_date}, ${ev.content}, ${ev.location}, ${ev.recurrence})
        ON CONFLICT DO NOTHING;
      `
    }
    console.log('✅ Đã nạp 3 Sự kiện giỗ chạp & truyền thống dòng họ!')

    // E. Cập nhật schema reload
    await tx`NOTIFY pgrst, 'reload schema'`
  })

  console.log('\n🎉 THÀNH CÔNG: Toàn bộ hệ thống 100 mẫu phả hệ minh họa dòng họ Chu đã sẵn sàng!')
  await sql.end()
}

run().catch((err) => {
  console.error('❌ Lỗi:', err)
  process.exit(1)
})

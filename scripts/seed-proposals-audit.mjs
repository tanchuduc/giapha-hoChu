import postgres from 'postgres'

const sql = postgres(
  'postgresql://postgres:hoChu%402026%23@db.qcpkigmyhmtzmloxkqpe.supabase.co:5432/postgres',
  { max: 1, connect_timeout: 10 }
)

async function run() {
  console.log('📝 Đang chèn dữ liệu mẫu Đề xuất chỉnh sửa & Nhật ký kiểm toán...')

  const adminId = '9722cc53-ef3b-4628-b31f-3cbcd5ff9307'

  // Tìm cụ Chu Danh Nho và cụ Chu Danh Khoa
  const persons = await sql`
    SELECT id, full_name, birth_year, death_year, burial_place
    FROM public.persons
    WHERE full_name IN ('Chu Danh Nho', 'Chu Danh Khoa')
  `

  const cuNho = persons.find((p) => p.full_name === 'Chu Danh Nho')
  const cuKhoa = persons.find((p) => p.full_name === 'Chu Danh Khoa')

  if (cuNho) {
    // Đề xuất đang chờ duyệt (Pending)
    await sql`
      INSERT INTO public.change_requests (
        target_person_id, proposed_by_user_id,
        proposed_data, original_data,
        reason, proof_url, status
      ) VALUES (
        ${cuNho.id}, ${adminId},
        ${JSON.stringify({
          full_name: 'Chu Danh Nho',
          other_names: 'Cụ Tú Nho, Khởi Chi Trưởng Tiên Điền',
          death_lunar_month: 9,
          death_lunar_day: 5,
          burial_place: 'Gò Cây Vải, xứ Đồng Vàng (Đã gắn mốc định vị GPS mới)',
          note: 'Cụ đỗ Tú tài khoa Giáp Ngọ thời vua Minh Mạng, mở trường dạy học. Năm 1860 cụ đứng ra tôn tạo Từ Đường.'
        })},
        ${JSON.stringify(cuNho)},
        'Con cháu Chi Trưởng mới tìm được bản chúc thư chữ Nôm năm 1880 xác nhận ngày giỗ chính xác là mùng 5 tháng 9 Âm lịch.',
        'https://giapha-hochu.vercel.app/docs/chuc-thu-1880.pdf',
        'pending'
      )
      ON CONFLICT DO NOTHING;
    `
    console.log('✅ Đã tạo đề xuất mẫu đang chờ duyệt (Pending) cho cụ Chu Danh Nho!')
  }

  if (cuKhoa) {
    // Đề xuất đã duyệt (Approved)
    await sql`
      INSERT INTO public.change_requests (
        target_person_id, proposed_by_user_id,
        proposed_data, original_data,
        reason, status, reviewed_by_user_id, review_note, reviewed_at
      ) VALUES (
        ${cuKhoa.id}, ${adminId},
        ${JSON.stringify({
          full_name: 'Chu Danh Khoa',
          note: 'Hưởng ứng phong trào Duy Tân, mở lớp dạy chữ Quốc ngữ đầu tiên của làng.'
        })},
        ${JSON.stringify(cuKhoa)},
        'Bổ sung thành tựu văn hóa giáo dục thời kỳ tiền khởi nghĩa theo bia ký tại trường làng.',
        'approved',
        ${adminId},
        'Hội đồng gia tộc đã thẩm định chứng tích bia ký, hoàn toàn chính xác.',
        NOW()
      )
      ON CONFLICT DO NOTHING;
    `

    // Ghi audit log mẫu
    await sql`
      INSERT INTO public.audit_logs (
        table_name, record_id, action, performed_by, old_values, new_values
      ) VALUES (
        'persons', ${cuKhoa.id}, 'APPROVE_PROPOSAL', ${adminId},
        ${JSON.stringify({ note: 'Nho sĩ yêu nước' })},
        ${JSON.stringify({ note: 'Hưởng ứng phong trào Duy Tân, mở lớp dạy chữ Quốc ngữ đầu tiên của làng.' })}
      );
    `
    console.log('✅ Đã tạo đề xuất đã duyệt & nhật ký kiểm toán cho cụ Chu Danh Khoa!')
  }

  console.log('🎉 Hoàn tất nạp dữ liệu mẫu cho quy trình cộng tác & kiểm toán!')
  await sql.end()
}

run().catch(console.error)

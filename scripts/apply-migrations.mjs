// ========================================================
// SCRIPT: Tự Động Áp Dụng Migrations Vào Supabase Database
// ========================================================

import { promises as fs } from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

const CONNECTION_CANDIDATES = [
  // 1. Direct host
  'postgresql://postgres:hoChu%402026%23@db.qcpkigmyhmtzmloxkqpe.supabase.co:5432/postgres',
  // 2. Transaction Pooler port 6543
  'postgresql://postgres.qcpkigmyhmtzmloxkqpe:hoChu%402026%23@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  // 3. Session Pooler port 5432
  'postgresql://postgres.qcpkigmyhmtzmloxkqpe:hoChu%402026%23@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
]

async function connectToDatabase() {
  for (const url of CONNECTION_CANDIDATES) {
    try {
      console.log(`🔌 Đang thử kết nối: ${url.replace(/:[^:@]+@/, ':***@')}...`)
      const sql = postgres(url, {
        max: 1,
        connect_timeout: 8,
        idle_timeout: 5,
        prepare: false
      })
      await sql`SELECT 1`
      console.log('✅ Kết nối cơ sở dữ liệu thành công!')
      return sql
    } catch (err) {
      console.warn(`⚠️ Kết nối thử nghiệm thất bại (${err.message})`)
    }
  }
  return null
}

async function main() {
  const sql = await connectToDatabase()
  if (!sql) {
    console.error('❌ Không thể kết nối tới cơ sở dữ liệu Supabase qua bất kỳ cổng nào.')
    process.exit(1)
  }

  try {
    // 1. Đảm bảo bảng app_migrations tồn tại
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.app_migrations (
        migration_id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 2. Lấy danh sách migration đã chạy
    const appliedRows = await sql`SELECT migration_id FROM public.app_migrations`
    const appliedSet = new Set(appliedRows.map((r) => r.migration_id))

    // 3. Danh sách các migration mới cần chạy
    const targetMigrations = [
      'docs/migrations/20261118120000_add_soft_delete_to_persons.sql',
      'docs/migrations/20261118140000_add_branches_table.sql',
      'docs/migrations/20261118160000_add_change_requests_and_audit_logs.sql'
    ]

    let appliedCount = 0

    for (const migPath of targetMigrations) {
      if (appliedSet.has(migPath)) {
        console.log(`⏩ [Đã có] ${migPath}`)
        continue
      }

      console.log(`⏳ Đang chạy migration: ${migPath}...`)
      const fullPath = path.join(process.cwd(), migPath)
      const sqlContent = await fs.readFile(fullPath, 'utf8')

      // Thực thi migration
      await sql.unsafe(sqlContent)
      await sql`
        INSERT INTO public.app_migrations (migration_id, file_name)
        VALUES (${migPath}, ${migPath})
        ON CONFLICT (migration_id) DO NOTHING;
      `

      console.log(`✅ [Thành công] ${migPath}`)
      appliedCount++
    }

    // 4. Reload PostgREST schema cache
    await sql`NOTIFY pgrst, 'reload schema'`
    console.log('🔄 Đã phát tín hiệu làm mới schema cache cho Supabase PostgREST API.')

    console.log(`\n🎉 HOÀN THÀNH: Đã áp dụng thành công ${appliedCount} migration(s) vào cơ sở dữ liệu Supabase!`)
  } catch (error) {
    console.error('❌ Lỗi khi áp dụng migration:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main()

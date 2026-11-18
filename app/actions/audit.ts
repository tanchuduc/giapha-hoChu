'use server'

import type { AuditLog, AuditLogAction } from '@/types'
import { getAdminSupabase } from '@/utils/supabase/admin'
import { getProfile, getSupabase, getUser } from '@/utils/supabase/queries'

export interface GetAuditLogsResult {
  data?: AuditLog[]
  total?: number
  error?: string
}

/**
 * Lấy danh sách nhật ký kiểm toán (Audit Logs) của hệ thống.
 * Chỉ Quản trị viên (Admin) mới có quyền truy cập.
 */
export async function getAuditLogs(
  limit: number = 50,
  offset: number = 0
): Promise<GetAuditLogsResult> {
  try {
    const [user, profile, supabase] = await Promise.all([
      getUser(),
      getProfile(),
      getSupabase()
    ])

    if (!user || !profile?.is_active || profile.role !== 'admin') {
      return { error: 'Chỉ Quản trị viên (Admin) mới có quyền truy cập nhật ký kiểm toán hệ thống.' }
    }

    const safeLimit = Math.min(Math.max(1, limit), 200)
    const safeOffset = Math.max(0, offset)

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1)

    if (error) {
      console.error('Error fetching audit logs:', error)
      return { error: error.message }
    }

    // Tra cứu email của người thực hiện nếu có thể
    const performerEmailMap = new Map<string, string>()
    const performerIds = Array.from(
      new Set(
        (data || [])
          .map((item) => item.performed_by)
          .filter((id): id is string => Boolean(id))
      )
    )

    if (performerIds.length > 0) {
      try {
        const adminClient = getAdminSupabase()
        const { data: usersData } = await adminClient.auth.admin.listUsers()
        usersData?.users?.forEach((u) => {
          if (u.email) {
            performerEmailMap.set(u.id, u.email)
          }
        })
      } catch {
        // Fallback: nếu không gọi được admin api, bỏ qua tra cứu email
      }
    }

    const logs: AuditLog[] = (data || []).map((row) => ({
      id: row.id,
      table_name: row.table_name,
      record_id: row.record_id,
      action: row.action,
      performed_by: row.performed_by,
      old_values: row.old_values,
      new_values: row.new_values,
      created_at: row.created_at,
      performer_email: row.performed_by ? performerEmailMap.get(row.performed_by) || null : null
    }))

    return {
      data: logs,
      total: count ?? logs.length
    }
  } catch (err) {
    console.error('getAuditLogs exception:', err)
    return { error: 'Không thể tải nhật ký kiểm toán.' }
  }
}

/**
 * Helper function để ghi log sự kiện kiểm toán một cách an toàn.
 */
export async function logAuditEvent(params: {
  tableName: string
  recordId: string
  action: AuditLogAction
  performedBy?: string | null
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}): Promise<{ success?: boolean; error?: string }> {
  try {
    let client = null
    try {
      client = getAdminSupabase()
    } catch {
      client = await getSupabase()
    }

    const { error } = await client.from('audit_logs').insert({
      table_name: params.tableName,
      record_id: params.recordId,
      action: params.action,
      performed_by: params.performedBy ?? null,
      old_values: params.oldValues ?? null,
      new_values: params.newValues ?? null
    })

    if (error) {
      console.error('Error logging audit event:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('logAuditEvent exception:', err)
    return { error: 'Không thể ghi nhận nhật ký kiểm toán.' }
  }
}

'use server'

import { revalidatePath } from 'next/cache'

import { getServerTranslations } from '@/lib/i18n/server'
import type { Branch } from '@/types'
import { getProfile, getSupabase, getUser } from '@/utils/supabase/queries'
import { isUuid } from '@/utils/uuid'

export type BranchUpdateInput = {
  name?: string
  description?: string | null
  parent_branch_id?: string | null
  head_person_id?: string | null
  order_index?: number
}

/**
 * Lấy toàn bộ danh sách chi nhánh (branches), sắp xếp theo order_index và created_at.
 */
export async function getBranches(): Promise<{ data?: Branch[]; error?: string }> {
  try {
    const [user, profile, supabase] = await Promise.all([
      getUser(),
      getProfile(),
      getSupabase()
    ])

    if (!user || !profile?.is_active) {
      const { t } = await getServerTranslations()
      return { error: t('accessDenied') }
    }

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching branches:', error)
      return { error: error.message }
    }

    return { data: (data as Branch[]) ?? [] }
  } catch (err) {
    console.error('getBranches exception:', err)
    return { error: 'Không thể tải danh sách chi nhánh.' }
  }
}

/**
 * Tạo mới một chi nhánh. Chỉ Admin và Editor có quyền thực hiện.
 */
export async function createBranch(
  name: string,
  description?: string,
  parentBranchId?: string,
  headPersonId?: string,
  orderIndex?: number
): Promise<{ data?: Branch; success?: boolean; error?: string }> {
  try {
    const [user, profile, { t }] = await Promise.all([
      getUser(),
      getProfile(),
      getServerTranslations()
    ])

    if (
      !user ||
      !profile?.is_active ||
      (profile.role !== 'admin' && profile.role !== 'editor')
    ) {
      return { error: t('accessDenied') }
    }

    const trimmedName = name?.trim()
    if (!trimmedName) {
      return { error: 'Tên chi nhánh không được để trống.' }
    }

    if (parentBranchId && !isUuid(parentBranchId)) {
      return { error: 'ID chi nhánh cha không hợp lệ.' }
    }

    if (headPersonId && !isUuid(headPersonId)) {
      return { error: 'ID người phụ trách chi nhánh không hợp lệ.' }
    }

    const supabase = await getSupabase()

    const newBranch = {
      name: trimmedName,
      description: description?.trim() || null,
      parent_branch_id: parentBranchId || null,
      head_person_id: headPersonId || null,
      order_index: typeof orderIndex === 'number' ? orderIndex : 1
    }

    const { data, error } = await supabase
      .from('branches')
      .insert(newBranch)
      .select()
      .single()

    if (error) {
      console.error('Error creating branch:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/branches')
    revalidatePath('/dashboard/members')
    revalidatePath('/tree')

    return { data: data as Branch, success: true }
  } catch (err) {
    console.error('createBranch exception:', err)
    return { error: 'Không thể tạo mới chi nhánh.' }
  }
}

/**
 * Cập nhật thông tin chi nhánh. Chỉ Admin và Editor có quyền thực hiện.
 */
export async function updateBranch(
  id: string,
  updates: Partial<BranchUpdateInput>
): Promise<{ data?: Branch; success?: boolean; error?: string }> {
  try {
    if (!isUuid(id)) {
      return { error: 'ID chi nhánh không hợp lệ.' }
    }

    const [user, profile, { t }] = await Promise.all([
      getUser(),
      getProfile(),
      getServerTranslations()
    ])

    if (
      !user ||
      !profile?.is_active ||
      (profile.role !== 'admin' && profile.role !== 'editor')
    ) {
      return { error: t('accessDenied') }
    }

    const payload: Record<string, unknown> = {}

    if (updates.name !== undefined) {
      const trimmed = updates.name.trim()
      if (!trimmed) {
        return { error: 'Tên chi nhánh không được để trống.' }
      }
      payload.name = trimmed
    }

    if (updates.description !== undefined) {
      payload.description = updates.description?.trim() || null
    }

    if (updates.parent_branch_id !== undefined) {
      if (updates.parent_branch_id === id) {
        return { error: 'Chi nhánh cha không thể là chính nó.' }
      }
      if (updates.parent_branch_id && !isUuid(updates.parent_branch_id)) {
        return { error: 'ID chi nhánh cha không hợp lệ.' }
      }
      payload.parent_branch_id = updates.parent_branch_id || null
    }

    if (updates.head_person_id !== undefined) {
      if (updates.head_person_id && !isUuid(updates.head_person_id)) {
        return { error: 'ID người phụ trách không hợp lệ.' }
      }
      payload.head_person_id = updates.head_person_id || null
    }

    if (updates.order_index !== undefined) {
      payload.order_index = Number.isInteger(updates.order_index)
        ? updates.order_index
        : 1
    }

    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('branches')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating branch:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/branches')
    revalidatePath('/dashboard/members')
    revalidatePath('/tree')

    return { data: data as Branch, success: true }
  } catch (err) {
    console.error('updateBranch exception:', err)
    return { error: 'Không thể cập nhật chi nhánh.' }
  }
}

/**
 * Xóa một chi nhánh. Chỉ Admin và Editor có quyền thực hiện.
 */
export async function deleteBranch(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!isUuid(id)) {
      return { error: 'ID chi nhánh không hợp lệ.' }
    }

    const [user, profile, { t }] = await Promise.all([
      getUser(),
      getProfile(),
      getServerTranslations()
    ])

    if (
      !user ||
      !profile?.is_active ||
      (profile.role !== 'admin' && profile.role !== 'editor')
    ) {
      return { error: t('accessDenied') }
    }

    const supabase = await getSupabase()

    // Kiểm tra xem chi nhánh có tồn tại không
    const { data: branch, error: fetchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !branch) {
      return { error: 'Chi nhánh không tồn tại.' }
    }

    // Bảo vệ chi nhánh gốc của dòng họ
    if (branch.name === 'Đại Tộc Họ Chu - Toàn Họ') {
      return { error: 'Không thể xóa chi nhánh gốc của Đại Tộc.' }
    }

    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting branch:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/branches')
    revalidatePath('/dashboard/members')
    revalidatePath('/tree')

    return { success: true }
  } catch (err) {
    console.error('deleteBranch exception:', err)
    return { error: 'Không thể xóa chi nhánh.' }
  }
}

/**
 * Gán hoặc hủy gán thành viên vào một chi nhánh. Chỉ Admin và Editor có quyền thực hiện.
 */
export async function assignPersonToBranch(
  personId: string,
  branchId: string | null
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!isUuid(personId)) {
      return { error: 'ID thành viên không hợp lệ.' }
    }

    if (branchId !== null && !isUuid(branchId)) {
      return { error: 'ID chi nhánh không hợp lệ.' }
    }

    const [user, profile, { t }] = await Promise.all([
      getUser(),
      getProfile(),
      getServerTranslations()
    ])

    if (
      !user ||
      !profile?.is_active ||
      (profile.role !== 'admin' && profile.role !== 'editor')
    ) {
      return { error: t('accessDenied') }
    }

    const supabase = await getSupabase()

    // Nếu gán vào chi nhánh cụ thể, kiểm tra chi nhánh có tồn tại không
    if (branchId) {
      const { data: branch, error: branchErr } = await supabase
        .from('branches')
        .select('id')
        .eq('id', branchId)
        .single()

      if (branchErr || !branch) {
        return { error: 'Chi nhánh được gán không tồn tại.' }
      }
    }

    const { error } = await supabase
      .from('persons')
      .update({ branch_id: branchId })
      .eq('id', personId)

    if (error) {
      console.error('Error assigning person to branch:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/members')
    revalidatePath(`/dashboard/members/${personId}`)
    revalidatePath('/dashboard/branches')
    revalidatePath('/tree')

    return { success: true }
  } catch (err) {
    console.error('assignPersonToBranch exception:', err)
    return { error: 'Không thể gán chi nhánh cho thành viên.' }
  }
}

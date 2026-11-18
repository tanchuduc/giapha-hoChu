'use server'

import { revalidatePath } from 'next/cache'

import type { ChangeRequest, ChangeRequestStatus } from '@/types'
import { getAdminSupabase } from '@/utils/supabase/admin'
import { getProfile, getSupabase, getUser } from '@/utils/supabase/queries'
import { isUuid } from '@/utils/uuid'

/**
 * Gửi một đề xuất thay đổi / cập nhật thông tin thành viên (Person)
 */
export async function submitProposal(
  targetPersonId: string,
  proposedData: Record<string, unknown>,
  reason: string,
  proofUrl?: string
): Promise<{ success?: boolean; data?: ChangeRequest; error?: string }> {
  try {
    if (!isUuid(targetPersonId)) {
      return { error: 'Mã thành viên cần đề xuất không hợp lệ.' }
    }

    if (!proposedData || typeof proposedData !== 'object' || Object.keys(proposedData).length === 0) {
      return { error: 'Dữ liệu đề xuất không được để trống.' }
    }

    const [user, profile, supabase] = await Promise.all([
      getUser(),
      getProfile(),
      getSupabase()
    ])

    if (!user || !profile?.is_active) {
      return { error: 'Bạn cần đăng nhập với tài khoản đang hoạt động để gửi đề xuất.' }
    }

    // Lấy thông tin hiện tại của thành viên để lưu làm original_data
    const { data: currentPerson, error: personError } = await supabase
      .from('persons')
      .select('*')
      .eq('id', targetPersonId)
      .maybeSingle()

    if (personError || !currentPerson) {
      return { error: 'Không tìm thấy hồ sơ thành viên trong gia phả.' }
    }

    // Loại bỏ các trường hệ thống không được phép tùy tiện ghi đè
    const sanitizedProposal = { ...proposedData }
    delete sanitizedProposal.id
    delete sanitizedProposal.created_at
    delete sanitizedProposal.updated_at
    delete sanitizedProposal.deleted_at
    delete sanitizedProposal.deleted_by

    const { data, error } = await supabase
      .from('change_requests')
      .insert({
        target_person_id: targetPersonId,
        proposed_by_user_id: user.id,
        proposed_data: sanitizedProposal,
        original_data: currentPerson,
        reason: reason?.trim() || null,
        proof_url: proofUrl?.trim() || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting change request:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/proposals')
    revalidatePath('/dashboard/members')

    return { success: true, data: data as ChangeRequest }
  } catch (err) {
    console.error('submitProposal exception:', err)
    return { error: 'Không thể gửi đề xuất cập nhật. Vui lòng thử lại sau.' }
  }
}

/**
 * Lấy danh sách các đề xuất thay đổi.
 * - Thành viên thường: chỉ xem được các đề xuất do chính mình tạo.
 * - Admin và Editor: xem được tất cả các đề xuất.
 */
export async function getProposals(
  status?: ChangeRequestStatus
): Promise<{ data?: ChangeRequest[]; error?: string }> {
  try {
    const [user, profile, supabase] = await Promise.all([
      getUser(),
      getProfile(),
      getSupabase()
    ])

    if (!user || !profile?.is_active) {
      return { error: 'Truy cập bị từ chối.' }
    }

    const isPrivileged = profile.role === 'admin' || profile.role === 'editor'

    let query = supabase
      .from('change_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!isPrivileged) {
      query = query.eq('proposed_by_user_id', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching change requests:', error)
      return { error: error.message }
    }

    return { data: (data as ChangeRequest[]) ?? [] }
  } catch (err) {
    console.error('getProposals exception:', err)
    return { error: 'Không thể tải danh sách đề xuất.' }
  }
}

/**
 * Phê duyệt đề xuất thay đổi.
 * - Cập nhật dữ liệu vào bảng persons.
 * - Đổi trạng thái đề xuất thành 'approved'.
 * - Ghi log kiểm toán vào bảng audit_logs với action = 'APPROVE_PROPOSAL'.
 * - Revalidate các trang liên quan.
 */
export async function approveProposal(
  proposalId: string,
  reviewNote?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!isUuid(proposalId)) {
      return { error: 'Mã đề xuất không hợp lệ.' }
    }

    const [user, profile, supabase] = await Promise.all([
      getUser(),
      getProfile(),
      getSupabase()
    ])

    if (!user || !profile?.is_active || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return { error: 'Chỉ Quản trị viên hoặc Biên tập viên mới có quyền phê duyệt đề xuất.' }
    }

    // Lấy thông tin đề xuất
    const { data: proposal, error: proposalError } = await supabase
      .from('change_requests')
      .select('*')
      .eq('id', proposalId)
      .maybeSingle()

    if (proposalError || !proposal) {
      return { error: 'Không tìm thấy đề xuất cần phê duyệt.' }
    }

    if (proposal.status !== 'pending') {
      return { error: `Đề xuất này đã được xử lý trước đó với trạng thái: ${proposal.status}.` }
    }

    // Lấy thông tin hiện tại của Person trước khi cập nhật
    const { data: currentPerson, error: personError } = await supabase
      .from('persons')
      .select('*')
      .eq('id', proposal.target_person_id)
      .maybeSingle()

    if (personError || !currentPerson) {
      return { error: 'Hồ sơ thành viên mục tiêu không tồn tại trong hệ thống.' }
    }

    // Làm sạch proposed_data trước khi cập nhật vào persons
    const cleanUpdate = { ...proposal.proposed_data }
    delete cleanUpdate.id
    delete cleanUpdate.created_at
    delete cleanUpdate.deleted_at
    delete cleanUpdate.deleted_by
    cleanUpdate.updated_at = new Date().toISOString()

    // 1. Cập nhật persons
    const { error: updatePersonError } = await supabase
      .from('persons')
      .update(cleanUpdate)
      .eq('id', proposal.target_person_id)

    if (updatePersonError) {
      console.error('Error applying proposed data to person:', updatePersonError)
      return { error: `Cập nhật hồ sơ thất bại: ${updatePersonError.message}` }
    }

    // 2. Cập nhật change_requests
    const { error: updateProposalError } = await supabase
      .from('change_requests')
      .update({
        status: 'approved',
        reviewed_by_user_id: user.id,
        review_note: reviewNote?.trim() || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', proposalId)

    if (updateProposalError) {
      console.error('Error updating change request status:', updateProposalError)
      return { error: `Cập nhật trạng thái đề xuất thất bại: ${updateProposalError.message}` }
    }

    // 3. Ghi audit log
    try {
      let auditClient = supabase
      try {
        auditClient = getAdminSupabase()
      } catch {
        // Fallback to session client if service role key is not configured
      }

      await auditClient.from('audit_logs').insert({
        table_name: 'persons',
        record_id: proposal.target_person_id,
        action: 'APPROVE_PROPOSAL',
        performed_by: user.id,
        old_values: currentPerson,
        new_values: { ...currentPerson, ...cleanUpdate }
      })
    } catch (auditErr) {
      console.error('Non-blocking: Failed to write audit log:', auditErr)
    }

    // 4. Revalidate cache
    revalidatePath('/dashboard/proposals')
    revalidatePath('/dashboard/members')
    revalidatePath(`/dashboard/members/${proposal.target_person_id}`)
    revalidatePath('/tree')
    revalidatePath('/')

    return { success: true }
  } catch (err) {
    console.error('approveProposal exception:', err)
    return { error: 'Không thể phê duyệt đề xuất. Vui lòng thử lại.' }
  }
}

/**
 * Từ chối đề xuất thay đổi.
 * - Đổi trạng thái đề xuất thành 'rejected' kèm theo lý do phản hồi.
 * - Revalidate trang đề xuất.
 */
export async function rejectProposal(
  proposalId: string,
  reviewNote: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!isUuid(proposalId)) {
      return { error: 'Mã đề xuất không hợp lệ.' }
    }

    const note = reviewNote?.trim()
    if (!note) {
      return { error: 'Vui lòng nhập lý do từ chối để phản hồi lại cho thành viên gửi đề xuất.' }
    }

    const [user, profile, supabase] = await Promise.all([
      getUser(),
      getProfile(),
      getSupabase()
    ])

    if (!user || !profile?.is_active || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return { error: 'Chỉ Quản trị viên hoặc Biên tập viên mới có quyền từ chối đề xuất.' }
    }

    const { data: proposal, error: fetchError } = await supabase
      .from('change_requests')
      .select('status')
      .eq('id', proposalId)
      .maybeSingle()

    if (fetchError || !proposal) {
      return { error: 'Không tìm thấy đề xuất.' }
    }

    if (proposal.status !== 'pending') {
      return { error: `Đề xuất này đã được xử lý trước đó với trạng thái: ${proposal.status}.` }
    }

    const { error: updateError } = await supabase
      .from('change_requests')
      .update({
        status: 'rejected',
        reviewed_by_user_id: user.id,
        review_note: note,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Error rejecting change request:', updateError)
      return { error: updateError.message }
    }

    revalidatePath('/dashboard/proposals')

    return { success: true }
  } catch (err) {
    console.error('rejectProposal exception:', err)
    return { error: 'Không thể từ chối đề xuất. Vui lòng thử lại.' }
  }
}

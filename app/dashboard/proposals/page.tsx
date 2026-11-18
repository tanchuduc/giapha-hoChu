import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getProposals } from '@/app/actions/proposals'
import ProposalList, { type ProposalItem } from '@/components/proposals/ProposalList'
import { getProfile, getSupabase, getUser } from '@/utils/supabase/queries'

export const metadata: Metadata = {
  title: 'Phê Duyệt Đề Xuất Chỉnh Sửa — Gia Phả Họ Chu',
  description: 'Quản lý và phê duyệt các đề xuất cập nhật thông tin phả hệ từ thành viên con cháu họ Chu'
}

export default async function ProposalsPage() {
  const [user, profile, supabase] = await Promise.all([
    getUser(),
    getProfile(),
    getSupabase()
  ])

  if (!user || !profile?.is_active) {
    redirect('/login')
  }

  const canReview = profile.role === 'admin' || profile.role === 'editor'

  const res = await getProposals()
  const rawProposals = res.data || []

  // Fetch person names and user emails
  const personIds = Array.from(new Set(rawProposals.map((p) => p.target_person_id)))
  const personNameMap = new Map<string, string>()

  if (personIds.length > 0) {
    const { data: persons } = await supabase
      .from('persons')
      .select('id, full_name')
      .in('id', personIds)
    persons?.forEach((p) => personNameMap.set(p.id, p.full_name))
  }

  const userIds = Array.from(new Set(rawProposals.map((p) => p.proposed_by_user_id)))
  const userEmailMap = new Map<string, string>()

  if (userIds.length > 0 && profile.role === 'admin') {
    // If admin, we can fetch email info
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', userIds)
    profiles?.forEach((p) => userEmailMap.set(p.id, `Thành viên (${p.role})`))
  }

  const proposals: ProposalItem[] = rawProposals.map((item) => ({
    ...item,
    target_person_name: personNameMap.get(item.target_person_id) || 'Hồ sơ cụ',
    proposer_email: userEmailMap.get(item.proposed_by_user_id) || 'Con cháu trong họ'
  }))

  return (
    <div className='relative flex w-full flex-1 flex-col pb-16'>
      <div className='relative z-20 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-8 border-b border-stone-200/80 pb-5'>
          <h1 className='font-serif text-3xl font-bold text-stone-900'>
            Phê Duyệt Đề Xuất Phả Hệ
          </h1>
          <p className='mt-2 text-sm text-stone-600 max-w-2xl'>
            Quy trình cộng tác có kiểm soát: Mọi đề xuất bổ sung, sửa đổi thông tin từ con cháu dòng họ Chu đều được đối chiếu cẩn trọng trước khi phê duyệt áp dụng vào cây phả hệ chính thức.
          </p>
        </div>

        <main>
          <ProposalList initialProposals={proposals} canReview={canReview} />
        </main>
      </div>
    </div>
  )
}

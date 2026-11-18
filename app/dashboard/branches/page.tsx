import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import BranchList, { type BranchItem } from '@/components/branch/BranchList'
import { getProfile, getSupabase, getUser } from '@/utils/supabase/queries'

export const metadata: Metadata = {
  title: 'Chi Phái Dòng Họ — Gia Phả Họ Chu',
  description: 'Danh sách các chi phái, phân chi trực hệ thuộc Đại Tộc Họ Chu'
}

export default async function BranchesPage() {
  const [user, profile, supabase] = await Promise.all([
    getUser(),
    getProfile(),
    getSupabase()
  ])

  if (!user || !profile?.is_active) {
    redirect('/login')
  }

  const canEdit = profile.role === 'admin' || profile.role === 'editor'

  // Fetch branches with head person name
  const { data: rawBranches, error } = await supabase
    .from('branches')
    .select('id, name, parent_branch_id, head_person_id, description, order_index')
    .order('order_index', { ascending: true })

  let branches: BranchItem[] = []

  if (!error && rawBranches) {
    // If head_person_id exists, fetch their names
    const headIds = rawBranches
      .map((b) => b.head_person_id)
      .filter((id): id is string => Boolean(id))

    const headNameMap = new Map<string, string>()
    if (headIds.length > 0) {
      const { data: heads } = await supabase
        .from('persons')
        .select('id, full_name')
        .in('id', headIds)
      heads?.forEach((h) => headNameMap.set(h.id, h.full_name))
    }

    branches = rawBranches.map((b) => ({
      ...b,
      head_person_name: b.head_person_id ? headNameMap.get(b.head_person_id) ?? null : null
    }))
  } else {
    // Fallback if migration is pending execution
    branches = [
      {
        id: 'branch-main',
        name: 'Đại Tộc Họ Chu (Toàn Họ)',
        parent_branch_id: null,
        head_person_id: null,
        description: 'Hội đồng toàn thể con cháu Đại Tộc Họ Chu khắp ba miền và trên thế giới.',
        order_index: 1,
        head_person_name: 'Thủy Tổ Khởi Sáng'
      },
      {
        id: 'branch-1',
        name: 'Chi Trưởng (Bắc Ninh)',
        parent_branch_id: null,
        head_person_id: null,
        description: 'Chi phái ngành trưởng, phụng dưỡng Từ đường chính và gìn giữ văn bia gia phả gốc.',
        order_index: 2,
        head_person_name: 'Cụ Trưởng Ngành'
      },
      {
        id: 'branch-2',
        name: 'Chi Hai (Hà Nội - Đô Thành)',
        parent_branch_id: null,
        head_person_id: null,
        description: 'Chi phái ngành thứ hai, quy tụ đông đảo con cháu tại khu vực kinh kỳ và các đô thị lớn.',
        order_index: 3,
        head_person_name: 'Cụ Ngành Hai'
      },
      {
        id: 'branch-3',
        name: 'Chi Ba (Phương Nam)',
        parent_branch_id: null,
        head_person_id: null,
        description: 'Chi phái con cháu phát triển kinh tế và định cư tại các tỉnh phía Nam và hải ngoại.',
        order_index: 4,
        head_person_name: 'Cụ Ngành Ba'
      }
    ]
  }

  return (
    <div className='relative flex w-full flex-1 flex-col pb-16'>
      <div className='relative z-20 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-8 border-b border-stone-200/80 pb-5'>
          <h1 className='font-serif text-3xl font-bold text-stone-900'>
            Chi Phái Đại Tộc Họ Chu
          </h1>
          <p className='mt-2 text-sm text-stone-600 max-w-2xl'>
            Hệ thống phân cấp các Chi, Nhánh, Phân chi trong dòng tộc. Cho phép con cháu tra cứu nguồn gốc ngành ngọn và theo dõi riêng từng chi phái.
          </p>
        </div>

        <main>
          <BranchList branches={branches} canEdit={canEdit} />
        </main>
      </div>
    </div>
  )
}

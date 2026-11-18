import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import PaperDigitizationHub from '@/components/digitization/PaperDigitizationHub'
import { fetchAllRowsOrThrow } from '@/utils/supabase/fetchAll'
import { getProfile, getSupabase, getUser } from '@/utils/supabase/queries'
import type { Branch, Person } from '@/types'

export const metadata: Metadata = {
  title: 'Số Hóa Gia Phả Giấy & Thẩm Định — Gia Phả Họ Chu',
  description: 'Trung tâm chuyển đổi số gia phả giấy chữ Quốc ngữ: OCR, trích xuất cấu trúc và bàn thẩm định đối chiếu trước khi nạp vào hệ thống chính thức'
}

export default async function DigitizationPage() {
  const [user, profile, supabase] = await Promise.all([
    getUser(),
    getProfile(),
    getSupabase()
  ])

  if (!user || !profile?.is_active) {
    redirect('/login')
  }

  const canManage = profile.role === 'admin' || profile.role === 'editor'

  const [personsRes, branchesRes] = await Promise.all([
    fetchAllRowsOrThrow((from, to) =>
      supabase
        .from('persons')
        .select('*')
        .is('deleted_at', null)
        .order('id')
        .range(from, to)
    ),
    supabase
      .from('branches')
      .select('*')
      .order('order_index', { ascending: true })
  ])

  const persons = (personsRes.data as Person[]) || []
  const branches = (branchesRes.data as Branch[]) || []

  return (
    <div className='relative flex w-full flex-1 flex-col pb-16'>
      <div className='relative z-20 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-8 border-b border-stone-200/80 pb-5'>
          <h1 className='font-serif text-3xl font-bold text-stone-900'>
            Số Hóa Gia Phả Giấy & Bàn Thẩm Định
          </h1>
          <p className='mt-2 text-sm text-stone-600 max-w-3xl'>
            Chuyển giao di sản: Tiếp nhận văn tự gia phả giấy, bản in/đánh máy chữ Quốc ngữ qua các thời kỳ. Hệ thống hỗ trợ bóc tách cấu trúc phả hệ và tổ chức đối chiếu nghiêm ngặt (Human-in-the-loop) trước khi đưa vào cây phả hệ chính thức của dòng họ Chu.
          </p>
        </div>

        <main>
          <PaperDigitizationHub
            existingPersons={persons}
            branches={branches}
            canManage={canManage}
          />
        </main>
      </div>
    </div>
  )
}

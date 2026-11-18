import { Suspense } from 'react'

import AncestralTabs from '@/components/ancestral/AncestralTabs'
import MemberDetailModal from '@/components/modal/MemberDetailModal'
import { MemberListProvider } from '@/context/MemberListContext'
import { EVENT_PERSON_COLUMNS, EVENT_PERSON_FILTER } from '@/utils/eventPersons'
import { fetchAllRowsOrThrow } from '@/utils/supabase/fetchAll'
import { getIsAdmin, getSupabase, getUser } from '@/utils/supabase/queries'

export async function generateMetadata() {
  return { title: 'Từ Đường & Lịch Giỗ Họ Chu' }
}

export default async function EventsPage() {
  const [supabase, user, isAdmin] = await Promise.all([
    getSupabase(),
    getUser(),
    getIsAdmin()
  ])

  const [personsRes, customEventsRes] = await Promise.all([
    fetchAllRowsOrThrow((from, to) =>
      supabase
        .from('persons')
        .select(EVENT_PERSON_COLUMNS)
        .is('deleted_at', null)
        .or(EVENT_PERSON_FILTER)
        .order('id')
        .range(from, to)
    ),
    fetchAllRowsOrThrow((from, to) =>
      supabase
        .from('custom_events')
        // '*' includes recurrence once the database has the column.
        .select('*')
        .order('id')
        .range(from, to)
    )
  ])

  const persons = personsRes.data || []
  const customEvents = customEventsRes.data || []

  return (
    <Suspense fallback={null}>
      <MemberListProvider>
        <div className='relative flex w-full flex-1 flex-col pb-12'>
          <div className='relative z-20 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 text-center'>
            <h1 className='font-serif text-3xl font-bold text-[#4A2818] tracking-tight'>Từ Đường & Lịch Giỗ</h1>
            <p className='mt-1.5 text-sm text-[#786C65] max-w-lg mx-auto'>
              Phụng thờ Tiên Tổ họ Chu, tra cứu ngày kỵ âm lịch và ghi nhớ cội nguồn gia tộc
            </p>
          </div>

          <main className='mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 lg:px-8'>
            <AncestralTabs
              persons={persons ?? []}
              customEvents={customEvents ?? []}
              currentUserId={user?.id ?? null}
              isAdmin={Boolean(isAdmin)}
            />
          </main>
        </div>

        {/* Modal for member details when clicking an event card */}
        <MemberDetailModal />
      </MemberListProvider>
    </Suspense>
  )
}

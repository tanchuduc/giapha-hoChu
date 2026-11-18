'use client'

import { useState } from 'react'
import { CalendarDays, Landmark } from 'lucide-react'

import AncestralHall from '@/components/ancestral/AncestralHall'
import EventsList from '@/components/EventsList'
import type { CustomEventRecord } from '@/utils/eventHelpers'

interface PersonItem {
  id: string
  full_name: string
  birth_year: number | null
  birth_month: number | null
  birth_day: number | null
  death_year: number | null
  death_month: number | null
  death_day: number | null
  death_lunar_year: number | null
  death_lunar_month: number | null
  death_lunar_day: number | null
  is_deceased: boolean
}

interface AncestralTabsProps {
  persons: PersonItem[]
  customEvents: CustomEventRecord[]
  currentUserId: string | null
  isAdmin: boolean
}

export default function AncestralTabs({
  persons,
  customEvents,
  currentUserId,
  isAdmin
}: AncestralTabsProps) {
  const [activeTab, setActiveTab] = useState<'hall' | 'calendar'>('hall')

  const deceasedPersons = persons.filter((p) => p.is_deceased || p.death_year != null)

  return (
    <div className='space-y-6'>
      {/* ── Tab Switcher ── */}
      <div className='flex items-center justify-center'>
        <div className='inline-flex rounded-2xl border border-[#EBDED2] bg-white p-1.5 shadow-xs'>
          <button
            type='button'
            onClick={() => setActiveTab('hall')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'hall'
                ? 'bg-[#4A2818] text-white shadow-xs'
                : 'text-[#786C65] hover:text-[#4A2818] hover:bg-[#FAF7F2]'
            }`}>
            <Landmark className='size-4' />
            <span>Không Gian Từ Đường</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-[#4A2818] text-white shadow-xs'
                : 'text-[#786C65] hover:text-[#4A2818] hover:bg-[#FAF7F2]'
            }`}>
            <CalendarDays className='size-4' />
            <span>Lịch Giỗ & Sự Kiện</span>
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'hall' ? (
        <AncestralHall deceasedPersons={deceasedPersons} />
      ) : (
        <EventsList
          persons={persons}
          customEvents={customEvents}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}

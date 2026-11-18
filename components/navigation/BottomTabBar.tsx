'use client'

import {
  CalendarDays,
  GitMerge,
  Home,
  Image as ImageIcon,
  Network
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useI18n } from '@/lib/i18n/useI18n'

export default function BottomTabBar() {
  const pathname = usePathname()
  const { t } = useI18n()

  const tabs = [
    {
      href: '/dashboard',
      label: t('dashboard'),
      icon: Home,
      exact: true
    },
    {
      href: '/dashboard/members',
      label: t('familyTree'),
      icon: Network,
      exact: false
    },
    {
      href: '/dashboard/events',
      label: 'Từ đường',
      icon: CalendarDays,
      exact: false
    },
    {
      href: '/dashboard/kinship',
      label: t('kinship'),
      icon: GitMerge,
      exact: false
    },
    {
      href: '/dashboard/gallery',
      label: t('galleryTitle'),
      icon: ImageIcon,
      exact: false
    }
  ]

  return (
    <aside
      aria-label='Mobile Tab Navigation'
      className='fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md print:hidden lg:hidden'>
      <div className='mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2'>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'font-semibold text-amber-700'
                  : 'text-stone-500 hover:text-stone-900 active:text-stone-900'
              }`}>
              <div
                className={`flex size-8 items-center justify-center rounded-full transition-all ${
                  isActive ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/40' : ''
                }`}>
                <Icon className='size-4.5 shrink-0' />
              </div>
              <span className='max-w-[70px] truncate text-[10px] leading-tight'>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}

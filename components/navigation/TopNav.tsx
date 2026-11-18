'use client'

import {
  BarChart2,
  BookOpen,
  CalendarDays,
  GitBranch,
  GitMerge,
  Home,
  Image as ImageIcon,
  Network
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useI18n } from '@/lib/i18n/useI18n'

export default function TopNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems = [
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
      href: '/dashboard/branches',
      label: 'Chi phái',
      icon: GitBranch,
      exact: false
    },
    {
      href: '/dashboard/kinship',
      label: t('kinship'),
      icon: GitMerge,
      exact: false
    },
    {
      href: '/dashboard/events',
      label: t('eventsTitle'),
      icon: CalendarDays,
      exact: false
    },
    {
      href: '/dashboard/gallery',
      label: t('galleryTitle'),
      icon: ImageIcon,
      exact: false
    },
    {
      href: '/dashboard/lineage/book',
      label: t('lineageBookTitle'),
      icon: BookOpen,
      exact: false
    },
    {
      href: '/dashboard/stats',
      label: t('statistics'),
      icon: BarChart2,
      exact: false
    }
  ]

  return (
    <nav
      aria-label='Main Navigation'
      className='hidden items-center gap-1 xl:gap-2 lg:flex'>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs xl:text-sm font-medium transition-all ${
              isActive
                ? 'bg-amber-100/80 text-amber-900 font-semibold shadow-xs ring-1 ring-amber-300/50'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}>
            <Icon
              className={`size-4 shrink-0 transition-colors ${
                isActive ? 'text-amber-700' : 'text-stone-400 group-hover:text-stone-600'
              }`}
            />
            <span className='whitespace-nowrap'>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  GitMerge,
  Home,
  Menu,
  Network
} from 'lucide-react'

import MobileMenuDrawer from '@/components/navigation/MobileMenuDrawer'

export default function BottomTabBar() {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const tabs = [
    {
      href: '/dashboard',
      label: 'Trang chủ',
      icon: Home,
      exact: true
    },
    {
      href: '/dashboard/members',
      label: 'Cây phả hệ',
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
      label: 'Xưng hô',
      icon: GitMerge,
      exact: false
    }
  ]

  return (
    <>
      <aside
        aria-label='Điều hướng di động'
        className='fixed bottom-0 inset-x-0 z-40 border-t border-[#EBDED2] bg-white/95 backdrop-blur-md print:hidden lg:hidden'>
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
                    ? 'font-bold text-[#C2671A]'
                    : 'text-[#786C65] hover:text-[#4A2818] active:text-[#4A2818]'
                }`}>
                <div
                  className={`flex size-8 items-center justify-center rounded-full transition-all ${
                    isActive ? 'bg-amber-100/80 text-[#C2671A] ring-1 ring-amber-300/40' : ''
                  }`}>
                  <Icon className='size-4.5 shrink-0' />
                </div>
                <span className='max-w-[70px] truncate text-[10px] leading-tight'>
                  {tab.label}
                </span>
              </Link>
            )
          })}

          {/* 5th Tab: Menu Thêm (Drawer) */}
          <button
            type='button'
            onClick={() => setIsDrawerOpen(true)}
            aria-label='Mở menu đầy đủ'
            className='flex h-full flex-col items-center justify-center gap-1 text-[#786C65] hover:text-[#4A2818] active:text-[#4A2818] transition-colors'>
            <div className='flex size-8 items-center justify-center rounded-full'>
              <Menu className='size-4.5 shrink-0' />
            </div>
            <span className='max-w-[70px] truncate text-[10px] leading-tight font-medium'>
              Thêm
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <MobileMenuDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  )
}

'use client'

import { memo } from 'react'
import Link from 'next/link'
import {
  ArrowUpCircle,
  BarChart2,
  BookOpen,
  Database,
  FileCheck,
  FileSpreadsheet,
  GitBranch,
  GitMerge,
  Home,
  Image as ImageIcon,
  Info,
  Landmark,
  Network,
  ShieldCheck,
  Users,
  X
} from 'lucide-react'

import { useUser } from '@/components/UserProvider'

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
}

function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
  const { user, profile, isAdmin } = useUser()
  const isEditor = profile?.role === 'editor' || isAdmin

  if (!isOpen) return null

  const mainGroups = [
    {
      title: 'Gia Phả & Phả Hệ',
      items: [
        { href: '/dashboard/members', icon: Network, label: 'Cây phả hệ trực quan', badge: 'Chính' },
        { href: '/dashboard/branches', icon: GitBranch, label: 'Chi phái dòng họ Chu' },
        { href: '/dashboard/kinship', icon: GitMerge, label: 'Tra cứu xưng hô họ hàng' }
      ]
    },
    {
      title: 'Di Sản & Tâm Linh',
      items: [
        { href: '/dashboard/events', icon: Landmark, label: 'Từ đường & Lịch giỗ âm lịch', badge: 'Tâm linh' },
        { href: '/dashboard/lineage/book', icon: BookOpen, label: 'Phả ký & Kỷ yếu dòng họ' },
        { href: '/dashboard/gallery', icon: ImageIcon, label: 'Thư viện ảnh gia tộc' },
        { href: '/dashboard/digitization', icon: FileSpreadsheet, label: 'Số hóa gia phả giấy' }
      ]
    },
    {
      title: 'Hoạt Động & Đóng Góp',
      items: [
        { href: '/dashboard/proposals', icon: FileCheck, label: 'Duyệt & Đóng góp thông tin' },
        { href: '/dashboard/stats', icon: BarChart2, label: 'Thống kê nhân khẩu & thế hệ' },
        { href: '/about', icon: Info, label: 'Giới thiệu nguồn cội họ Chu' }
      ]
    }
  ]

  const adminItems = [
    { href: '/dashboard/users', icon: Users, label: 'Quản lý thành viên & tài khoản' },
    { href: '/dashboard/lineage', icon: Network, label: 'Sắp xếp thứ tự phả hệ' },
    { href: '/dashboard/data', icon: Database, label: 'Sao lưu & Phục hồi dữ liệu' },
    { href: '/dashboard/upgrade', icon: ArrowUpCircle, label: 'Nâng cấp hệ thống' }
  ]

  return (
    <div className='fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs lg:hidden'>
      {/* Backdrop click to close */}
      <div className='absolute inset-0' onClick={onClose} />

      {/* Drawer Panel */}
      <aside
        aria-label='Danh mục chức năng'
        className='relative z-10 flex h-full w-4/5 max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-[#EBDED2] bg-[#FAF7F2] p-4'>
          <div className='flex items-center gap-2.5'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-[#4A2818] text-amber-200 font-serif font-bold text-sm'>
              朱
            </div>
            <div>
              <h3 className='font-serif text-sm font-bold text-[#4A2818]'>Gia Phả Họ Chu</h3>
              <p className='text-[10px] text-[#786C65]'>{user?.email ?? 'Thành viên dòng họ'}</p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Đóng menu'
            className='rounded-lg p-1.5 text-[#786C65] hover:bg-stone-200'>
            <X className='size-5' />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto p-4 space-y-6'>
          {/* Quick link Home */}
          <Link
            href='/dashboard'
            onClick={onClose}
            className='flex items-center gap-3 rounded-xl border border-[#EBDED2] bg-[#FAF7F2] p-3 text-sm font-bold text-[#4A2818] shadow-2xs transition hover:bg-white'>
            <Home className='size-5 text-[#C2671A]' />
            <span>Trang Chủ Gia Tộc</span>
          </Link>

          {/* Feature Groups */}
          {mainGroups.map((group) => (
            <div key={group.title} className='space-y-2'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-[#786C65] px-1'>
                {group.title}
              </p>
              <div className='space-y-1'>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className='flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-[#4A2818] transition hover:bg-[#FAF7F2]'>
                      <div className='flex items-center gap-2.5'>
                        <Icon className='size-4 text-[#C2671A]' />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-[#8C6D58]'>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Admin Group */}
          {isEditor && (
            <div className='space-y-2 pt-2 border-t border-[#EBDED2]'>
              <div className='flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-[#4A2818]'>
                <ShieldCheck className='size-3.5 text-[#4A2818]' />
                <span>Ban Quản Trị Tộc Họ</span>
              </div>
              <div className='space-y-1'>
                {adminItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#4A2818] transition hover:bg-stone-100'>
                      <Icon className='size-4 text-[#4A2818]' />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

export default memo(MobileMenuDrawer)

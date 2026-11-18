'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowUpCircle,
  BarChart2,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Database,
  FileCheck,
  FileSpreadsheet,
  GitBranch,
  GitMerge,
  Home,
  Image as ImageIcon,
  Landmark,
  Network,
  ShieldCheck,
  Users
} from 'lucide-react'

import { useUser } from '@/components/UserProvider'

export default function TopNav() {
  const pathname = usePathname()
  const { profile, isAdmin } = useUser()
  const isEditor = profile?.role === 'editor' || isAdmin
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  // Click outside to close any open dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navGroups = [
    {
      id: 'giapha',
      label: 'Gia Phả',
      icon: Network,
      activeMatch: ['/dashboard/members', '/dashboard/branches', '/dashboard/kinship'],
      items: [
        {
          href: '/dashboard/members',
          icon: Network,
          label: 'Cây Phả Hệ Trực Quan',
          description: 'Sơ đồ cây theo đời & chi cành'
        },
        {
          href: '/dashboard/branches',
          icon: GitBranch,
          label: 'Chi Phái Dòng Họ',
          description: 'Các cành nhánh đại gia đình họ Chu'
        },
        {
          href: '/dashboard/kinship',
          icon: GitMerge,
          label: 'Tra Cứu Xưng Hô Họ Hàng',
          description: 'Hỏi cách gọi theo lễ nghĩa gia tộc'
        }
      ]
    },
    {
      id: 'disan',
      label: 'Di Sản & Tâm Linh',
      icon: Landmark,
      activeMatch: ['/dashboard/events', '/dashboard/lineage/book', '/dashboard/gallery', '/dashboard/digitization'],
      items: [
        {
          href: '/dashboard/events',
          icon: Landmark,
          label: 'Từ Đường & Lịch Giỗ',
          description: 'Phụng thờ tiên tổ, ngày kỵ âm lịch'
        },
        {
          href: '/dashboard/lineage/book',
          icon: BookOpen,
          label: 'Phả Ký & Kỷ Yếu Dòng Họ',
          description: 'Sử tích cội nguồn & sách gia phả'
        },
        {
          href: '/dashboard/gallery',
          icon: ImageIcon,
          label: 'Thư Viện Ảnh Gia Tộc',
          description: 'Hình ảnh nhà thờ họ & kỷ niệm'
        },
        {
          href: '/dashboard/digitization',
          icon: FileSpreadsheet,
          label: 'Số Hóa Gia Phả Giấy',
          description: 'Trích xuất & chuyển đổi tư liệu cổ'
        }
      ]
    },
    {
      id: 'hoatdong',
      label: 'Hoạt Động',
      icon: FileCheck,
      activeMatch: ['/dashboard/proposals'],
      items: [
        {
          href: '/dashboard/proposals',
          icon: FileCheck,
          label: 'Duyệt & Đóng Góp Thông Tin',
          description: 'Xét duyệt đề xuất từ con cháu'
        },
        {
          href: '/dashboard/events',
          icon: CalendarDays,
          label: 'Lịch Giỗ & Sự Kiện',
          description: 'Nhắc hẹn ngày kỵ trong năm'
        }
      ]
    }
  ]

  const adminGroup = {
    id: 'quantri',
    label: 'Quản Trị',
    icon: ShieldCheck,
    activeMatch: ['/dashboard/users', '/dashboard/lineage', '/dashboard/data', '/dashboard/upgrade'],
    items: [
      {
        href: '/dashboard/users',
        icon: Users,
        label: 'Quản Lý Thành Viên & Tài Khoản',
        description: 'Phân quyền Admin, Editor, Member'
      },
      {
        href: '/dashboard/lineage',
        icon: Network,
        label: 'Sắp Xếp Thứ Tự Phả Hệ',
        description: 'Điều chỉnh thế hệ & thứ tự cành nhánh'
      },
      {
        href: '/dashboard/data',
        icon: Database,
        label: 'Sao Lưu & Phục Hồi Dữ Liệu',
        description: 'Xuất nhập Excel, GEDCOM, JSON'
      },
      {
        href: '/dashboard/upgrade',
        icon: ArrowUpCircle,
        label: 'Nâng Cấp Hệ Thống',
        description: 'Kiểm tra phiên bản & bảo trì'
      }
    ]
  }

  const isHomeActive = pathname === '/dashboard'
  const isStatsActive = pathname === '/dashboard/stats'

  return (
    <nav
      ref={navRef}
      aria-label='Điều hướng chính'
      className='hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0'>
      {/* 1. Trang Chủ */}
      <Link
        href='/dashboard'
        className={`flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
          isHomeActive
            ? 'bg-[#FAF7F2] text-[#4A2818] ring-1 ring-[#EBDED2] shadow-2xs'
            : 'text-[#786C65] hover:bg-[#FAF7F2] hover:text-[#4A2818]'
        }`}>
        <Home className='size-3.5 xl:size-4 text-[#C2671A] shrink-0' />
        <span className='whitespace-nowrap'>Trang Chủ</span>
      </Link>

      {/* 2. Các nhóm chức năng có dropdown */}
      {navGroups.map((group) => {
        const Icon = group.icon
        const isActive = group.activeMatch.some(
          (m) => pathname === m || pathname.startsWith(`${m}/`)
        )
        const isOpen = openDropdown === group.id

        return (
          <div key={group.id} className='relative shrink-0'>
            <button
              type='button'
              onClick={() => setOpenDropdown(isOpen ? null : group.id)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-amber-100/70 text-[#4A2818] ring-1 ring-amber-300/40 shadow-2xs'
                  : 'text-[#786C65] hover:bg-[#FAF7F2] hover:text-[#4A2818]'
              }`}>
              <Icon className='size-3.5 xl:size-4 text-[#C2671A] shrink-0' />
              <span className='whitespace-nowrap'>{group.label}</span>
              <ChevronDown
                className={`size-3 text-stone-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#C2671A]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Panel */}
            {isOpen && (
              <div className='absolute left-0 mt-2 w-72 origin-top-left rounded-2xl border border-[#EBDED2] bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150'>
                <div className='space-y-1'>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon
                    const isItemActive =
                      pathname === item.href || pathname.startsWith(`${item.href}/`)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={`flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                          isItemActive
                            ? 'bg-[#FAF7F2] text-[#4A2818] font-bold'
                            : 'hover:bg-[#FAF7F2] text-[#4A2818]'
                        }`}>
                        <div className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#EBDED2] text-[#C2671A]'>
                          <ItemIcon className='size-4' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-bold leading-tight whitespace-nowrap'>{item.label}</p>
                          <p className='mt-0.5 text-[11px] text-[#786C65] leading-tight truncate'>
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* 3. Thống Kê */}
      <Link
        href='/dashboard/stats'
        className={`flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
          isStatsActive
            ? 'bg-amber-100/70 text-[#4A2818] ring-1 ring-amber-300/40 shadow-2xs'
            : 'text-[#786C65] hover:bg-[#FAF7F2] hover:text-[#4A2818]'
        }`}>
        <BarChart2 className='size-3.5 xl:size-4 text-[#C2671A] shrink-0' />
        <span className='whitespace-nowrap'>Thống Kê</span>
      </Link>

      {/* 4. Ban Quản Trị (Chỉ hiện khi có quyền Editor/Admin) */}
      {isEditor && (
        <div className='relative ml-1 pl-1 border-l border-[#EBDED2] shrink-0'>
          <button
            type='button'
            onClick={() => setOpenDropdown(openDropdown === 'quantri' ? null : 'quantri')}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-bold whitespace-nowrap shrink-0 transition-all ${
              adminGroup.activeMatch.some((m) => pathname === m || pathname.startsWith(`${m}/`))
                ? 'bg-[#4A2818] text-white shadow-2xs'
                : 'bg-stone-100/80 text-[#4A2818] hover:bg-[#4A2818] hover:text-white'
            }`}>
            <ShieldCheck className='size-3.5 xl:size-4 text-amber-300 shrink-0' />
            <span className='whitespace-nowrap'>Quản Trị</span>
            <ChevronDown
              className={`size-3 text-stone-400 shrink-0 transition-transform duration-200 ${
                openDropdown === 'quantri' ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Dropdown Quản Trị */}
          {openDropdown === 'quantri' && (
            <div className='absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[#EBDED2] bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150'>
              <div className='border-b border-[#EBDED2] px-3 py-2 bg-[#FAF7F2] rounded-xl mb-1'>
                <p className='text-xs font-bold text-[#4A2818] flex items-center gap-1.5 whitespace-nowrap'>
                  <ShieldCheck className='size-3.5 text-[#C2671A] shrink-0' />
                  Khu Vực Ban Trị Sự Dòng Họ
                </p>
                <p className='text-[10px] text-[#786C65] mt-0.5 truncate'>Chỉ dành cho Quản trị viên & Ban biên tập</p>
              </div>
              <div className='space-y-1'>
                {adminGroup.items.map((item) => {
                  const ItemIcon = item.icon
                  const isItemActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                        isItemActive
                          ? 'bg-[#FAF7F2] text-[#4A2818] font-bold'
                          : 'hover:bg-[#FAF7F2] text-[#4A2818]'
                      }`}>
                      <div className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[#4A2818]'>
                        <ItemIcon className='size-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-xs font-bold leading-tight whitespace-nowrap'>{item.label}</p>
                        <p className='mt-0.5 text-[11px] text-[#786C65] leading-tight truncate'>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

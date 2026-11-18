'use client'

import { AnimatePresence, m } from 'framer-motion'
import {
  ChevronDown,
  Database,
  FileCheck,
  Info,
  Shield,
  UserCheck,
  UserCircle,
  Users
} from 'lucide-react'
import Link from 'next/link'

import { usePopupMenu } from '@/hooks/usePopupMenu'
import { useI18n } from '@/lib/i18n/useI18n'

import LogoutButton from './LogoutButton'
import { useUser } from './UserProvider'

export default function HeaderMenu() {
  const { user, isAdmin, isEditor } = useUser()
  const { t } = useI18n()
  const userEmail = user?.email
  const {
    isOpen,
    close,
    toggle,
    containerRef,
    buttonRef,
    menuId,
    buttonProps
  } = usePopupMenu()

  const roleLabel = isAdmin
    ? 'Quản trị viên'
    : isEditor
      ? 'Biên tập viên'
      : 'Thành viên dòng họ'

  return (
    <div className='relative' ref={containerRef}>
      <button
        type='button'
        ref={buttonRef}
        {...buttonProps}
        aria-label={t('account')}
        onClick={toggle}
        className='flex items-center gap-2 rounded-full border border-border/80 bg-surface/60 py-1.5 pr-3 pl-1.5 transition-all duration-200 hover:border-amber-400/50 hover:bg-surface shadow-xs'>
        <div className='flex size-8 items-center justify-center rounded-full bg-linear-to-br from-amber-200 via-amber-100 to-amber-300/80 font-serif font-bold text-amber-900 shadow-xs ring-1 ring-amber-400/30'>
          {userEmail ? (
            userEmail.charAt(0).toUpperCase()
          ) : (
            <UserCircle className='size-5' />
          )}
        </div>
        <span className='hidden sm:inline-block max-w-[120px] truncate text-xs font-medium text-stone-700'>
          {userEmail?.split('@')[0]}
        </span>
        <ChevronDown
          className={`size-3.5 text-stone-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            id={menuId}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className='absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl ring-1 ring-black/5'>
            {/* Header info card */}
            <div className='border-b border-border/80 bg-amber-50/50 px-4 py-3'>
              <div className='flex items-center gap-2.5'>
                <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-200/90 font-serif font-bold text-amber-900 shadow-xs'>
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-xs font-semibold text-stone-900'>
                    {userEmail}
                  </p>
                  <div className='mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100/80 text-amber-900'>
                    {isAdmin ? (
                      <Shield className='size-3 text-amber-700' />
                    ) : (
                      <UserCheck className='size-3 text-stone-600' />
                    )}
                    <span>{roleLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Management Links for Admin/Editor */}
            {(isAdmin || isEditor) && (
              <div className='border-b border-border/60 py-1.5 px-1'>
                <p className='px-3 py-1 text-[11px] font-semibold tracking-wider text-amber-900/60 uppercase'>
                  Khu vực Quản trị
                </p>
                <Link
                  href='/dashboard/proposals'
                  onClick={close}
                  className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors'>
                  <FileCheck className='size-4 text-amber-700' />
                  <span>Duyệt đề xuất</span>
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href='/dashboard/users'
                      onClick={close}
                      className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors'>
                      <Users className='size-4 text-amber-700' />
                      <span>Quản lý thành viên</span>
                    </Link>
                    <Link
                      href='/dashboard/data'
                      onClick={close}
                      className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors'>
                      <Database className='size-4 text-amber-700' />
                      <span>Sao lưu & Dữ liệu</span>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* General Utilities & Logout */}
            <div className='py-1.5 px-1'>
              <Link
                href='/about'
                onClick={close}
                className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors'>
                <Info className='size-4 text-stone-500' />
                <span>Giới thiệu & Hướng dẫn</span>
              </Link>
              <div className='my-1 border-t border-border/60' />
              <div className='px-1'>
                <LogoutButton />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

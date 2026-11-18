import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import config from '@/app/config'
import DashboardHeader from '@/components/DashboardHeader'
import Footer from '@/components/Footer'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import LogoutButton from '@/components/LogoutButton'
import BottomTabBar from '@/components/navigation/BottomTabBar'
import { UserProvider } from '@/components/UserProvider'
import { TextSizeProvider } from '@/context/TextSizeContext'
import { getServerTranslations } from '@/lib/i18n/server'
import { getProfile, getUser } from '@/utils/supabase/queries'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [{ t }, user] = await Promise.all([getServerTranslations(), getUser()])

  if (!user) {
    redirect('/login')
  }

  const profile = await getProfile()

  if (!profile?.is_active) {
    return (
      <div className='flex min-h-screen flex-col bg-neutral font-sans text-primary'>
        <header className='sticky top-0 z-30 border-b border-[#ebded2] bg-white/80 backdrop-blur-md transition-colors duration-200'>
          <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center gap-4'>
              <Link href='/' className='group flex items-center gap-2'>
                <h1 className='font-serif text-xl font-semibold text-[#4a2818] transition-colors group-hover:text-amber-800 sm:text-2xl'>
                  {config.siteName}
                </h1>
              </Link>
            </div>
            <div className='flex items-center gap-3'>
              <LanguageSwitcher />
              <div className='w-32'>
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        <main className='flex flex-1 flex-col items-center justify-center p-4 py-12'>
          <div className='w-full max-w-lg rounded-3xl border border-[#ebded2] bg-white/90 p-8 text-center backdrop-blur-xl shadow-xs sm:p-10'>
            <div className='mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200 text-[#4a2818]'>
              <svg
                className='size-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
            </div>

            <div className='inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-semibold text-amber-900 mb-3'>
              <span>✦</span>
              <span>Tài Khoản Đang Chờ Duyệt</span>
              <span>✦</span>
            </div>

            <h2 className='mb-2.5 font-serif text-2xl font-semibold text-[#4a2818] sm:text-3xl'>
              {t('pendingTitle')}
            </h2>

            <p className='text-sm leading-relaxed text-stone-600 sm:text-base'>
              {t('pendingDescription')}
            </p>

            <div className='mt-6 rounded-2xl border border-[#ebded2] bg-[#faf7f2] p-4 text-left text-xs sm:text-sm text-stone-700 space-y-2'>
              <p className='font-semibold text-[#4a2818]'>
                Thông tin tài khoản:
              </p>
              <div className='flex items-center justify-between text-stone-600'>
                <span>Email đăng ký:</span>
                <span className='font-medium text-stone-900'>{user.email}</span>
              </div>
              <div className='flex items-center justify-between text-stone-600'>
                <span>Trạng thái:</span>
                <span className='font-medium text-amber-800'>Chờ Ban Trị Sự kích hoạt</span>
              </div>
              <div className='border-t border-[#ebded2] pt-2 mt-2'>
                <p className='font-semibold text-[#4a2818] mb-1'>Liên hệ Ban Trị Sự Dòng Họ:</p>
                <p className='text-stone-600'>
                  {t('clanCouncilContact')}
                </p>
              </div>
            </div>

            <div className='mt-6 flex flex-col sm:flex-row gap-3 justify-center'>
              <Link
                href='/dashboard'
                className='inline-flex items-center justify-center rounded-xl bg-[#4a2818] px-5 py-3 text-sm font-medium text-white shadow-xs transition duration-200 hover:bg-[#381e12]'>
                Kiểm tra lại trạng thái
              </Link>
              <Link
                href='/'
                className='inline-flex items-center justify-center rounded-xl border border-[#ebded2] bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:bg-[#faf7f2]'>
                Trang chủ dòng họ
              </Link>
            </div>
          </div>
        </main>

        <Footer className='mt-auto border-t border-[#ebded2] bg-white' />
      </div>
    )
  }

  return (
    <UserProvider user={user} profile={profile}>
      <TextSizeProvider>
        <div className='flex min-h-screen flex-col pb-16 lg:pb-0 bg-neutral font-sans text-primary print:bg-white print:pb-0'>
          <DashboardHeader />
          {children}
          <Footer
            className='mt-auto border-t border-stone-200 bg-white'
            showDisclaimer={true}
          />
          <BottomTabBar />
        </div>
      </TextSizeProvider>
    </UserProvider>
  )
}

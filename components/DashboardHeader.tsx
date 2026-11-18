import Image from 'next/image'
import Link from 'next/link'

import config from '@/app/config'
import GlobalMemberSearch from '@/components/GlobalMemberSearch'
import HeaderMenu from '@/components/HeaderMenu'
import TopNav from '@/components/navigation/TopNav'

export default function DashboardHeader() {
  return (
    <header className='sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-xl transition-colors duration-200 print:hidden'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3 shrink-0'>
          <Link
            href='/dashboard'
            className='group flex items-center gap-2 sm:gap-3'>
            <div className='relative size-10 shrink-0 overflow-hidden rounded-xl transition-colors'>
              <Image
                src='/icon.png'
                alt=''
                fill
                className='object-contain'
                sizes='40px'
              />
            </div>
            <span className='font-serif text-xl font-semibold text-stone-800 transition-colors group-hover:text-amber-700 sm:text-2xl whitespace-nowrap'>
              {config.siteName}
            </span>
          </Link>
        </div>

        {/* Desktop Main Navigation */}
        <div className='hidden lg:flex flex-1 justify-center px-4'>
          <TopNav />
        </div>

        {/* User Search & Profile Menu */}
        <div className='flex items-center gap-2.5 sm:gap-3 shrink-0'>
          <GlobalMemberSearch />
          <HeaderMenu />
        </div>
      </div>
    </header>
  )
}

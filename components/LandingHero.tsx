'use client'

import { m, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Compass,
  GitBranch,
  HeartHandshake,
  Landmark,
  TreePine,
  Users
} from 'lucide-react'
import Link from 'next/link'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 }
  }
}

interface LandingHeroProps {
  siteName: string
  isLoggedIn?: boolean
}

export default function LandingHero({ siteName, isLoggedIn = false }: LandingHeroProps) {
  const clanValues = [
    {
      icon: <GitBranch className='size-6 text-amber-800' />,
      title: 'Cây Gia Phả Đa Chi Nhánh',
      desc: 'Minh bạch 7 thế hệ dòng tộc, phân định rõ ràng các Chi Trưởng, Chi Hai, Chi Ba và các nhánh con cháu tỏa đi muôn phương.'
    },
    {
      icon: <HeartHandshake className='size-6 text-amber-800' />,
      title: 'Kết Nối Đồng Tộc Muôn Nơi',
      desc: 'Gắn kết con cháu họ Chu trên khắp mọi miền Tổ quốc và kiều bào, tự động nhắc ngày giỗ chạp, lễ tảo mộ và khuyến học khuyến tài.'
    },
    {
      icon: <Landmark className='size-6 text-amber-800' />,
      title: 'Bảo Tồn Di Sản & Tâm Linh',
      desc: 'Lưu giữ chúc thư, văn tự phả ký cổ và bản đồ chỉ dẫn mộ phần tiền tổ trên Google Maps, phục vụ con cháu tìm về bái tế nguồn cội.'
    }
  ]

  return (
    <m.div
      className='relative z-10 w-full max-w-5xl space-y-8 sm:space-y-10 text-center'
      initial='hidden'
      animate='visible'
      variants={staggerContainer}>
      
      {/* Hero Header Section */}
      <m.div className='flex flex-col items-center space-y-4 sm:space-y-6' variants={fadeIn}>
        {/* Heritage Tagline Badge */}
        <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900 shadow-xs'>
          <TreePine className='size-3.5 text-amber-700' />
          <span>Nơi Nguồn Cội Lưu Truyền Muôn Đời</span>
        </div>

        {/* Clan Name Title */}
        <h1 className='max-w-4xl font-serif text-4xl leading-tight font-bold text-stone-900 sm:text-5xl md:text-6xl lg:text-[4.2rem]'>
          <span className='block text-primary'>{siteName}</span>
        </h1>

        {/* Traditional Couplet */}
        <div className='space-y-1'>
          <p className='font-serif text-base italic text-amber-900/90 sm:text-lg md:text-xl'>
            &ldquo;Mộc xuất thiên chi do hữu bản — Thủy lưu vạn phái tổng đồng nguyên&rdquo;
          </p>
          <p className='text-xs text-stone-500 font-serif italic'>
            (Cây sinh ngàn nhánh do từ gốc — Nước chảy vạn dòng bởi một nguồn)
          </p>
        </div>

        {/* Visual Focal Point: Clan Crest / Tree Illustration */}
        <div className='py-2'>
          <div className='relative mx-auto flex size-20 sm:size-24 items-center justify-center rounded-3xl border border-amber-200/90 bg-linear-to-b from-amber-100/60 to-white/90 p-4 shadow-sm shadow-amber-900/5 ring-1 ring-amber-400/20'>
            <svg
              className='size-12 sm:size-14 text-amber-900'
              viewBox='0 0 64 64'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              aria-hidden='true'>
              {/* Stylized Tree of Life / Ancestral Roots SVG */}
              <path
                d='M32 54V34M32 34C28 30 22 28 16 30M32 34C36 30 42 28 48 30M32 26V14M32 26C27 22 22 20 18 22M32 26C37 22 42 20 46 22M32 14C28 10 24 8 20 10M32 14C36 10 40 8 44 10'
                stroke='currentColor'
                strokeWidth='3'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <circle cx='32' cy='10' r='3.5' fill='currentColor' />
              <circle cx='20' cy='10' r='2.5' fill='currentColor' />
              <circle cx='44' cy='10' r='2.5' fill='currentColor' />
              <circle cx='18' cy='22' r='2.5' fill='currentColor' />
              <circle cx='46' cy='22' r='2.5' fill='currentColor' />
              <circle cx='16' cy='30' r='2.5' fill='currentColor' />
              <circle cx='48' cy='30' r='2.5' fill='currentColor' />
              <path
                d='M12 56C24 53 40 53 52 56'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
              />
            </svg>
            <div className='absolute -bottom-2 rounded-full bg-amber-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-xs'>
              Tộc Chu
            </div>
          </div>
        </div>

        {/* Narrative Intro */}
        <p className='mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-600'>
          Cổng thông tin và phả ký điện tử chính thức của Dòng họ Chu. Nơi con cháu tìm về cội nguồn tiên tổ, tra cứu thứ bậc phả hệ, gìn giữ gia phong và gắn kết tình đồng tộc muôn đời.
        </p>
      </m.div>

      {/* Dynamic Call To Actions based on Auth State */}
      <m.div
        className='relative flex w-full flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row sm:gap-4'
        variants={fadeIn}>
        {isLoggedIn ? (
          <>
            <Link
              href='/tree'
              className='group relative inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-amber-600 bg-amber-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 sm:w-auto'>
              <span>Vào Xem Cây Phả Hệ</span>
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
            </Link>
            <Link
              href='/dashboard'
              className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white/90 px-6 py-3.5 text-sm font-medium text-stone-800 shadow-2xs backdrop-blur-xs transition hover:bg-stone-100 sm:w-auto'>
              <Users className='size-4 text-stone-600' />
              <span>Bàn Quản Trị Dòng Họ</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href='/login'
              className='group relative inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-stone-900 bg-stone-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 sm:w-auto'>
              <span>Đăng Nhập Cổng Phả Hệ</span>
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
            </Link>
            <Link
              href='/about'
              className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white/90 px-6 py-3.5 text-sm font-medium text-stone-800 shadow-2xs backdrop-blur-xs transition hover:bg-stone-100 sm:w-auto'>
              <Compass className='size-4 text-amber-700' />
              <span>Lịch Sử & Cội Nguồn Tộc Chu</span>
            </Link>
          </>
        )}
      </m.div>

      {/* Three Clan Core Values (Replaced Tech SaaS Cards) */}
      <m.div
        className='relative mt-12 sm:mt-16 grid grid-cols-1 gap-5 border-t border-stone-200/80 pt-10 text-left sm:gap-6 md:grid-cols-3'
        variants={staggerContainer}>
        {clanValues.map((item) => (
          <m.div
            key={item.title}
            variants={fadeIn}
            whileHover={{ y: -3 }}
            className='group relative flex flex-col items-start rounded-2xl border border-stone-200/90 bg-white/80 p-6 shadow-2xs backdrop-blur-xs transition hover:border-amber-300/80 hover:bg-white hover:shadow-xs'>
            <div className='mb-4 flex size-11 items-center justify-center rounded-xl bg-amber-100/70 text-amber-900 shadow-2xs transition group-hover:scale-105 group-hover:bg-amber-100'>
              {item.icon}
            </div>
            <h2 className='mb-2 font-serif text-lg font-bold text-stone-900 transition group-hover:text-amber-950'>
              {item.title}
            </h2>
            <p className='text-xs leading-relaxed text-stone-600'>
              {item.desc}
            </p>
          </m.div>
        ))}
      </m.div>
    </m.div>
  )
}

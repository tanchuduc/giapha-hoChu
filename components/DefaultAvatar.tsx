'use client'

import { memo } from 'react'
import { getAvatarBg } from '@/utils/styleHelpers'

export const AVATAR_VERSION = 'v3'

interface DefaultAvatarProps {
  gender?: string
  size?: number
  name?: string
  isAncestor?: boolean
  className?: string
}

function DefaultAvatarComponent({
  gender,
  size = 64,
  name,
  isAncestor = false,
  className = ''
}: DefaultAvatarProps) {
  const bgClass = isAncestor ? 'bg-[#4A2818] text-[#C29B38]' : getAvatarBg(gender ?? 'other')

  // Lấy chữ cái đầu làm fallback trang nhã nếu có tên
  const initial = name?.trim() ? name.trim().split(' ').slice(-1)[0][0]?.toUpperCase() : null

  if (isAncestor) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-xl font-serif font-bold text-amber-200 ${bgClass} ${className}`}
        style={{ fontSize: size ? Math.max(12, Math.floor(size * 0.42)) : 16 }}>
        {initial ?? (
          <svg className='h-3/5 w-3/5 text-amber-300' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2z' />
          </svg>
        )}
      </div>
    )
  }

  if (gender === 'female') {
    return (
      <div className={`flex h-full w-full items-center justify-center overflow-hidden ${bgClass} ${className}`}>
        <svg
          viewBox='0 0 36 36'
          fill='currentColor'
          className='h-3/4 w-3/4 text-amber-100 opacity-90'
          aria-hidden='true'>
          {/* Tóc vấn trâm cài & dáng áo dài nữ truyền thống tối giản */}
          <circle cx='18' cy='8' r='4' />
          <path d='M13 14c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.5-.7 2.9-1.8 3.8C23.5 19.2 26 22.8 26 27v3H10v-3c0-4.2 2.5-7.8 4.8-9.2-1.1-.9-1.8-2.3-1.8-3.8z' />
          <path d='M12 7c1.5-1.5 4.5-2 6-1 1.5 1 1 2.5 0 3-1.5.5-4.5.5-6-2z' fill='#C29B38' opacity='0.8' />
        </svg>
      </div>
    )
  }

  // Male / Default
  return (
    <div className={`flex h-full w-full items-center justify-center overflow-hidden ${bgClass} ${className}`}>
      <svg
        viewBox='0 0 36 36'
        fill='currentColor'
        className='h-3/4 w-3/4 text-emerald-100 opacity-90'
        aria-hidden='true'>
        {/* Nam giới khăn xếp áo dài cách điệu tối giản */}
        <circle cx='18' cy='9' r='4.5' />
        {/* Khăn đóng cổ truyền */}
        <path d='M13 8c1-1.5 4-2 5-2s4 .5 5 2c-1 1-3.5 1.5-5 1.5s-4-.5-5-1.5z' fill='#C29B38' />
        {/* Dáng vai đứng đắn */}
        <path d='M8 26c0-4.4 3.6-8 8-8h4c4.4 0 8 3.6 8 8v4H8v-4z' />
      </svg>
    </div>
  )
}

export default memo(DefaultAvatarComponent)

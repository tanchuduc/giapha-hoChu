'use client'

import { Type } from 'lucide-react'

import { useTextSize } from '@/context/TextSizeContext'

export default function TextSizeToggle() {
  const { textScale, cycleTextScale } = useTextSize()

  const labels = {
    normal: 'Chữ chuẩn',
    large: 'Chữ lớn (+20%)',
    'extra-large': 'Chữ rất lớn (+40%)'
  }

  const badgeText = {
    normal: 'A',
    large: 'A+',
    'extra-large': 'A++'
  }

  return (
    <button
      type='button'
      onClick={cycleTextScale}
      className='flex items-center gap-1 rounded-full border border-stone-200/80 bg-stone-50/80 px-2.5 py-1 text-xs font-semibold text-stone-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20'
      title={`Cỡ chữ: ${labels[textScale]} (Bấm để chuyển đổi)`}
      aria-label={`Đổi cỡ chữ, hiện tại là ${labels[textScale]}`}>
      <Type className='size-3.5 text-stone-500' />
      <span className='font-mono font-bold text-amber-800'>{badgeText[textScale]}</span>
    </button>
  )
}

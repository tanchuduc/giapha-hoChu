'use client'

import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import { useState } from 'react'

interface BurialLocationProps {
  burialPlace: string | null | undefined
  personName: string
  className?: string
}

export default function BurialLocationMap({
  burialPlace,
  personName,
  className = ''
}: BurialLocationProps) {
  const [copied, setCopied] = useState(false)

  if (!burialPlace || !burialPlace.trim()) {
    return null
  }

  const cleanPlace = burialPlace.trim()
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    cleanPlace
  )}`

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanPlace)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 transition-all ${className}`}>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 shadow-xs'>
            <MapPin className='size-5' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h4 className='text-xs font-semibold uppercase tracking-wider text-stone-500'>
                Mộ phần & Nơi an táng
              </h4>
              <span className='rounded-full bg-amber-100/60 px-2 py-0.5 text-[10px] font-medium text-amber-800'>
                Tâm linh
              </span>
            </div>
            <p className='mt-1 text-sm font-medium text-stone-800'>{cleanPlace}</p>
            <p className='mt-0.5 text-xs text-stone-500'>
              Nơi an nghỉ của cụ {personName} — Phục vụ con cháu về bái tế, tảo mộ ngày giỗ chạp, Thanh minh.
            </p>
          </div>
        </div>
      </div>

      <div className='mt-3.5 flex flex-wrap items-center gap-2 border-t border-stone-200/50 pt-3'>
        <a
          href={mapSearchUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-amber-600'>
          <Navigation className='size-3.5' />
          <span>Chỉ đường viếng mộ (Google Maps)</span>
          <ExternalLink className='size-3 opacity-75' />
        </a>

        <button
          type='button'
          onClick={handleCopy}
          className='inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50'>
          {copied ? 'Đã sao chép vị trí' : 'Sao chép địa chỉ'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useI18n } from '@/lib/i18n/useI18n'

export interface FooterProps {
  className?: string
  showDisclaimer?: boolean
}

export default function Footer({
  className = '',
  showDisclaimer = false
}: FooterProps) {
  const { t } = useI18n()

  return (
    <footer
      className={`py-8 text-center text-sm text-stone-500 ${className} backdrop-blur-sm print:hidden`}>
      <div className='mx-auto max-w-7xl px-4'>
        {showDisclaimer && (
          <p className='mb-4 inline-block rounded-full border border-amber-200/50 bg-amber-50 px-3 py-1 text-sm text-amber-800/80'>
            {t('footerDisclaimer')}
          </p>
        )}
        <p className='flex items-center justify-center gap-2 opacity-80'>
          <span className='font-serif font-medium text-stone-700'>
            Gia Phả Họ Chu
          </span>
          <span className='text-stone-400'>•</span>
          <span>Bảo tồn & phát huy truyền thống Dòng họ Chu</span>
        </p>
      </div>
    </footer>
  )
}

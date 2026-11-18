'use client'

import { AnimatePresence, m } from 'framer-motion'
import { Info, KeyRound, Phone, ShieldCheck, UserPlus } from 'lucide-react'
import { ReactNode } from 'react'

import { useI18n } from '@/lib/i18n/useI18n'

const inputClasses =
  'block w-full rounded-xl border border-[#ebded2] bg-white/70 py-3.5 pr-4 pl-11 text-stone-900 placeholder-stone-400 transition duration-200 outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600'

export function AuthField({
  id,
  label,
  icon,
  type,
  autoComplete,
  required,
  placeholder,
  value,
  onChange
}: {
  id: string
  label: string
  icon?: ReactNode
  type: string
  autoComplete?: string
  required?: boolean
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className='relative'>
      <label
        htmlFor={id}
        className='mb-1.5 ml-1 block text-sm font-medium text-stone-700'>
        {label}
      </label>
      <div className='group relative flex items-center'>
        {icon && (
          <span className='absolute left-3.5 size-5 text-stone-400 transition-colors group-focus-within:text-amber-700'>
            {icon}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export function AuthAlerts({
  error,
  successMessage
}: {
  error: string | null
  successMessage: string | null
}) {
  return (
    <AnimatePresence>
      {error && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          role='alert'
          className='rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-center text-sm font-medium text-red-800 shadow-xs'>
          {error}
        </m.div>
      )}

      {successMessage && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          role='status'
          aria-live='polite'
          className='rounded-xl border border-teal-200 bg-teal-50/90 p-3.5 text-center text-sm font-medium text-teal-800 shadow-xs'>
          {successMessage}
        </m.div>
      )}
    </AnimatePresence>
  )
}

export function SsoNotice({ show, text }: { show: boolean; text: string }) {
  const { t } = useI18n()
  if (!show) return null
  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className='rounded-xl border border-amber-200/80 bg-amber-50/90 p-3.5 text-center text-sm font-medium text-amber-900'>
      <p>{text}</p>
      <a
        href={t('ssoGuideUrl')}
        target='_blank'
        rel='noopener noreferrer'
        className='mt-2 inline-block font-medium text-amber-900 underline decoration-amber-500 underline-offset-2 hover:text-amber-700'>
        {t('ssoGuide')}
      </a>
    </m.div>
  )
}

export function DemoNotice({ show }: { show: boolean }) {
  const { t } = useI18n()
  if (!show) return null
  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className='mt-4 rounded-xl border border-amber-200/70 bg-amber-50/80 p-3'>
      <p className='text-xs font-medium text-amber-800'>{t('demoNotice')}</p>
    </m.div>
  )
}

export function ClanGuidanceBox({ isSignUp }: { isSignUp: boolean }) {
  const { t } = useI18n()
  return (
    <div className='rounded-xl border border-[#ebded2] bg-[#faf7f2]/90 p-3.5 text-left text-xs text-stone-600'>
      <div className='flex items-start gap-2.5'>
        <Info className='mt-0.5 size-4 shrink-0 text-amber-700' />
        <div className='space-y-1.5'>
          <p className='font-medium text-stone-800'>
            {isSignUp
              ? t('clanJoinNotice')
              : 'Gia phả bảo mật: Chỉ con cháu trong dòng họ đã được kích hoạt mới có thể truy cập thông tin gia tộc.'}
          </p>
          <div className='flex items-center gap-1.5 text-amber-800 font-medium'>
            <Phone className='size-3.5' />
            <span>{t('clanCouncilContact')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthSubmitButton({
  loading,
  mode = 'login'
}: {
  loading: boolean
  mode?: 'login' | 'signup' | 'forgot'
}) {
  const { t } = useI18n()

  const buttonLabel = () => {
    if (loading) return t('loading')
    if (mode === 'forgot') return t('sendResetLink')
    if (mode === 'signup') return t('createAccount')
    return t('login')
  }

  return (
    <button
      type='submit'
      disabled={loading}
      className='group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a2818] px-4 py-3.5 text-sm font-medium text-white shadow-xs transition duration-200 hover:bg-[#381e12] focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:outline-none disabled:cursor-wait disabled:opacity-70'>
      {loading ? (
        <span className='flex items-center gap-2.5'>
          <svg
            className='-ml-1 h-4 w-4 animate-spin text-white'
            fill='none'
            viewBox='0 0 24 24'>
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
          </svg>
          {buttonLabel()}
        </span>
      ) : (
        <>
          {buttonLabel()}
          {mode === 'signup' && <UserPlus className='ml-1 size-4' />}
          {mode === 'forgot' && <KeyRound className='ml-1 size-4' />}
          {mode === 'login' && <ShieldCheck className='ml-1 size-4' />}
        </>
      )}
    </button>
  )
}

export function AuthModeToggle({
  isLogin,
  isDemo,
  onToggle
}: {
  isLogin: boolean
  isDemo: boolean
  onToggle: (notice: string | null) => void
}) {
  const { t } = useI18n()
  return (
    <button
      type='button'
      onClick={() => {
        if (isLogin && isDemo) {
          onToggle(t('demoLoginNotice'))
          return
        }
        onToggle(null)
      }}
      className='w-full rounded-xl border border-[#ebded2] bg-white/80 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:bg-[#faf7f2] hover:text-[#4a2818] focus:outline-none'>
      {isLogin ? t('noAccount') : t('hasAccount')}
    </button>
  )
}

export function AuthBackgroundDecor() {
  return (
    <>
      {/* Decorative background grid and blurs */}
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[24px_24px]'></div>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,#fef3c7,transparent)]'></div>

      <div className='pointer-events-none absolute inset-x-0 top-0 flex h-screen justify-center overflow-hidden'>
        <div className='absolute top-[-10%] right-[-5%] h-[50vw] max-h-[600px] w-[50vw] max-w-[600px] rounded-full bg-amber-300/20 mix-blend-multiply blur-[100px]' />
        <div className='absolute bottom-[0%] left-[-10%] h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full bg-rose-200/20 mix-blend-multiply blur-[120px]' />
      </div>
    </>
  )
}

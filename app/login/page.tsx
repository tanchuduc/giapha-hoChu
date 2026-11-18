'use client'

import { AnimatePresence, m } from 'framer-motion'
import { ArrowLeft, Info, KeyRound, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

import { notifyAdminIfAccountPending } from '@/app/actions/user'
import config from '@/app/config'
import {
  AuthAlerts,
  AuthBackgroundDecor,
  AuthField,
  AuthModeToggle,
  AuthSubmitButton,
  ClanGuidanceBox,
  DemoNotice,
  SsoNotice
} from '@/components/auth/AuthFormParts'
import SsoButtons from '@/components/auth/SsoButtons'
import Footer from '@/components/Footer'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useI18n } from '@/lib/i18n/useI18n'
import { authErrorKey } from '@/utils/authErrors'
import { oauthRedirectTo, safeNextPath } from '@/utils/safeNextPath'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const { t } = useI18n()
  // Client-only value via useSyncExternalStore so SSR and client render
  // identically without an extra effect-driven render.
  const isDemo = useSyncExternalStore(
    () => () => {},
    () => window.location.hostname === config.demoDomain,
    () => false
  )
  // Until the user types, the demo site shows the demo account.
  const [emailInput, setEmail] = useState<string | null>(null)
  const [passwordInput, setPassword] = useState<string | null>(null)
  const email = emailInput ?? (isDemo ? 'giaphaos@homielab.com' : '')
  const password = passwordInput ?? (isDemo ? 'giaphaos' : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ssoError, setSsoError] = useState(false)
  // Fail closed: SSO is hidden until the deployment explicitly enables it.
  const ssoDisabled = process.env.NEXT_PUBLIC_DISABLE_SSO !== 'false'

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    if (isDemo) {
      setError(t('demoOAuthNotice'))
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setSsoError(false)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: oauthRedirectTo(window.location.origin, nextPath())
        }
      })

      if (error) {
        setSsoError(true)
        setError(
          t('oauthNotConfigured', {
            provider: provider === 'google' ? 'Google' : 'Facebook'
          })
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // The page a shared link pointed to before the middleware sent the visitor
  // here (?next=), or /dashboard. Read on submit, so no Suspense boundary is
  // needed for useSearchParams.
  const nextPath = () =>
    safeNextPath(new URLSearchParams(window.location.search).get('next'))

  // Mails the administrators when this account still waits for approval (the
  // password sign-in and a sign-up without email confirmation skip
  // /auth/callback). A failure never blocks the sign-in.
  const notifyIfPending = () =>
    notifyAdminIfAccountPending().catch((err: unknown) => console.error(err))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setSsoError(false)

    try {
      if (authMode === 'forgot') {
        if (!email) {
          setError(t('authEmailInvalid'))
          return
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/account`
          }
        )
        if (resetError) {
          setError(t(authErrorKey(resetError)))
        } else {
          setSuccessMessage(t('resetLinkSent'))
        }
      } else if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          setError(t(authErrorKey(error)))
        } else {
          await notifyIfPending()
          router.push(nextPath())
          router.refresh()
        }
      } else {
        if (password !== confirmPassword) {
          setError(t('passwordMismatch'))
          setLoading(false)
          return
        }

        // 1. Try to sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })

        if (error) {
          // Check if error is related to missing database schema/tables
          if (
            error.message.includes('relation') &&
            error.message.includes('does not exist')
          ) {
            router.push('/setup')
            return
          }

          setError(t(authErrorKey(error)))
        } else {
          if (data.session) {
            await notifyIfPending()
            router.push(nextPath())
            router.refresh()
          } else {
            // Attempt to sign in immediately (catches auto-confirmed first admin)
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithPassword({
                email,
                password
              })

            if (!signInError && signInData.session) {
              await notifyIfPending()
              router.push(nextPath())
              router.refresh()
            } else {
              setSuccessMessage(t('signupSuccess'))
              setAuthMode('login') // Switch back to login view
              setConfirmPassword('') // clear confirm password
              setPassword('') // clear password
            }
          }
        }
      }
    } catch (err) {
      setError(t('unexpectedError'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getHeaderTitle = () => {
    if (authMode === 'forgot') return t('forgotPasswordTitle')
    if (authMode === 'signup') return t('signUp')
    return t('login')
  }

  const getHeaderDesc = () => {
    if (authMode === 'forgot') return t('forgotPasswordDescription')
    if (authMode === 'signup') return t('signUpDescription')
    return t('loginDescription')
  }

  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-neutral select-none selection:bg-amber-200 selection:text-amber-900'>
      <AuthBackgroundDecor />

      <header className='relative z-20 flex w-full items-center justify-between gap-3 px-4 pt-6 sm:px-6'>
        <Link
          href='/'
          className='group flex shrink-0 items-center gap-2 rounded-full border border-[#ebded2] bg-white/70 px-4 py-2.5 text-sm font-medium text-stone-700 transition duration-200 hover:border-amber-700 hover:text-amber-900 sm:px-5'>
          <ArrowLeft className='size-4 transition-transform group-hover:-translate-x-1' />
          {t('home')}
        </Link>

        <div className='flex shrink-0 items-center gap-2 sm:gap-3'>
          <LanguageSwitcher />
          <Link
            href='/about'
            className='group flex items-center gap-2 rounded-full border border-[#ebded2] bg-white/70 px-4 py-2.5 text-sm font-medium text-stone-700 transition duration-200 hover:border-amber-700 hover:text-amber-900 sm:px-5'>
            <Info className='size-4 transition-transform group-hover:scale-110' />
            {t('about')}
          </Link>
        </div>
      </header>

      <div className='relative z-10 flex w-full flex-1 items-center justify-center px-4 py-10 sm:py-14'>
        <m.div
          className='relative w-full max-w-md overflow-hidden rounded-3xl border border-[#ebded2] bg-white/80 p-8 backdrop-blur-xl sm:p-10 shadow-sm'
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <div className='pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-bl-[100px] bg-linear-to-br from-amber-100/50 to-transparent'></div>

          <div className='relative z-10 mb-7 text-center'>
            <Link
              href='/'
              className='mb-4 inline-flex items-center justify-center rounded-2xl bg-amber-50/80 p-3.5 ring-1 ring-amber-200/80 transition duration-300 hover:scale-105'>
              <Shield className='size-8 text-[#4a2818]' />
            </Link>
            <h1 className='font-serif text-3xl font-semibold text-[#4a2818] sm:text-4xl'>
              {getHeaderTitle()}
            </h1>
            <p className='mt-2.5 text-sm font-medium text-stone-600'>
              {getHeaderDesc()}
            </p>
            <DemoNotice show={isDemo} />
          </div>

          <form className='relative z-10 space-y-4' onSubmit={handleSubmit}>
            <div className='space-y-3.5'>
              <AuthField
                id='email-address'
                label='Email'
                icon={<Mail className='size-5' />}
                type='email'
                autoComplete='email'
                required
                placeholder='name@example.com'
                value={email}
                onChange={setEmail}
              />

              {authMode !== 'forgot' && (
                <div className='space-y-1.5'>
                  <AuthField
                    id='password'
                    label={t('password')}
                    icon={<KeyRound className='size-5' />}
                    type='password'
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    required
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={setPassword}
                  />

                  {authMode === 'login' && (
                    <div className='flex justify-end pr-1'>
                      <button
                        type='button'
                        onClick={() => {
                          setAuthMode('forgot')
                          setError(null)
                          setSuccessMessage(null)
                        }}
                        className='text-xs font-medium text-amber-800 transition duration-200 hover:text-amber-950 hover:underline'>
                        {t('forgotPassword')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {authMode === 'signup' && (
                  <m.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className='relative mt-3'>
                    <AuthField
                      id='confirmPassword'
                      label={t('confirmPassword')}
                      icon={<KeyRound className='size-5' />}
                      type='password'
                      autoComplete='new-password'
                      required={authMode === 'signup'}
                      placeholder={t('confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                    />
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <AuthAlerts error={error} successMessage={successMessage} />

            <ClanGuidanceBox isSignUp={authMode === 'signup'} />

            {authMode !== 'forgot' && (
              <SsoNotice
                show={ssoDisabled || ssoError}
                text={ssoError ? t('ssoError') : t('ssoDisabled')}
              />
            )}

            <div className='flex flex-col gap-3.5 pt-3'>
              <AuthSubmitButton loading={loading} mode={authMode} />

              {!ssoDisabled && authMode === 'login' && (
                <SsoButtons loading={loading} onOAuth={handleOAuthLogin} />
              )}

              {authMode === 'forgot' ? (
                <button
                  type='button'
                  onClick={() => {
                    setAuthMode('login')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className='w-full rounded-xl border border-[#ebded2] bg-white/80 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:bg-[#faf7f2] hover:text-[#4a2818]'>
                  {t('backToLogin')}
                </button>
              ) : (
                <AuthModeToggle
                  isLogin={authMode === 'login'}
                  isDemo={isDemo}
                  onToggle={(notice) => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login')
                    setError(notice)
                    setSuccessMessage(null)
                    setSsoError(false)
                  }}
                />
              )}
            </div>
          </form>
        </m.div>
      </div>

      <Footer className='relative z-10 mt-auto border-none bg-transparent' />
    </div>
  )
}

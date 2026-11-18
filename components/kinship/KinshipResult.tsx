'use client'

import { AnimatePresence, m } from 'framer-motion'
import { GitMerge, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { PersonNode } from '@/components/kinship/kinshipTypes'
import { useI18n } from '@/lib/i18n/useI18n'
import type {
  KinshipDescription,
  KinshipPathStep
} from '@/utils/kinshipHelpers'
import { describeKinship, describePathStep } from '@/utils/kinshipText'

interface KinshipResultProps {
  personA: PersonNode
  personB: PersonNode
  result: {
    description: KinshipDescription
    aCallsB: string
    bCallsA: string
    pathLabels: KinshipPathStep[]
    hasAmbiguousTerm: boolean
    hasNeutralGender?: boolean
  } | null
}

export default function KinshipResult({
  personA,
  personB,
  result
}: KinshipResultProps) {
  const { t } = useI18n()
  const unknown = result?.description.kind === 'none'
  return (
    <AnimatePresence mode='wait'>
      {result === null ? (
        <m.div key='same' className='py-8 text-center text-stone-400'>
          {t('chooseDifferentMembers')}
        </m.div>
      ) : (
        <m.div
          key={`${personA.id}-${personB.id}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className='space-y-4'>
          {/* Description badge */}
          <div className='flex items-center gap-3 rounded-2xl border border-[#EBDED2] bg-[#FAF7F2] px-5 py-4 shadow-xs'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#C2671A]'>
              <Sparkles className='size-5' />
            </div>
            <div>
              <p className='text-xs font-medium text-[#786C65] uppercase tracking-wider'>Mối quan hệ thân tộc</p>
              <p className='text-sm font-semibold text-[#4A2818]'>
                {describeKinship(result.description, t)}
              </p>
            </div>
          </div>

          {/* Main kinship cards */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <m.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='rounded-2xl border border-[#EBDED2] bg-white p-5 shadow-xs'>
              <div className='flex items-center justify-between gap-2 border-b border-[#F5EFEB] pb-3 mb-3'>
                <p className='text-xs font-semibold uppercase tracking-wider text-stone-500'>
                  {personA.full_name} gọi {personB.full_name} là:
                </p>
                <span className='inline-flex items-center rounded-full bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-medium text-[#786C65] border border-[#EBDED2]'>
                  Đời thứ {personB.generation ?? '?'}
                </span>
              </div>
              <div className='py-2'>
                <p className='font-serif text-2xl sm:text-3xl font-bold text-[#4A2818] tracking-tight'>
                  {unknown
                    ? t('kinshipUnknownTerm')
                    : result.aCallsB || t('kinshipNoTerm')}
                </p>
              </div>
              <p className='text-xs text-stone-400 mt-1'>
                Cách xưng hô chuẩn mực theo quan hệ gia tộc
              </p>
            </m.div>

            <m.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className='rounded-2xl border border-[#EBDED2] bg-white p-5 shadow-xs'>
              <div className='flex items-center justify-between gap-2 border-b border-[#F5EFEB] pb-3 mb-3'>
                <p className='text-xs font-semibold uppercase tracking-wider text-stone-500'>
                  {personB.full_name} gọi {personA.full_name} là:
                </p>
                <span className='inline-flex items-center rounded-full bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-medium text-[#786C65] border border-[#EBDED2]'>
                  Đời thứ {personA.generation ?? '?'}
                </span>
              </div>
              <div className='py-2'>
                <p className='font-serif text-2xl sm:text-3xl font-bold text-[#C2671A] tracking-tight'>
                  {unknown
                    ? t('kinshipUnknownTerm')
                    : result.bCallsA || t('kinshipNoTerm')}
                </p>
              </div>
              <p className='text-xs text-stone-400 mt-1'>
                Cách xưng hô đáp lễ chuẩn mực
              </p>
            </m.div>
          </div>

          {/* Path info */}
          {result.pathLabels.length > 0 && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className='rounded-2xl border border-[#EBDED2] bg-[#FAF7F2]/60 px-6 py-5'>
              <div className='mb-4 flex items-center gap-2'>
                <GitMerge className='size-4 text-[#786C65]' />
                <p className='text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
                  {t('relationPathAnalysis')}
                </p>
              </div>
              <div className='space-y-4'>
                {result.pathLabels.map((step, i) => (
                  <div
                    key={describePathStep(step, t)}
                    className='flex items-start gap-4'>
                    <div className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[#EBDED2] bg-white text-[#4A2818] shadow-xs'>
                      <span className='text-xs font-semibold'>
                        {i + 1}
                      </span>
                    </div>
                    <p className='pt-0.5 text-sm leading-relaxed text-[#4A2818]'>
                      {describePathStep(step, t)}
                    </p>
                  </div>
                ))}
              </div>
            </m.div>
          )}

          {/* Who is older is unknown: say whose data would settle it */}
          {result.description.uncertain &&
            result.description.uncertainPeople && (
              <p className='px-1 text-sm text-amber-700'>
                {t('kinshipUncertainHint')}{' '}
                {result.description.uncertainPeople.map((person, i) => (
                  <span key={person.id}>
                    {i > 0 && ` ${t('kinshipUncertainOr')} `}
                    <Link
                      href={`/dashboard/members/${person.id}/edit`}
                      className='font-medium underline'>
                      {person.name}
                    </Link>
                  </span>
                ))}
                .
              </p>
            )}

          {/* Spouse of an ancestor, not linked as parent: where to fix it */}
          {result.description.kind === 'spouseOfAncestor' && (
            <p className='px-1 text-sm text-amber-700'>
              {t('kinshipSpouseOfAncestorHint')}{' '}
              <Link
                href={`/dashboard/members/${result.description.child.id}`}
                className='font-medium underline'>
                {result.description.child.name}
              </Link>
              .
            </p>
          )}

          {/* Gender 'other': why the term lists both forms */}
          {result.hasNeutralGender && (
            <p className='px-1 text-sm text-stone-600'>
              {t('kinshipNeutralGenderHint')}
            </p>
          )}

          {/* Disclaimer for ambiguous terms */}
          {result.hasAmbiguousTerm && (
            <p className='px-1 text-sm text-stone-400 italic'>
              {t('kinshipDisclaimer')}
            </p>
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
}

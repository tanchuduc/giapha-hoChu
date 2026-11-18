'use client'

import { AnimatePresence, m } from 'framer-motion'
import { AlertCircle, CheckCircle, FileText, Send, X } from 'lucide-react'
import { useState, useTransition } from 'react'

import { submitProposal } from '@/app/actions/proposals'
import type { Person } from '@/types'

interface ProposeEditModalProps {
  person: Person
  isOpen: boolean
  onClose: () => void
}

export default function ProposeEditModal({
  person,
  isOpen,
  onClose
}: ProposeEditModalProps) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [fullName, setFullName] = useState(person.full_name)
  const [otherNames, setOtherNames] = useState(person.other_names || '')
  const [birthYear, setBirthYear] = useState<string>(
    person.birth_year ? String(person.birth_year) : ''
  )
  const [birthMonth, setBirthMonth] = useState<string>(
    person.birth_month ? String(person.birth_month) : ''
  )
  const [birthDay, setBirthDay] = useState<string>(
    person.birth_day ? String(person.birth_day) : ''
  )
  const [isDeceased, setIsDeceased] = useState(person.is_deceased)
  const [deathYear, setDeathYear] = useState<string>(
    person.death_year ? String(person.death_year) : ''
  )
  const [burialPlace, setBurialPlace] = useState(person.burial_place || '')
  const [note, setNote] = useState(person.note || '')
  const [reason, setReason] = useState('')
  const [proofUrl, setProofUrl] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!reason.trim()) {
      setError('Vui lòng nêu rõ lý do hoặc căn cứ đề xuất chỉnh sửa.')
      return
    }

    const proposedData = {
      full_name: fullName.trim(),
      other_names: otherNames.trim() || null,
      birth_year: birthYear ? parseInt(birthYear, 10) : null,
      birth_month: birthMonth ? parseInt(birthMonth, 10) : null,
      birth_day: birthDay ? parseInt(birthDay, 10) : null,
      is_deceased: isDeceased,
      death_year: deathYear ? parseInt(deathYear, 10) : null,
      burial_place: burialPlace.trim() || null,
      note: note.trim() || null
    }

    startTransition(async () => {
      const res = await submitProposal(
        person.id,
        proposedData,
        reason.trim(),
        proofUrl.trim() || undefined
      )

      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 1800)
      }
    })
  }

  return (
    <AnimatePresence>
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs'>
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className='relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-stone-100 bg-stone-50/70 px-6 py-4'>
            <div className='flex items-center gap-2.5'>
              <div className='flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-300/40'>
                <FileText className='size-5' />
              </div>
              <div>
                <h2 className='font-serif text-lg font-bold text-stone-900'>
                  Đề xuất cập nhật thông tin
                </h2>
                <p className='text-xs text-stone-500'>
                  Hồ sơ cụ: <strong className='text-stone-700'>{person.full_name}</strong>
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={onClose}
              disabled={isPending}
              className='rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors'>
              <X className='size-5' />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-6 space-y-4 text-sm'>
            {error && (
              <div className='flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800'>
                <AlertCircle className='size-4 shrink-0 text-rose-600' />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className='flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800'>
                <CheckCircle className='size-4 shrink-0 text-emerald-600' />
                <span>Đề xuất của bạn đã được gửi tới Ban trị sự dòng họ để phê duyệt!</span>
              </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-semibold text-stone-700 mb-1'>
                  Họ và tên
                </label>
                <input
                  type='text'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-stone-700 mb-1'>
                  Tên chữ / Tên húy / Tên khác
                </label>
                <input
                  type='text'
                  value={otherNames}
                  onChange={(e) => setOtherNames(e.target.value)}
                  placeholder='Ví dụ: Tự Phúc Hậu, húy Đức'
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              <div>
                <label className='block text-xs font-semibold text-stone-700 mb-1'>
                  Năm sinh
                </label>
                <input
                  type='number'
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder='YYYY'
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>
              <div>
                <label className='block text-xs font-semibold text-stone-700 mb-1'>
                  Tháng sinh
                </label>
                <input
                  type='number'
                  min='1'
                  max='12'
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  placeholder='MM'
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>
              <div>
                <label className='block text-xs font-semibold text-stone-700 mb-1'>
                  Ngày sinh
                </label>
                <input
                  type='number'
                  min='1'
                  max='31'
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  placeholder='DD'
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>
            </div>

            <div className='border-t border-stone-100 pt-3'>
              <label className='flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer mb-2'>
                <input
                  type='checkbox'
                  checked={isDeceased}
                  onChange={(e) => setIsDeceased(e.target.checked)}
                  className='rounded border-stone-300 text-amber-600 focus:ring-amber-500'
                />
                <span>Đã tạ thế (Đã mất)</span>
              </label>

              {isDeceased && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2'>
                  <div>
                    <label className='block text-xs font-semibold text-stone-700 mb-1'>
                      Năm mất
                    </label>
                    <input
                      type='number'
                      value={deathYear}
                      onChange={(e) => setDeathYear(e.target.value)}
                      placeholder='YYYY'
                      className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-stone-700 mb-1'>
                      Nơi an táng (Mộ phần)
                    </label>
                    <input
                      type='text'
                      value={burialPlace}
                      onChange={(e) => setBurialPlace(e.target.value)}
                      placeholder='Ví dụ: Nghĩa trang dòng họ, đồi Cát...'
                      className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='border-t border-stone-100 pt-3 space-y-3'>
              <div>
                <label className='block text-xs font-semibold text-stone-800 mb-1'>
                  Tiểu sử & Ghi chú (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='Ghi chú về cuộc đời, sự nghiệp hoặc thông tin thêm...'
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-stone-800 mb-1'>
                  Lý do & Căn cứ đề xuất <span className='text-rose-500'>*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder='Nêu rõ căn cứ (Ví dụ: Chi họ mới kiểm tra lại bia mộ, hoặc căn cứ theo cuốn phả chữ Nôm năm 1935...)'
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-stone-800 mb-1'>
                  Đường dẫn tài liệu chứng minh (Tùy chọn)
                </label>
                <input
                  type='url'
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder='https://drive.google.com/... hoặc link ảnh'
                  className='w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden'
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className='flex items-center justify-end gap-3 border-t border-stone-100 pt-4'>
              <button
                type='button'
                onClick={onClose}
                disabled={isPending}
                className='rounded-xl px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100'>
                Hủy bỏ
              </button>
              <button
                type='submit'
                disabled={isPending || success}
                className='inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 disabled:opacity-50'>
                <Send className='size-3.5' />
                <span>{isPending ? 'Đang gửi...' : 'Gửi đề xuất'}</span>
              </button>
            </div>
          </form>
        </m.div>
      </div>
    </AnimatePresence>
  )
}

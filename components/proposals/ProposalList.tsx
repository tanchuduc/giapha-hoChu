'use client'

import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  FileCheck,
  X
} from 'lucide-react'
import { useState, useTransition } from 'react'

import { approveProposal, rejectProposal } from '@/app/actions/proposals'

export interface ProposalItem {
  id: string
  target_person_id: string
  proposed_by_user_id: string
  proposed_data: Record<string, unknown>
  original_data?: Record<string, unknown> | null
  reason?: string | null
  proof_url?: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_note?: string | null
  reviewed_at?: string | null
  created_at: string
  target_person_name?: string | null
  proposer_email?: string | null
}

interface ProposalListProps {
  initialProposals: ProposalItem[]
  canReview: boolean
}

export default function ProposalList({
  initialProposals,
  canReview
}: ProposalListProps) {
  const [proposals, setProposals] = useState(initialProposals)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = proposals.filter((p) => p.status === filterStatus)

  const handleApprove = (id: string) => {
    if (!confirm('Xác nhận phê duyệt đề xuất này và cập nhật trực tiếp vào gia phả chính thức?')) {
      return
    }
    setActionError(null)
    startTransition(async () => {
      const res = await approveProposal(id)
      if (res.error) {
        setActionError(res.error)
      } else {
        setProposals((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'approved' as const, reviewed_at: new Date().toISOString() } : item
          )
        )
      }
    })
  }

  const handleReject = (id: string) => {
    const note = prompt('Nhập lý do từ chối đề xuất (để phản hồi cho thành viên):')
    if (note === null) return
    if (!note.trim()) {
      alert('Vui lòng cung cấp lý do từ chối.')
      return
    }

    setActionError(null)
    startTransition(async () => {
      const res = await rejectProposal(id, note.trim())
      if (res.error) {
        setActionError(res.error)
      } else {
        setProposals((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'rejected' as const,
                  review_note: note.trim(),
                  reviewed_at: new Date().toISOString()
                }
              : item
          )
        )
      }
    })
  }

  return (
    <div className='space-y-6'>
      {actionError && (
        <div className='flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800'>
          <AlertCircle className='size-4 shrink-0 text-rose-600' />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className='flex items-center gap-2 border-b border-stone-200 pb-2'>
        <button
          type='button'
          onClick={() => setFilterStatus('pending')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            filterStatus === 'pending'
              ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
              : 'text-stone-600 hover:bg-stone-100'
          }`}>
          <Clock className='size-3.5' />
          <span>Chờ xem xét ({proposals.filter((p) => p.status === 'pending').length})</span>
        </button>

        <button
          type='button'
          onClick={() => setFilterStatus('approved')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            filterStatus === 'approved'
              ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300'
              : 'text-stone-600 hover:bg-stone-100'
          }`}>
          <Check className='size-3.5' />
          <span>Đã phê duyệt ({proposals.filter((p) => p.status === 'approved').length})</span>
        </button>

        <button
          type='button'
          onClick={() => setFilterStatus('rejected')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            filterStatus === 'rejected'
              ? 'bg-rose-100 text-rose-900 ring-1 ring-rose-300'
              : 'text-stone-600 hover:bg-stone-100'
          }`}>
          <X className='size-3.5' />
          <span>Đã từ chối ({proposals.filter((p) => p.status === 'rejected').length})</span>
        </button>
      </div>

      {/* Proposals List */}
      {filtered.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-stone-200 p-12 text-center text-stone-500'>
          <FileCheck className='mx-auto size-12 text-stone-300 mb-3' />
          <p className='font-medium'>Không có đề xuất nào trong danh mục này</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filtered.map((item) => {
            const proposed = item.proposed_data || {}
            const original = item.original_data || {}

            return (
              <div
                key={item.id}
                className='rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4'>
                {/* Meta Header */}
                <div className='flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3'>
                  <div>
                    <h3 className='font-serif text-base font-bold text-stone-900'>
                      Đề xuất cập nhật: {item.target_person_name || 'Hồ sơ cụ'}
                    </h3>
                    <p className='text-xs text-stone-500'>
                      Người đề xuất: {item.proposer_email || 'Thành viên'} • Gửi lúc:{' '}
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                    {item.status === 'pending'
                      ? 'Đang chờ duyệt'
                      : item.status === 'approved'
                      ? 'Đã áp dụng vào gia phả'
                      : 'Đã từ chối'}
                  </span>
                </div>

                {/* Reason & Proof */}
                {item.reason && (
                  <div className='rounded-xl bg-amber-50/60 p-3 text-xs text-stone-700'>
                    <strong className='font-semibold text-amber-900'>Căn cứ / Lý do: </strong>
                    {item.reason}
                  </div>
                )}

                {item.proof_url && (
                  <div>
                    <a
                      href={item.proof_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline'>
                      <span>Xem tài liệu / Ảnh chứng minh</span>
                      <ExternalLink className='size-3.5' />
                    </a>
                  </div>
                )}

                {/* Diff Viewer (Cũ vs Mới) */}
                <div className='rounded-xl border border-stone-200/80 bg-stone-50/50 p-3 overflow-x-auto text-xs'>
                  <p className='font-bold text-stone-800 mb-2'>So sánh nội dung đề xuất:</p>
                  <div className='space-y-1.5'>
                    {Object.keys(proposed).map((key) => {
                      const oldVal = original[key] ?? '(Trống)'
                      const newVal = proposed[key] ?? '(Xóa)'
                      if (String(oldVal) === String(newVal)) return null

                      return (
                        <div key={key} className='flex items-center gap-2 font-mono'>
                          <span className='font-semibold text-stone-600 min-w-[120px]'>
                            {key}:
                          </span>
                          <span className='text-rose-700 line-through bg-rose-50 px-1.5 py-0.5 rounded'>
                            {String(oldVal)}
                          </span>
                          <ArrowRight className='size-3 text-stone-400' />
                          <span className='text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded'>
                            {String(newVal)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Review Notes if any */}
                {item.review_note && (
                  <p className='text-xs text-stone-500 italic'>
                    Phản hồi của Ban trị sự: {item.review_note}
                  </p>
                )}

                {/* Actions */}
                {canReview && item.status === 'pending' && (
                  <div className='flex items-center justify-end gap-3 pt-2 border-t border-stone-100'>
                    <button
                      type='button'
                      onClick={() => handleReject(item.id)}
                      disabled={isPending}
                      className='inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50'>
                      <X className='size-3.5 text-rose-600' />
                      <span>Từ chối</span>
                    </button>

                    <button
                      type='button'
                      onClick={() => handleApprove(item.id)}
                      disabled={isPending}
                      className='inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 disabled:opacity-50'>
                      <Check className='size-3.5' />
                      <span>Phê duyệt & Áp dụng</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

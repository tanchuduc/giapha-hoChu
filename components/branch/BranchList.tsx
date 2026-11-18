'use client'

import {
  ExternalLink,
  GitBranch,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export interface BranchItem {
  id: string
  name: string
  parent_branch_id: string | null
  head_person_id: string | null
  description: string | null
  order_index: number
  head_person_name?: string | null
  member_count?: number
}

interface BranchListProps {
  branches: BranchItem[]
  canEdit: boolean
}

export default function BranchList({ branches, canEdit }: BranchListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className='space-y-6'>
      {/* Action Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='relative flex-1 max-w-md'>
          <input
            type='text'
            placeholder='Tìm kiếm chi phái họ Chu...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500'
          />
        </div>

        {canEdit && (
          <button
            type='button'
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-amber-800 focus:outline-hidden'>
            <Plus className='size-4' />
            <span>Thêm chi phái mới</span>
          </button>
        )}
      </div>

      {/* Branches Grid */}
      {filtered.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-stone-200 p-12 text-center text-stone-500'>
          <GitBranch className='mx-auto size-12 text-stone-300 mb-3' />
          <p className='font-medium'>Chưa có thông tin chi phái nào phù hợp</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          {filtered.map((branch) => (
            <div
              key={branch.id}
              className='flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all hover:border-amber-300 hover:shadow-md'>
              <div>
                <div className='flex items-start justify-between gap-2 mb-3'>
                  <div className='flex items-center gap-2'>
                    <div className='flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-300/40'>
                      <GitBranch className='size-5' />
                    </div>
                    <div>
                      <h3 className='font-serif text-lg font-semibold text-stone-900'>
                        {branch.name}
                      </h3>
                      <span className='text-xs text-stone-500'>
                        Thứ tự: Chi {branch.order_index}
                      </span>
                    </div>
                  </div>
                </div>

                {branch.head_person_name && (
                  <p className='text-xs text-stone-600 mb-2'>
                    <strong className='font-medium text-stone-800'>Khởi chi:</strong>{' '}
                    {branch.head_person_name}
                  </p>
                )}

                {branch.description && (
                  <p className='text-xs text-stone-600 line-clamp-3 mb-4'>
                    {branch.description}
                  </p>
                )}
              </div>

              <div className='mt-4 pt-3 border-t border-stone-100 flex items-center justify-between'>
                <Link
                  href={`/dashboard/members?branchId=${branch.id}`}
                  className='inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors'>
                  <span>Xem cây chi này</span>
                  <ExternalLink className='size-3.5' />
                </Link>

                {canEdit && (
                  <button
                    type='button'
                    className='text-xs font-medium text-stone-500 hover:text-stone-800'>
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

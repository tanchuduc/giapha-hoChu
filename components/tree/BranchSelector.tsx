'use client'

import { GitBranch } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export interface BranchOption {
  id: string
  name: string
  head_person_id?: string | null
  order_index?: number
}

interface BranchSelectorProps {
  branches: BranchOption[]
  selectedBranchId: string | null
  onSelectBranch?: (branchId: string | null) => void
}

export default function BranchSelector({
  branches,
  selectedBranchId,
  onSelectBranch
}: BranchSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSelect = (branchId: string | null) => {
    if (onSelectBranch) {
      onSelectBranch(branchId)
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      if (branchId) {
        params.set('branchId', branchId)
      } else {
        params.delete('branchId')
      }
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className='flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/90 px-3 py-1.5 shadow-xs backdrop-blur-md'>
      <GitBranch className='size-4 text-amber-700' />
      <span className='text-xs font-semibold text-stone-700 hidden sm:inline'>
        Chi phái:
      </span>
      <select
        value={selectedBranchId ?? ''}
        disabled={isPending}
        onChange={(e) => handleSelect(e.target.value ? e.target.value : null)}
        className='cursor-pointer bg-transparent text-xs sm:text-sm font-medium text-stone-900 focus:outline-hidden disabled:opacity-50'>
        <option value=''>Đại Tộc Họ Chu (Toàn họ)</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {isPending && (
        <span className='size-2 animate-ping rounded-full bg-amber-500' />
      )}
    </div>
  )
}

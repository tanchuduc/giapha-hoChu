'use client'

import Image from 'next/image'
import { memo } from 'react'

import { useAvatarUrl } from '@/context/AvatarUrlContext'
import { useMemberListView } from '@/context/useMemberListView'
import { Person } from '@/types'

import DefaultAvatar from './DefaultAvatar'

interface FamilyNodeCardProps {
  person: Person
  role?: string // e.g., "Chồng", "Vợ"
  note?: string | null
  onClickCard?: () => void
  onClickName?: (e: React.MouseEvent) => void
  isRingVisible?: boolean // spouse 1
  isPlusVisible?: boolean // spouse 2+
  level: number
  isHighlighted?: boolean
  treeMode?: 'compact' | 'detailed'
}

function PersonAvatar({
  person,
  isAncestor = false
}: {
  person: Person
  isAncestor?: boolean
}) {
  const avatarUrl = useAvatarUrl()
  const customAvatar = avatarUrl(person.avatar_url)

  return (
    <div className='relative shrink-0'>
      <div
        className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105 ${
          isAncestor
            ? 'border-2 border-[#C29B38] bg-[#4A2818] ring-2 ring-amber-200/50'
            : 'border border-[#EBDED2]'
        }`}>
        {customAvatar ? (
          <Image
            unoptimized
            src={customAvatar}
            alt=''
            className='h-full w-full object-cover'
            width={48}
            height={48}
          />
        ) : (
          <DefaultAvatar
            gender={person.gender}
            name={person.full_name}
            isAncestor={isAncestor}
            size={48}
          />
        )}
      </div>
    </div>
  )
}

function FamilyNodeCard({
  person,
  onClickCard,
  isRingVisible = false,
  isPlusVisible = false,
  level,
  isHighlighted = false,
  treeMode = 'detailed'
}: FamilyNodeCardProps) {
  const { setMemberModalId } = useMemberListView()

  const isDeceased = person.is_deceased || person.death_year != null
  const isAncestor = level === 0 && (person.generation === 1 || !person.is_in_law)
  const isSpouse = isRingVisible || isPlusVisible || person.is_in_law

  // Badge vai vế
  const getBadgeLabel = () => {
    if (isAncestor) return 'Thủy Tổ'
    if (isSpouse) return isPlusVisible ? 'Thứ thất' : 'Chính thất'
    if (person.birth_order === 1 && person.gender === 'male') {
      return level === 1 ? 'Trưởng Tộc' : 'Đích Tôn'
    }
    if (person.generation) return `Đời ${person.generation}`
    return null
  }

  const badge = getBadgeLabel()

  // Xử lý click
  const handleClick = () => {
    if (onClickCard) {
      onClickCard()
    } else {
      setMemberModalId(person.id)
    }
  }

  /* ── 1. CHẾ ĐỘ COMPACT (SIÊU GỌN CHO CÂY LỚN) ────────────────────────── */
  if (treeMode === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={`group relative flex w-36 sm:w-40 items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-pointer ${
          isHighlighted
            ? 'border-[#C2671A] bg-[#FFFDF9] ring-2 ring-[#C2671A]/30'
            : isAncestor
              ? 'border-2 border-[#C29B38] bg-white'
              : isSpouse
                ? 'border-dashed border-[#D8C8B8] bg-[#FDFBF7]'
                : 'border-[#EBDED2] bg-white hover:border-[#C2671A]/60'
        }`}>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                isDeceased ? 'bg-stone-400' : 'bg-[#2D5A43]'
              }`}
            />
            <span className='truncate font-serif text-xs font-bold text-[#4A2818] group-hover:text-[#C2671A]'>
              {person.full_name}
            </span>
          </div>
          <div className='mt-0.5 flex items-center justify-between text-[10px] text-[#786C65]'>
            <span>{person.generation ? `Đ${person.generation}` : `Cấp ${level + 1}`}</span>
            {badge && (
              <span className='font-semibold text-[#8C6D58] truncate max-w-[60px]'>
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── 2. CHẾ ĐỘ DETAILED (TRANG TRỌNG & RÕ RÀNG) ──────────────────────── */
  return (
    <div
      onClick={handleClick}
      className={`group relative flex w-52 sm:w-60 items-stretch gap-2.5 rounded-2xl border p-2.5 sm:p-3 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
        isHighlighted
          ? 'border-[#C2671A] bg-[#FFFDF9] ring-2 ring-[#C2671A]/30'
          : isAncestor
            ? 'border-2 border-[#C29B38] bg-white shadow-xs'
            : isSpouse
              ? 'border-dashed border-[#D8C8B8] bg-[#FDFBF7]'
              : 'border-[#EBDED2] bg-white hover:border-[#C2671A]/60'
      }`}>
      {/* Badge nổi góc trên */}
      {badge && (
        <div
          className={`absolute -top-2.5 ${
            isSpouse ? 'left-3' : 'right-3'
          } inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-2xs ${
            isAncestor
              ? 'bg-[#4A2818] text-amber-200 border border-[#C29B38]'
              : isSpouse
                ? 'bg-amber-100 text-[#8C6D58] border border-amber-200'
                : 'bg-[#FAF7F2] text-[#8C6D58] border border-[#EBDED2]'
          }`}>
          {badge}
        </div>
      )}

      {/* Avatar silhouette hoặc ảnh thật */}
      <PersonAvatar person={person} isAncestor={isAncestor} />

      {/* Thông tin thành viên */}
      <div className='flex flex-1 min-w-0 flex-col justify-center'>
        <div className='flex items-center gap-1.5'>
          <h4
            className='truncate font-serif text-xs sm:text-sm font-bold text-[#4A2818] transition-colors group-hover:text-[#C2671A]'
            title={person.full_name}>
            {person.full_name}
          </h4>
        </div>

        {/* Năm sinh - mất hoặc trạng thái còn tại thế */}
        <p className='mt-0.5 text-[11px] text-[#786C65] flex items-center gap-1.5'>
          {isDeceased ? (
            <span>
              {person.birth_year ? person.birth_year : '?'} –{' '}
              {person.death_year ? person.death_year : '?'}
            </span>
          ) : (
            <span className='flex items-center gap-1 text-[#2D5A43] font-medium'>
              <span className='size-1.5 rounded-full bg-[#2D5A43]' />
              <span>{person.birth_year ? `${person.birth_year} • ` : ''}Tại thế</span>
            </span>
          )}
        </p>

        {/* Chi phái hoặc vai vế */}
        <div className='mt-1 flex items-center gap-1 text-[10px] text-[#8C6D58]'>
          <span>{person.generation ? `Đời thứ ${person.generation}` : `Thế hệ ${level + 1}`}</span>
          {isSpouse && <span>• Phối ngẫu</span>}
        </div>
      </div>
    </div>
  )
}

export default memo(FamilyNodeCard)

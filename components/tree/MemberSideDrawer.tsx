'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GitMerge, Heart, X } from 'lucide-react'

import DefaultAvatar from '@/components/DefaultAvatar'
import { useAvatarUrl } from '@/context/AvatarUrlContext'
import { useMemberListView } from '@/context/useMemberListView'
import { Person, Relationship } from '@/types'

interface MemberSideDrawerProps {
  person: Person | null
  onClose: () => void
  personsMap: Map<string, Person>
  relationships: Relationship[]
  onSelectPerson: (id: string) => void
}

function MemberSideDrawer({
  person,
  onClose,
  personsMap,
  relationships,
  onSelectPerson
}: MemberSideDrawerProps) {
  const avatarUrl = useAvatarUrl()
  const { setMemberModalId } = useMemberListView()

  if (!person) return null

  const isDeceased = person.is_deceased || person.death_year != null
  const customAvatar = avatarUrl(person.avatar_url)

  // Tìm cha mẹ
  const parentRels = relationships.filter(
    (r) =>
      (r.type === 'biological_child' || r.type === 'adopted_child') &&
      r.person_b === person.id
  )
  const parents = parentRels
    .map((r) => personsMap.get(r.person_a))
    .filter((p): p is Person => Boolean(p))

  // Tìm phối ngẫu
  const spouseRels = relationships.filter(
    (r) =>
      r.type === 'marriage' &&
      (r.person_a === person.id || r.person_b === person.id)
  )
  const spouses = spouseRels
    .map((r) =>
      personsMap.get(r.person_a === person.id ? r.person_b : r.person_a)
    )
    .filter((p): p is Person => Boolean(p))

  // Tìm con cái
  const childRels = relationships.filter(
    (r) =>
      (r.type === 'biological_child' || r.type === 'adopted_child') &&
      r.person_a === person.id
  )
  const children = childRels
    .map((r) => personsMap.get(r.person_b))
    .filter((p): p is Person => Boolean(p))

  return (
    <aside
      aria-label='Thông tin thành viên'
      className='fixed right-0 top-16 bottom-0 z-30 w-80 sm:w-96 border-l border-[#EBDED2] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-[#EBDED2] bg-[#FAF7F2] p-4'>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full bg-[#C2671A]' />
          <h3 className='font-serif text-sm font-bold text-[#4A2818]'>
            Hồ Sơ Thành Viên
          </h3>
        </div>
        <button
          type='button'
          onClick={onClose}
          aria-label='Đóng'
          className='rounded-lg p-1 text-[#786C65] transition hover:bg-stone-200 hover:text-[#4A2818]'>
          <X className='size-4' />
        </button>
      </div>

      {/* Body */}
      <div className='flex-1 overflow-y-auto p-5 space-y-6'>
        {/* Profile Card */}
        <div className='text-center'>
          <div className='mx-auto flex size-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#C29B38] shadow-md'>
            {customAvatar ? (
              <Image
                src={customAvatar}
                alt=''
                unoptimized
                width={80}
                height={80}
                className='h-full w-full object-cover'
              />
            ) : (
              <DefaultAvatar
                gender={person.gender}
                name={person.full_name}
                isAncestor={person.generation === 1}
                size={80}
              />
            )}
          </div>
          <h2 className='mt-3 font-serif text-xl font-bold text-[#4A2818]'>
            {person.full_name}
          </h2>
          <div className='mt-1 flex items-center justify-center gap-2 text-xs text-[#786C65]'>
            <span className='rounded-full border border-[#EBDED2] bg-[#FAF7F2] px-2.5 py-0.5 font-semibold text-[#C2671A]'>
              {person.generation ? `Đời thứ ${person.generation}` : 'Họ Chu'}
            </span>
            {person.is_in_law && (
              <span className='rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-[#8C6D58]'>
                Phối ngẫu
              </span>
            )}
          </div>
        </div>

        {/* Quick Facts */}
        <div className='space-y-2 rounded-xl border border-[#EBDED2] bg-[#FAF7F2]/60 p-4 text-xs'>
          <div className='flex items-center justify-between'>
            <span className='text-[#786C65]'>Tình trạng:</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                isDeceased ? 'text-stone-500' : 'text-[#2D5A43]'
              }`}>
              <span
                className={`size-1.5 rounded-full ${
                  isDeceased ? 'bg-stone-400' : 'bg-[#2D5A43]'
                }`}
              />
              {isDeceased ? 'Đã quy tiên' : 'Còn tại thế'}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-[#786C65]'>Năm sinh:</span>
            <span className='font-semibold text-[#4A2818]'>
              {person.birth_year ? `${person.birth_year}` : 'Chưa rõ'}
            </span>
          </div>

          {isDeceased && (
            <div className='flex items-center justify-between'>
              <span className='text-[#786C65]'>Năm mất (Âm lịch):</span>
              <span className='font-semibold text-[#C2671A]'>
                {person.death_lunar_day && person.death_lunar_month
                  ? `Ngày ${person.death_lunar_day}/${person.death_lunar_month} ÂL`
                  : person.death_year
                    ? `${person.death_year}`
                    : 'Chưa rõ'}
              </span>
            </div>
          )}

          {person.birth_order != null && (
            <div className='flex items-center justify-between'>
              <span className='text-[#786C65]'>Thứ bậc:</span>
              <span className='font-semibold text-[#4A2818]'>
                {person.birth_order === 1 ? 'Con trưởng' : `Con thứ ${person.birth_order}`}
              </span>
            </div>
          )}
        </div>

        {/* Trực hệ gia đình */}
        <div className='space-y-3'>
          <h4 className='font-serif text-xs font-bold uppercase tracking-wider text-[#4A2818]'>
            Quan Hệ Trực Hệ
          </h4>

          {/* Cha mẹ */}
          {parents.length > 0 && (
            <div className='space-y-1.5'>
              <p className='text-[11px] font-medium text-[#786C65]'>Thân phụ / Thân mẫu:</p>
              {parents.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPerson(p.id)}
                  className='flex items-center justify-between rounded-xl border border-[#EBDED2] bg-white p-2.5 text-xs transition hover:border-[#C2671A] cursor-pointer'>
                  <span className='font-semibold text-[#4A2818]'>{p.full_name}</span>
                  <span className='text-[10px] text-[#786C65]'>
                    {p.generation ? `Đời ${p.generation}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Phối ngẫu */}
          {spouses.length > 0 && (
            <div className='space-y-1.5'>
              <p className='text-[11px] font-medium text-[#786C65]'>Phối ngẫu:</p>
              {spouses.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectPerson(s.id)}
                  className='flex items-center justify-between rounded-xl border border-dashed border-[#D8C8B8] bg-[#FDFBF7] p-2.5 text-xs transition hover:border-[#C2671A] cursor-pointer'>
                  <span className='font-semibold text-[#8C6D58]'>{s.full_name}</span>
                  <Heart className='size-3.5 text-[#C2671A]' />
                </div>
              ))}
            </div>
          )}

          {/* Con cái */}
          {children.length > 0 && (
            <div className='space-y-1.5'>
              <p className='text-[11px] font-medium text-[#786C65]'>Con cái ({children.length}):</p>
              <div className='max-h-36 overflow-y-auto space-y-1 pr-1'>
                {children.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectPerson(c.id)}
                    className='flex items-center justify-between rounded-lg border border-[#EBDED2] bg-white p-2 text-xs transition hover:border-[#C2671A] cursor-pointer'>
                    <span className='font-medium text-[#4A2818]'>{c.full_name}</span>
                    <span className='text-[10px] text-stone-400'>
                      {c.gender === 'male' ? 'Nam' : 'Nữ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div className='space-y-2 pt-2'>
          <button
            type='button'
            onClick={() => setMemberModalId(person.id)}
            className='w-full rounded-xl bg-[#4A2818] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3D2012]'>
            Chỉnh sửa & Xem Toàn Bộ Hồ Sơ
          </button>
          <Link
            href={`/dashboard/kinship?p1=${person.id}`}
            className='flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#EBDED2] bg-white py-2 text-xs font-medium text-[#786C65] transition hover:bg-[#FAF7F2]'>
            <GitMerge className='size-3.5 text-[#C2671A]' />
            <span>Tra Cứu Xưng Hô Với Người Này</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default memo(MemberSideDrawer)

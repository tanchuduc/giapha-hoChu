'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronUp, Flame, Heart, Sparkles } from 'lucide-react'

interface DeceasedPerson {
  id: string
  full_name: string
  death_year: number | null
  death_month: number | null
  death_day: number | null
  death_lunar_year: number | null
  death_lunar_month: number | null
  death_lunar_day: number | null
  is_deceased: boolean
}

interface AncestralHallProps {
  deceasedPersons: DeceasedPerson[]
}

const PRAYERS = [
  {
    id: 'van-khan-gio',
    title: 'Văn khấn ngày Giỗ Tiên Tổ (Chính kỵ & Cát kỵ)',
    tag: 'Ngày giỗ',
    content: `Nam mô A Di Đà Phật! (3 lần, 3 lạy)

Con kính lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Hoàng thiên Hậu Thổ chư vị Tôn thần.
Con kính lạy ngài Bản cảnh Thành hoàng, ngài Bản xứ Thổ địa, ngài Táo phủ Thần quân cùng chư vị Tôn thần cai quản trong xứ này.

Con kính lạy Cao Tằng Tổ Khảo, Cao Tằng Tổ Tỷ, Bá Thúc Huynh Đệ, Cô Di Tỷ Muội họ Chu cùng chư vị Hương linh nội ngoại.

Hôm nay là ngày... tháng... năm... (Âm lịch)
Tín chủ con là: ...
Cùng toàn thể gia đình con cháu nội ngoại kính cẩn sắm sửa hương hoa lễ vật, thắp nén tâm hương, thành kính dâng lên trước án.

Kính mời hương linh các bậc Tiên tổ, chư vị Hương linh họ Chu giáng lâm trước án, chứng giám lòng thành, thụ hưởng lễ vật. Phù hộ độ trì cho toàn thể gia đạo bình an, con cháu đoàn kết, công việc hanh thông, vạn sự cát tường.

Chúng con lễ bạc tâm thành, trước án kính lễ, cúi xin chứng giám!
Nam mô A Di Đà Phật! (3 lần, 3 lạy)`
  },
  {
    id: 'van-khan-ram-mung-1',
    title: 'Văn khấn mùng Một và ngày Rằm tại Từ Đường',
    tag: 'Tuần tiết',
    content: `Nam mô A Di Đà Phật! (3 lần, 3 lạy)

Con lạy chín phương Trời, mười phương Chư Phật.
Con kính lạy Thần linh, Thổ địa, Táo quân cai quản trong bản xứ.
Con kính lạy Tiên linh dòng họ Chu, chư vị Tổ tiên nội ngoại tiền bối.

Hôm nay là ngày Sóc / Vọng (Mùng Một / Ngày Rằm) tháng... năm...
Tín chủ con kính cẩn dâng nén tâm hương, hoa quả phẩm vật, kính cẩn thỉnh mời các bậc Tiên linh họ Chu quang lâm án tiền, giáng phúc lưu ân.

Cầu xin Tiên tổ che chở cho toàn thể dòng họ trên dưới thuận hòa, cháu con chăm ngoan tiến tới, gia môn hưng vượng.

Nam mô A Di Đà Phật! (3 lần, 3 lạy)`
  },
  {
    id: 'van-khan-thanh-minh',
    title: 'Văn khấn Tiết Thanh Minh (Tảo mộ Tổ tiên)',
    tag: 'Thanh minh',
    content: `Nam mô A Di Đà Phật! (3 lần, 3 lạy)

Con kính lạy chư vị Thổ địa, Thành hoàng, Thần linh chúa đất nơi nghĩa trang / phần mộ gia tộc.
Con kính lạy chư vị Tiên linh họ Chu an nghỉ tại nơi đây.

Hôm nay là tiết Thanh minh, con cháu họ Chu tề tựu về trước phần mộ, kính cẩn sửa sang phần mộ, dâng nén tâm hương, lễ vật kính tạ.

Kính xin chư vị Thần linh cho phép chư vị Tiên linh thụ hưởng lễ vật. Nguyện cầu Tiên tổ an yên nơi cõi vĩnh hằng, phù hộ cho con cháu đời đời phát phúc, rạng danh dòng tộc.

Nam mô A Di Đà Phật! (3 lần, 3 lạy)`
  },
  {
    id: 'van-khan-tat-nien',
    title: 'Văn khấn Lễ Tất Niên & Mời Tiên Tổ về ăn Tết',
    tag: 'Tết Nguyên Đán',
    content: `Nam mô A Di Đà Phật! (3 lần, 3 lạy)

Con kính lạy chư vị Thần linh bản xứ cai quản.
Con kính lạy Tổ khảo, Tổ tỷ, chư vị Tiên tổ họ Chu.

Hôm nay là ngày 30 tháng Chạp năm...
Nhân tiết cuối năm, toàn thể con cháu nội ngoại tề tựu, kính dâng lễ vật Tất niên, đốt nén hương thơm, thành kính kính thỉnh chư vị Tiên tổ về ngự trước án thưởng thức hương hoa, chung vui cùng cháu con đón mừng xuân mới.

Kính chúc Tiên tổ an nhàn cõi thọ, độ trì cho gia tộc bước sang năm mới vạn sự hanh thông, khang thái bình an.

Nam mô A Di Đà Phật! (3 lần, 3 lạy)`
  }
]

export default function AncestralHall({ deceasedPersons }: AncestralHallProps) {
  const [incenseCount, setIncenseCount] = useState(128)
  const [hasOffered, setHasOffered] = useState(false)
  const [openPrayerId, setOpenPrayerId] = useState<string | null>('van-khan-gio')

  const handleOfferIncense = () => {
    if (!hasOffered) {
      setIncenseCount((prev) => prev + 1)
      setHasOffered(true)
    }
  }

  const togglePrayer = (id: string) => {
    setOpenPrayerId(openPrayerId === id ? null : id)
  }

  return (
    <div className='space-y-8'>
      {/* ── Banner Từ Đường Họ Chu ── */}
      <div className='relative overflow-hidden rounded-3xl border border-[#EBDED2] bg-gradient-to-b from-[#FAF7F2] to-white p-6 sm:p-8 shadow-xs'>
        <div className='relative z-10 flex flex-col items-center text-center'>
          <div className='inline-flex items-center gap-2 rounded-full border border-[#EBDED2] bg-white px-3.5 py-1 text-xs font-medium text-[#786C65] mb-3'>
            <Sparkles className='size-3.5 text-[#C2671A]' />
            <span>Không Gian Tâm Linh & Cội Nguồn Dòng Tộc</span>
          </div>
          
          <h2 className='font-serif text-2xl sm:text-3xl font-bold text-[#4A2818] tracking-tight'>
            Từ Đường Họ Chu
          </h2>
          <p className='mt-2 max-w-xl text-sm leading-relaxed text-[#786C65]'>
            &ldquo;Cây có gốc mới nở ngành xanh ngọn, nước có nguồn mới bể rộng sông sâu.&rdquo; Nơi phụng thờ các bậc tiền nhân, gắn kết muôn đời cháu con họ Chu.
          </p>

          {/* Nút thắp nén tâm hương */}
          <div className='mt-6 flex flex-col items-center gap-3'>
            <button
              type='button'
              onClick={handleOfferIncense}
              disabled={hasOffered}
              className={`inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 shadow-sm ${
                hasOffered
                  ? 'bg-amber-100 text-[#78350F] cursor-default'
                  : 'bg-[#4A2818] text-white hover:bg-[#3D2012] hover:scale-105 active:scale-95'
              }`}>
              <Flame className={`size-4.5 ${hasOffered ? 'text-[#C2671A] animate-pulse' : 'text-amber-300'}`} />
              <span>{hasOffered ? 'Đã dâng nén tâm hương' : 'Thắp nén tâm hương kính nhớ Tiên Tổ'}</span>
            </button>
            <p className='text-xs text-stone-400 flex items-center gap-1.5'>
              <Heart className='size-3.5 text-rose-500 fill-rose-500/20' />
              <span>Hôm nay đã có <strong>{incenseCount}</strong> nén tâm hương từ con cháu dâng kính</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Bàn Thờ Tiên Tổ (Danh bạ tiền nhân đã quy tiên) ── */}
      <section className='space-y-4'>
        <div className='flex items-center justify-between border-b border-[#EBDED2] pb-3'>
          <div>
            <h3 className='font-serif text-lg font-semibold text-[#4A2818]'>
              Bàn Thờ Gia Tiên & Danh Bộ Tiền Nhân
            </h3>
            <p className='text-xs text-[#786C65]'>
              Danh bạ các bậc tiền bối họ Chu đã quy tiên ({deceasedPersons.length} người)
            </p>
          </div>
        </div>

        {deceasedPersons.length > 0 ? (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'>
            {deceasedPersons.map((p) => {
              const lunarDate =
                p.death_lunar_day && p.death_lunar_month
                  ? `Ngày ${p.death_lunar_day}/${p.death_lunar_month} ÂL`
                  : null

              return (
                <div
                  key={p.id}
                  className='rounded-2xl border border-[#EBDED2] bg-white p-4 transition-all hover:border-[#C2671A]/40 hover:shadow-xs'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <p className='font-serif text-base font-semibold text-[#4A2818] truncate'>
                        {p.full_name}
                      </p>
                      <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#786C65]'>
                        {lunarDate && (
                          <span className='inline-flex items-center rounded-md bg-[#FAF7F2] px-2 py-0.5 text-[#C2671A] font-medium border border-[#EBDED2]'>
                            Giỗ: {lunarDate}
                          </span>
                        )}
                        {p.death_year && (
                          <span className='text-stone-400'>
                            Mất năm {p.death_year}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-[#EBDED2] bg-[#FAF7F2]/40 py-8 text-center text-[#786C65]'>
            <p className='text-sm font-medium'>Chưa có thông tin thành viên đã quy tiên</p>
          </div>
        )}
      </section>

      {/* ── Kho Văn Khấn Cổ Truyền Chuẩn Mực ── */}
      <section className='space-y-4'>
        <div className='border-b border-[#EBDED2] pb-3'>
          <h3 className='font-serif text-lg font-semibold text-[#4A2818] flex items-center gap-2'>
            <BookOpen className='size-5 text-[#C2671A]' />
            <span>Kho Văn Khấn Cổ Truyền Dòng Tộc</span>
          </h3>
          <p className='text-xs text-[#786C65] mt-0.5'>
            Các bài văn khấn chuẩn mực được lưu truyền để con cháu trang trọng đọc khi hành lễ trước ban thờ
          </p>
        </div>

        <div className='space-y-3'>
          {PRAYERS.map((prayer) => {
            const isOpen = openPrayerId === prayer.id
            return (
              <div
                key={prayer.id}
                className='overflow-hidden rounded-2xl border border-[#EBDED2] bg-white transition-all'>
                <button
                  type='button'
                  onClick={() => togglePrayer(prayer.id)}
                  className='flex w-full items-center justify-between p-4 text-left font-medium transition-colors hover:bg-[#FAF7F2]'>
                  <div className='flex items-center gap-3'>
                    <span className='inline-flex items-center rounded-full bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-medium text-[#C2671A] border border-[#EBDED2]'>
                      {prayer.tag}
                    </span>
                    <span className='font-serif text-sm sm:text-base font-semibold text-[#4A2818]'>
                      {prayer.title}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className='size-5 text-stone-400' />
                  ) : (
                    <ChevronDown className='size-5 text-stone-400' />
                  )}
                </button>

                {isOpen && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='border-t border-[#F5EFEB] bg-[#FAF7F2]/60 p-5'>
                    <pre className='whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-[#4A2818]'>
                      {prayer.content}
                    </pre>
                  </m.div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

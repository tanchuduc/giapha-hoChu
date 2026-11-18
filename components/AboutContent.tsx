'use client'

import { m } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Compass,
  GraduationCap,
  Heart,
  Landmark,
  Mail,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

import Footer from '@/components/Footer'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useI18n } from '@/lib/i18n/useI18n'

interface AboutContentProps {
  siteName: string
}

export default function AboutContent({ siteName }: AboutContentProps) {
  const { t } = useI18n()

  return (
    <div className='relative flex min-h-screen flex-col bg-neutral selection:bg-amber-200 selection:text-amber-900'>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[24px_24px]' />

      <div className='absolute top-6 right-6 z-20'>
        <LanguageSwitcher />
      </div>

      <Link href='/dashboard' className='btn absolute top-6 left-6 z-20'>
        <ArrowLeft className='size-4 transition-transform group-hover:-translate-x-1' />
        {t('back')}
      </Link>

      <div className='relative z-10 mb-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-20'>
        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className='w-full max-w-4xl'>
          {/* Header Card */}
          <div className='mt-6 mb-8 rounded-3xl border border-stone-200 bg-white p-8 sm:p-12 shadow-xs'>
            {/* Tagline & Title */}
            <div className='text-center border-b border-stone-200/80 pb-8'>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-100/70 px-3.5 py-1 text-xs font-semibold text-amber-900 mb-3'>
                <Sparkles className='size-3.5 text-amber-700' />
                Cội Nguồn & Bản Sắc Dòng Họ
              </span>
              <h1 className='font-serif text-3xl sm:text-4xl font-bold text-stone-900'>
                {siteName}
              </h1>
              <p className='mt-2 font-serif text-base italic text-amber-800'>
                &ldquo;Mộc xuất thiên chi do hữu bản — Thủy lưu vạn phái tổng đồng nguyên&rdquo;
              </p>
              <p className='text-xs text-stone-500 mt-1'>
                (Cây sinh ngàn nhánh do từ gốc — Nước chảy vạn dòng bởi một nguồn)
              </p>
            </div>

            {/* Clan Pillars */}
            <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className='rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-amber-600 text-white mb-3'>
                  <Landmark className='size-5' />
                </div>
                <h2 className='text-sm font-bold text-stone-900'>Từ Đường & Tổ Nghiệp</h2>
                <p className='mt-1 text-xs leading-relaxed text-stone-600'>
                  Nơi phụng thờ Tiên Tổ, kết nối các chi nhánh toàn quốc, lưu giữ linh hồn và gốc rễ gia tộc qua bao thế hệ.
                </p>
              </div>

              <div className='rounded-2xl border border-stone-200/70 bg-stone-50/60 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-stone-800 text-white mb-3'>
                  <GraduationCap className='size-5' />
                </div>
                <h2 className='text-sm font-bold text-stone-900'>Truyền Thống Hiếu Học</h2>
                <p className='mt-1 text-xs leading-relaxed text-stone-600'>
                  Noi gương Vạn thế sư biểu Chu Văn An, con cháu họ Chu luôn đề cao đạo nghĩa, chính trực, thanh liêm và tinh thần hiếu học.
                </p>
              </div>

              <div className='rounded-2xl border border-rose-200/60 bg-rose-50/40 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-rose-600 text-white mb-3'>
                  <Heart className='size-5' />
                </div>
                <h2 className='text-sm font-bold text-stone-900'>Tình Nghĩa Đồng Tộc</h2>
                <p className='mt-1 text-xs leading-relaxed text-stone-600'>
                  Khuyến học khuyến tài, tương trợ hiếu hỷ, hướng dẫn con cháu phương xa tìm về nguồn cội, nhớ ngày giỗ tổ.
                </p>
              </div>
            </div>

            {/* Clan Preface */}
            <div className='mt-8 border-t border-stone-200/70 pt-8'>
              <div className='flex items-center gap-2 mb-3'>
                <BookOpen className='size-5 text-amber-700' />
                <h2 className='font-serif text-xl font-bold text-stone-900'>
                  Lời Tựa Tộc Phả
                </h2>
              </div>
              <div className='rounded-2xl border border-stone-200/60 bg-stone-50/70 p-6 text-sm leading-relaxed text-stone-700 space-y-3 font-serif'>
                <p>
                  Gia phả là huyết mạch văn hóa của một dòng họ. Người xưa có câu: <em>&ldquo;Chim có tổ, người có tông; như cây có cội, như sông có nguồn&rdquo;</em>. Cuốn phả họ Chu ghi chép từ thuở sơ khởi, qua bao thăng trầm dâu bể của lịch sử, con cháu tỏa đi muôn phương lập nghiệp nhưng giọt máu cội nguồn vẫn luôn hướng về tiên tổ.
                </p>
                <p>
                  Hệ thống <strong>Gia Phả OS</strong> được xây dựng nhằm mục đích hiện đại hóa công tác lưu trữ phả ký, giúp các thế hệ con cháu hôm nay và mai sau dễ dàng tra cứu gốc gác, thấu suốt quan hệ thân tộc, đời thứ, chi nhánh, và biết được nơi an nghỉ mộ phần của cha ông.
                </p>
              </div>
            </div>

            {/* Rules of Record */}
            <div className='mt-8 border-t border-stone-200/70 pt-8'>
              <div className='flex items-center gap-2 mb-3'>
                <Compass className='size-5 text-amber-700' />
                <h2 className='font-serif text-xl font-bold text-stone-900'>
                  Quy Chế Ghi Chép & Bảo Vệ Dữ Liệu
                </h2>
              </div>
              <div className='rounded-2xl border border-stone-200/60 bg-stone-50/70 p-6 text-sm leading-relaxed text-stone-600 space-y-3'>
                <ul className='list-disc space-y-2 pl-5'>
                  <li>
                    <strong className='text-stone-800'>Chính xác & Khách quan:</strong> Mọi thông tin nhân vật, ngày sinh, ngày mất, chi phái đều dựa trên văn tự gia phả cổ, chứng tích lịch sử hoặc xác nhận từ Trưởng chi / Ban trị sự họ Chu.
                  </li>
                  <li>
                    <strong className='text-stone-800'>Quy trình Đề xuất có kiểm soát:</strong> Mọi thành viên đều có thể gửi đề xuất bổ sung hoặc đính chính kèm lý do và chứng cứ, đảm bảo không ai có thể tự ý làm sai lệch cây phả hệ chính thức.
                  </li>
                  <li>
                    <strong className='text-stone-800'>Bảo mật quyền riêng tư:</strong> Số điện thoại, địa chỉ cá nhân của người còn sống được mã hóa và phân quyền nghiêm ngặt, chỉ ban liên lạc và người được ủy quyền mới có thể tiếp cận.
                  </li>
                  <li>
                    <strong className='text-stone-800'>Chỉ dẫn viếng mộ tâm linh:</strong> Lưu trữ nơi an táng và định vị vị trí mộ phần, giúp con cháu dù ở xa vạn dặm cũng có thể tìm về bái tế đúng dịp Thanh minh, tảo mộ.
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact & Support */}
            <div className='mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-stone-200/70 pt-8'>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-amber-100 p-2.5 text-amber-800'>
                  <ShieldCheck className='size-5' />
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-stone-900'>Ban Trị Sự Tộc Chu</h3>
                  <p className='text-xs text-stone-500'>Đại diện toàn tộc — Quản lý và bảo tồn di sản phả hệ</p>
                </div>
              </div>

              <a
                href='mailto:bantitocchu@gmail.com'
                className='inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100'>
                <Mail className='size-4' />
                Liên hệ Ban Trị Sự
              </a>
            </div>
          </div>
        </m.div>
      </div>
      <Footer className='relative z-10 border-none bg-transparent' />
    </div>
  )
}

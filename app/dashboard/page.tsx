import {
  ArrowRight,
  ArrowUpCircle,
  BarChart2,
  BookOpen,
  Cake,
  CalendarDays,
  Database,
  FileCheck,
  FileSpreadsheet,
  Flower2,
  GitBranch,
  GitMerge,
  HeartHandshake,
  Image as ImageIcon,
  Info,
  Landmark,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  Users
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import config from '@/app/config'
import { getServerTranslations } from '@/lib/i18n/server'
import { getTodayLunar, vnToday } from '@/utils/dateHelpers'
import {
  computeEvents,
  eventHref,
  filterVisibleEvents,
  formatLunarDateLabel
} from '@/utils/eventHelpers'
import { EVENT_PERSON_COLUMNS, EVENT_PERSON_FILTER } from '@/utils/eventPersons'
import { fetchAllRowsOrThrow } from '@/utils/supabase/fetchAll'
import { getIsAdmin, getSupabase } from '@/utils/supabase/queries'

/* ── Event type helpers ───────────────────────────────────────────── */
const eventTypeConfig = {
  birthday: {
    icon: Cake,
    color: 'text-amber-700',
    bg: 'bg-amber-100/70',
    border: 'border-amber-200'
  },
  death_anniversary: {
    icon: Flower2,
    color: 'text-purple-700',
    bg: 'bg-purple-100/70',
    border: 'border-purple-200'
  },
  custom_event: {
    icon: Star,
    color: 'text-emerald-700',
    bg: 'bg-emerald-100/70',
    border: 'border-emerald-200'
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Bảng Điều Khiển | ${config.siteName}` }
}

export default async function DashboardLaunchpad() {
  const [{ t }, isAdmin, supabase] = await Promise.all([
    getServerTranslations(),
    getIsAdmin(),
    getSupabase()
  ])

  /* ── Fetch metrics & events in parallel ─────────────────────────── */
  const [
    { count: totalCount },
    { count: livingCount },
    { data: maxGenData },
    { count: branchCount },
    { data: persons },
    { data: customEvents }
  ] = await Promise.all([
    supabase
      .from('persons')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('persons')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_deceased', false),
    supabase
      .from('persons')
      .select('generation')
      .is('deleted_at', null)
      .order('generation', { ascending: false })
      .limit(1),
    supabase
      .from('branches')
      .select('*', { count: 'exact', head: true }),
    fetchAllRowsOrThrow((from, to) =>
      supabase
        .from('persons')
        .select(EVENT_PERSON_COLUMNS)
        .is('deleted_at', null)
        .or(EVENT_PERSON_FILTER)
        .order('id')
        .range(from, to)
    ),
    fetchAllRowsOrThrow((from, to) =>
      supabase
        .from('custom_events')
        .select('*')
        .order('id')
        .range(from, to)
    )
  ])

  const totalMembers = totalCount ?? 0
  const livingMembers = livingCount ?? 0
  const totalGenerations = maxGenData?.[0]?.generation ?? 0
  const totalBranches = branchCount ?? 0

  const allEvents = computeEvents(persons ?? [], customEvents ?? [], vnToday())
  const upcomingEvents = filterVisibleEvents(allEvents).filter(
    (e) => e.daysUntil >= 0 && e.daysUntil <= 30
  )

  const lunar = getTodayLunar(t)

  /* ── 4 Cột Trụ Hành Động Gia Tộc ──────────────────────────── */
  const coreHeritageFeatures = [
    {
      title: 'Cây Phả Hệ Trực Quan',
      description:
        'Sơ đồ gia phả phân nhánh từng thế hệ, cành nhánh tộc họ. Hỗ trợ chế độ thu gọn, tra cứu và định vị tiền nhân.',
      icon: <Network className='size-7 text-[#4A2818]' />,
      href: '/dashboard/members',
      bgColor: 'bg-amber-100/60',
      badge: 'Cốt lõi'
    },
    {
      title: 'Từ Đường & Lịch Giỗ',
      description:
        'Không gian tưởng niệm tiên tổ họ Chu, thắp hương tri ân, đọc văn khấn và tra cứu ngày kỵ âm lịch.',
      icon: <Landmark className='size-7 text-[#C2671A]' />,
      href: '/dashboard/events',
      bgColor: 'bg-amber-100/70',
      badge: 'Tâm linh'
    },
    {
      title: 'Tra Cứu Xưng Hô',
      description:
        'Hỏi đáp quan hệ xưng hô chuẩn lễ nghĩa gia tộc giữa 2 thành viên bất kỳ theo vai vế chi trên chi dưới.',
      icon: <GitMerge className='size-7 text-[#2D5A43]' />,
      href: '/dashboard/kinship',
      bgColor: 'bg-emerald-50',
      badge: 'Gắn kết'
    },
    {
      title: 'Phả Ký & Kỷ Yếu',
      description:
        'Lịch sử nguồn gốc tổ tiên họ Chu, truyền thống khoa bảng, quy ước gia tộc và sách gia phả lưu truyền.',
      icon: <BookOpen className='size-7 text-[#4A2818]' />,
      href: '/dashboard/lineage/book',
      bgColor: 'bg-[#FAF7F2]',
      badge: 'Lưu truyền'
    }
  ]

  const secondaryFeatures = [
    {
      title: 'Chi Phái Dòng Họ',
      description: 'Quản lý các chi, cành, nhánh trong đại gia đình họ Chu',
      icon: <GitBranch className='size-5 text-[#786C65]' />,
      href: '/dashboard/branches'
    },
    {
      title: t('galleryTitle'),
      description: 'Kho lưu trữ ảnh tư liệu, nhà thờ tổ và các dịp họp mặt',
      icon: <ImageIcon className='size-5 text-[#786C65]' />,
      href: '/dashboard/gallery'
    },
    {
      title: 'Thống Kê Nhân Khẩu',
      description: 'Biểu đồ cơ cấu độ tuổi, tỷ lệ nam nữ, thọ mệnh và thế hệ',
      icon: <BarChart2 className='size-5 text-[#786C65]' />,
      href: '/dashboard/stats'
    },
    {
      title: 'Giới Thiệu & Quy Ước',
      description: 'Tôn chỉ, mục đích xây dựng và hướng dẫn sử dụng gia phả số',
      icon: <Info className='size-5 text-[#786C65]' />,
      href: '/about'
    }
  ]

  const adminFeatures = [
    {
      title: 'Duyệt Đề Xuất Phả Hệ',
      description: 'Xem xét và phê duyệt các thông tin sửa đổi do thành viên gửi lên',
      icon: <FileCheck className='size-6 text-[#C2671A]' />,
      href: '/dashboard/proposals',
      badge: 'Đề xuất'
    },
    {
      title: 'Số Hóa Gia Phả Giấy',
      description: 'Công cụ nhập liệu nhanh phả đồ từ tư liệu chép tay cổ xưa',
      icon: <FileSpreadsheet className='size-6 text-[#4A2818]' />,
      href: '/dashboard/digitization',
      badge: 'Công cụ'
    },
    {
      title: 'Quản Lý Thành Viên',
      description: 'Phân quyền ban biên tập, duyệt tài khoản con cháu đăng ký',
      icon: <Users className='size-6 text-[#4A2818]' />,
      href: '/dashboard/users',
      badge: 'Nhân sự'
    },
    {
      title: 'Thứ Tự Phả Hệ',
      description: 'Thiết lập thứ bậc, trưởng tộc, trưởng chi và định dạng cây',
      icon: <Network className='size-6 text-[#4A2818]' />,
      href: '/dashboard/lineage',
      badge: 'Cấu trúc'
    },
    {
      title: 'Sao Lưu & Phục Hồi',
      description: 'Xuất dữ liệu an toàn, sao lưu phả ký dự phòng đám mây',
      icon: <Database className='size-6 text-[#4A2818]' />,
      href: '/dashboard/data',
      badge: 'Bảo mật'
    },
    {
      title: 'Nâng Cấp Hệ Thống',
      description: 'Kiểm tra phiên bản phần mềm gia phả và tính năng mới',
      icon: <ArrowUpCircle className='size-6 text-[#4A2818]' />,
      href: '/dashboard/upgrade',
      badge: 'Hệ thống'
    }
  ]

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col p-4 sm:p-6 lg:p-8 space-y-8'>
      {/* ── Banner Gia Tộc Họ Chu ─────────────────────────── */}
      <section className='relative overflow-hidden rounded-3xl border border-[#EBDED2] bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5EFE6] p-6 sm:p-8 shadow-xs'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
          <div className='flex-1 text-center md:text-left'>
            <div className='inline-flex items-center gap-2 rounded-full border border-[#EBDED2] bg-white px-3.5 py-1 text-xs font-semibold text-[#786C65] mb-3 shadow-2xs'>
              <Sparkles className='size-3.5 text-[#C2671A]' />
              <span>Gia Phả Họ Chu • Tìm Về Cội Nguồn</span>
            </div>
            <h1 className='font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4A2818] tracking-tight'>
              Gia Phả Dòng Họ Chu
            </h1>
            <p className='mt-2.5 text-xs sm:text-sm text-[#786C65] max-w-xl leading-relaxed'>
              &ldquo;Cây có gốc mới nở cành xanh ngọn, nước có nguồn mới bể rộng sông sâu.&rdquo; Không gian số kết nối huyết thống, phụng thờ tổ tiên và lưu truyền cho muôn đời sau.
            </p>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-3 shrink-0'>
            <Link
              href='/dashboard/members'
              className='inline-flex items-center gap-2 rounded-xl bg-[#4A2818] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#3D2012] hover:scale-102 active:scale-98'>
              <Network className='size-4 text-amber-300' />
              <span>Xem Cây Phả Hệ</span>
            </Link>
            <Link
              href='/dashboard/events'
              className='inline-flex items-center gap-2 rounded-xl border border-[#EBDED2] bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-[#4A2818] shadow-xs transition hover:bg-[#FAF7F2]'>
              <Landmark className='size-4 text-[#C2671A]' />
              <span>Từ Đường & Lịch Giỗ</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Chỉ Số Tổng Quan Gia Tộc (Live Family Metrics) ── */}
      <section className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'>
        {/* Metric 1: Tổng nhân khẩu */}
        <div className='flex items-center gap-3.5 rounded-2xl border border-[#EBDED2] bg-white p-4 sm:p-5 shadow-xs'>
          <div className='flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-[#4A2818] border border-amber-200/60'>
            <Users className='size-5 sm:size-6' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
              Tổng Nhân Khẩu
            </p>
            <div className='flex items-baseline gap-2 mt-0.5'>
              <span className='font-serif text-xl sm:text-2xl font-bold text-[#4A2818]'>
                {totalMembers}
              </span>
              <span className='text-[11px] text-[#786C65] font-medium'>
                người
              </span>
            </div>
            <p className='text-[10px] sm:text-[11px] text-[#2D5A43] font-medium truncate mt-0.5'>
              ● {livingMembers} đang sinh sống
            </p>
          </div>
        </div>

        {/* Metric 2: Thế hệ */}
        <div className='flex items-center gap-3.5 rounded-2xl border border-[#EBDED2] bg-white p-4 sm:p-5 shadow-xs'>
          <div className='flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100/60 text-[#2D5A43] border border-emerald-200/60'>
            <Layers className='size-5 sm:size-6' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
              Thế Hệ Kế Thừa
            </p>
            <div className='flex items-baseline gap-2 mt-0.5'>
              <span className='font-serif text-xl sm:text-2xl font-bold text-[#4A2818]'>
                {totalGenerations > 0 ? `${totalGenerations}` : '—'}
              </span>
              <span className='text-[11px] text-[#786C65] font-medium'>
                đời
              </span>
            </div>
            <p className='text-[10px] sm:text-[11px] text-[#786C65] truncate mt-0.5'>
              Từ Thủy tổ đến nay
            </p>
          </div>
        </div>

        {/* Metric 3: Chi phái */}
        <div className='flex items-center gap-3.5 rounded-2xl border border-[#EBDED2] bg-white p-4 sm:p-5 shadow-xs'>
          <div className='flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-[#C2671A] border border-amber-200/60'>
            <GitBranch className='size-5 sm:size-6' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
              Chi Phái Dòng Họ
            </p>
            <div className='flex items-baseline gap-2 mt-0.5'>
              <span className='font-serif text-xl sm:text-2xl font-bold text-[#4A2818]'>
                {totalBranches > 0 ? totalBranches : '1'}
              </span>
              <span className='text-[11px] text-[#786C65] font-medium'>
                chi cành
              </span>
            </div>
            <p className='text-[10px] sm:text-[11px] text-[#786C65] truncate mt-0.5'>
              Phân bổ các địa phương
            </p>
          </div>
        </div>

        {/* Metric 4: Tình thân & Di sản */}
        <div className='flex items-center gap-3.5 rounded-2xl border border-[#EBDED2] bg-white p-4 sm:p-5 shadow-xs'>
          <div className='flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-rose-100/60 text-rose-800 border border-rose-200/60'>
            <HeartHandshake className='size-5 sm:size-6' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
              Số Hóa Phả Đồ
            </p>
            <div className='flex items-baseline gap-2 mt-0.5'>
              <span className='font-serif text-xl sm:text-2xl font-bold text-[#2D5A43]'>
                100%
              </span>
              <span className='text-[11px] text-[#786C65] font-medium'>
                an toàn
              </span>
            </div>
            <p className='text-[10px] sm:text-[11px] text-[#786C65] truncate mt-0.5'>
              Bảo tồn di sản số
            </p>
          </div>
        </div>
      </section>

      {/* ── Today's Date & Upcoming Events (Lịch Giỗ & Tâm Linh) ── */}
      <section className='group relative block overflow-hidden rounded-3xl border border-[#EBDED2] bg-white p-6 sm:p-8 shadow-xs transition duration-300 hover:border-[#C2671A]/40'>
        <div className='relative flex flex-col items-center gap-6 md:flex-row md:gap-8'>
          {/* Date section */}
          <div className='flex w-full flex-col items-center gap-3 border-[#EBDED2] text-center md:w-[35%] md:items-start md:border-r md:pr-8 md:text-left'>
            <div className='flex size-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-[#4A2818]'>
              <CalendarDays className='size-7 text-[#C2671A]' />
            </div>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
                Hôm nay theo lịch dương
              </p>
              <p className='text-sm font-semibold text-[#4A2818] mt-0.5'>
                {lunar.solarStr}
              </p>
              <div className='mt-2.5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3.5 py-1'>
                <span className='text-xs font-medium text-[#786C65]'>
                  {t('dashboardTodayLunar')}:
                </span>
                <span className='text-xs font-bold text-[#4A2818]'>
                  {lunar.lunarDayStr}
                </span>
              </div>
              <p className='mt-1.5 text-xs text-[#786C65]'>
                Năm {lunar.lunarYear}
              </p>
            </div>
          </div>

          {/* Events summary */}
          <div className='w-full flex-1 md:w-[65%]'>
            {upcomingEvents.length > 0 ? (
              <div className='space-y-3'>
                <Link
                  href='/dashboard/events'
                  className='flex items-center justify-between group/link focus-visible:outline-none'>
                  <span className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
                    <span className='relative flex size-2'>
                      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75'></span>
                      <span className='relative inline-flex size-2 rounded-full bg-amber-500'></span>
                    </span>
                    Ngày Giỗ & Sự Kiện Sắp Tới ({upcomingEvents.length})
                  </span>
                  <span className='inline-flex items-center gap-1 text-xs font-semibold text-[#C2671A] group-hover/link:underline'>
                    Xem tất cả <ArrowRight className='size-3.5' />
                  </span>
                </Link>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  {upcomingEvents.slice(0, 4).map((evt) => {
                    const cfg = eventTypeConfig[evt.type]
                    const Icon = cfg.icon
                    return (
                      <Link
                        key={`${evt.type}-${evt.personId}-${evt.nextOccurrence.getTime()}`}
                        href={eventHref(evt)}
                        className='relative z-10 flex items-center gap-3 rounded-2xl border border-[#EBDED2] bg-[#FAF7F2]/60 p-3 transition duration-200 hover:border-[#C2671A]/40 hover:bg-white'>
                        <div
                          className={`size-10 rounded-xl ${cfg.bg} flex shrink-0 items-center justify-center border ${cfg.border}`}>
                          <Icon className={`size-4.5 ${cfg.color}`} />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <span className='block truncate text-xs font-semibold text-[#4A2818]'>
                            {evt.personName}
                          </span>
                          <span className='block text-xs text-[#786C65] mt-0.5'>
                            {evt.daysUntil === 0
                              ? t('today')
                              : evt.daysUntil === 1
                                ? t('tomorrow')
                                : `Còn ${evt.daysUntil} ngày`}{' '}
                            · {formatLunarDateLabel(evt, t)}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center gap-2 py-4 text-center'>
                <p className='text-sm font-medium text-[#786C65]'>
                  Không có ngày giỗ hoặc sự kiện nào trong 30 ngày tới
                </p>
                <Link
                  href='/dashboard/events'
                  className='inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2671A] hover:underline'>
                  <span>Mở Không Gian Từ Đường & Lịch Giỗ</span>
                  <ArrowRight className='size-3.5' />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4 Cột Trụ Hành Động Cốt Lõi ───────────────────── */}
      <section className='space-y-4'>
        <div className='border-b border-[#EBDED2] pb-2'>
          <h2 className='font-serif text-xl font-bold text-[#4A2818]'>
            Trọng Tâm Gia Tộc
          </h2>
          <p className='text-xs text-[#786C65]'>
            Bốn trụ cột gìn giữ, tra cứu và kết nối dòng họ Chu
          </p>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {coreHeritageFeatures.map((feat) => (
            <Link
              key={feat.href}
              href={feat.href}
              className='group flex flex-col justify-between rounded-2xl border border-[#EBDED2] bg-white p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-[#C2671A]/50 hover:shadow-md'>
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl ${feat.bgColor} border border-[#EBDED2] transition-transform duration-300 group-hover:scale-105`}>
                    {feat.icon}
                  </div>
                  <span className='inline-flex items-center rounded-full bg-[#FAF7F2] px-2.5 py-0.5 text-[11px] font-semibold text-[#786C65] border border-[#EBDED2]'>
                    {feat.badge}
                  </span>
                </div>
                <h3 className='font-serif text-lg font-bold text-[#4A2818] transition-colors group-hover:text-[#C2671A]'>
                  {feat.title}
                </h3>
                <p className='mt-2 text-xs leading-relaxed text-[#786C65] line-clamp-3'>
                  {feat.description}
                </p>
              </div>
              <div className='mt-5 flex items-center gap-1 text-xs font-semibold text-[#C2671A] group-hover:translate-x-1 transition-transform'>
                <span>Khám phá ngay</span>
                <ArrowRight className='size-3.5' />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Tiện Ích Dòng Họ & Tư Liệu ───────────────────── */}
      <section className='space-y-4'>
        <div className='border-b border-[#EBDED2] pb-2'>
          <h2 className='font-serif text-xl font-bold text-[#4A2818]'>
            Tư Liệu & Hoạt Động Gia Tộc
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {secondaryFeatures.map((feat) => (
            <Link
              key={feat.href}
              href={feat.href}
              className='group flex items-center gap-3.5 rounded-2xl border border-[#EBDED2] bg-white p-4 shadow-xs transition duration-200 hover:border-[#C2671A]/40 hover:bg-[#FAF7F2]/40'>
              <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#EBDED2] bg-[#FAF7F2] text-[#786C65] transition-colors group-hover:bg-white group-hover:text-[#4A2818]'>
                {feat.icon}
              </div>
              <div className='min-w-0 flex-1'>
                <h4 className='text-xs font-bold text-[#4A2818] transition-colors group-hover:text-[#C2671A] truncate'>
                  {feat.title}
                </h4>
                <p className='text-[11px] text-[#786C65] truncate mt-0.5'>
                  {feat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Khu Vực Quản Trị Dòng Họ (Admin & Editor only) ─ */}
      {isAdmin && (
        <section className='space-y-4 pt-2'>
          <div className='flex items-center gap-2 border-b border-[#EBDED2] pb-2'>
            <ShieldCheck className='size-5 text-[#C2671A]' />
            <h3 className='font-serif text-lg font-bold text-[#4A2818]'>
              Ban Quản Trị & Ban Biên Tập Dòng Họ
            </h3>
          </div>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {adminFeatures.map((feat) => (
              <Link
                key={feat.href}
                href={feat.href}
                className='group flex items-start gap-4 rounded-2xl border border-[#EBDED2] bg-white p-4.5 shadow-xs transition duration-200 hover:border-[#4A2818] hover:shadow-xs'>
                <div className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 text-[#4A2818] transition-transform group-hover:scale-105'>
                  {feat.icon}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between gap-2'>
                    <h4 className='text-xs sm:text-sm font-bold text-[#4A2818] group-hover:text-[#C2671A] transition-colors'>
                      {feat.title}
                    </h4>
                    <span className='inline-flex items-center rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-semibold text-[#786C65] border border-[#EBDED2]'>
                      {feat.badge}
                    </span>
                  </div>
                  <p className='mt-1 text-xs text-[#786C65] line-clamp-2 leading-relaxed'>
                    {feat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

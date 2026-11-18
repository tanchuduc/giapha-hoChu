import {
  ArrowRight,
  ArrowUpCircle,
  BarChart2,
  BookOpen,
  Cake,
  CalendarDays,
  Database,
  Flower2,
  GitBranch,
  GitMerge,
  Image as ImageIcon,
  Info,
  Landmark,
  Network,
  Sparkles,
  Star,
  Users
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

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
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  death_anniversary: {
    icon: Flower2,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  custom_event: {
    icon: Star,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations()

  return { title: t('dashboard') }
}

export default async function DashboardLaunchpad() {
  const [{ t }, isAdmin, supabase] = await Promise.all([
    getServerTranslations(),
    getIsAdmin(),
    getSupabase()
  ])

  /* ── Fetch events data ────────────────────────────────────────── */
  const [{ data: persons }, { data: customEvents }] = await Promise.all([
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
        // '*' includes recurrence once the database has the column.
        .select('*')
        .order('id')
        .range(from, to)
    )
  ])

  const allEvents = computeEvents(persons ?? [], customEvents ?? [], vnToday())
  const upcomingEvents = filterVisibleEvents(allEvents).filter(
    (e) => e.daysUntil >= 0 && e.daysUntil <= 30
  )

  const lunar = getTodayLunar(t)

  /* ── 4 Cột Trụ Hành Động Gia Tộc ──────────────────────────── */
  const coreHeritageFeatures = [
    {
      title: 'Cây Phả Hệ Trực Quan',
      description: 'Tra cứu sơ đồ gia phả phân nhánh theo từng thế hệ, cành nhánh tộc họ',
      icon: <Network className='size-8 text-[#4A2818]' />,
      href: '/dashboard/members',
      bgColor: 'bg-amber-100/60',
      badge: 'Cốt lõi'
    },
    {
      title: 'Từ Đường & Lịch Giỗ',
      description: 'Không gian tưởng niệm tiên tổ họ Chu, thắp hương tri ân, văn khấn và ngày kỵ âm lịch',
      icon: <Landmark className='size-8 text-[#C2671A]' />,
      href: '/dashboard/events',
      bgColor: 'bg-amber-100/70',
      badge: 'Tâm linh'
    },
    {
      title: 'Tra Cứu Xưng Hô',
      description: 'Hỏi đáp cách xưng hô chuẩn lễ nghĩa gia tộc giữa 2 thành viên bất kỳ',
      icon: <GitMerge className='size-8 text-[#2D5A43]' />,
      href: '/dashboard/kinship',
      bgColor: 'bg-emerald-50',
      badge: 'Gắn kết'
    },
    {
      title: 'Phả Ký & Kỷ Yếu',
      description: 'Lịch sử nguồn gốc tổ tiên họ Chu, truyền thống khoa bảng và sách gia phả',
      icon: <BookOpen className='size-8 text-[#4A2818]' />,
      href: '/dashboard/lineage/book',
      bgColor: 'bg-[#FAF7F2]',
      badge: 'Lưu truyền'
    }
  ]

  const secondaryFeatures = [
    {
      title: 'Chi Phái Dòng Họ',
      description: 'Quản lý các chi, cành, nhánh trong đại gia đình họ Chu',
      icon: <GitBranch className='size-6 text-[#786C65]' />,
      href: '/dashboard/branches'
    },
    {
      title: t('galleryTitle'),
      description: t('galleryDescriptionShort'),
      icon: <ImageIcon className='size-6 text-[#786C65]' />,
      href: '/dashboard/gallery'
    },
    {
      title: t('statsPageTitle'),
      description: t('statisticsDescription'),
      icon: <BarChart2 className='size-6 text-[#786C65]' />,
      href: '/dashboard/stats'
    },
    {
      title: t('about'),
      description: t('aboutDescriptionShort'),
      icon: <Info className='size-6 text-[#786C65]' />,
      href: '/about'
    }
  ]

  const adminFeatures = [
    {
      title: t('manageUsers'),
      description: t('manageUsersDescription'),
      icon: <Users className='size-7 text-[#4A2818]' />,
      href: '/dashboard/users'
    },
    {
      title: t('lineageOrder'),
      description: t('lineageDescription'),
      icon: <Network className='size-7 text-[#4A2818]' />,
      href: '/dashboard/lineage'
    },
    {
      title: t('backupRestore'),
      description: t('backupDescriptionShort'),
      icon: <Database className='size-7 text-[#4A2818]' />,
      href: '/dashboard/data'
    },
    {
      title: t('upgrade'),
      description: t('upgradeDescriptionShort'),
      icon: <ArrowUpCircle className='size-7 text-[#4A2818]' />,
      href: '/dashboard/upgrade'
    }
  ]

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col p-4 sm:p-8 space-y-8'>
      {/* ── Banner Gia Tộc Họ Chu ─────────────────────────── */}
      <section className='relative overflow-hidden rounded-3xl border border-[#EBDED2] bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] p-6 sm:p-8 shadow-xs'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
          <div className='flex-1 text-center md:text-left'>
            <div className='inline-flex items-center gap-2 rounded-full border border-[#EBDED2] bg-white px-3.5 py-1 text-xs font-semibold text-[#786C65] mb-3'>
              <Sparkles className='size-3.5 text-[#C2671A]' />
              <span>Gia Phả Họ Chu • Tìm Về Cội Nguồn</span>
            </div>
            <h1 className='font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4A2818] tracking-tight'>
              Gia Phả Dòng Họ Chu
            </h1>
            <p className='mt-2 text-xs sm:text-sm text-[#786C65] max-w-xl leading-relaxed'>
              &ldquo;Cây có gốc mới nở ngành xanh ngọn, nước có nguồn mới bể rộng sông sâu.&rdquo; Giữ trọn hiếu nghĩa, cố kết tình thân muôn đời con cháu.
            </p>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-3 shrink-0'>
            <Link
              href='/dashboard/members'
              className='inline-flex items-center gap-2 rounded-xl bg-[#4A2818] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#3D2012] hover:scale-105 active:scale-95'>
              <Network className='size-4 text-amber-300' />
              <span>Khám Phá Cây Phả Hệ</span>
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

      {/* ── Today's Date & Upcoming Events ─────────────────── */}
      <section className='group relative block overflow-hidden rounded-3xl border border-[#EBDED2] bg-white p-6 sm:p-8 shadow-xs transition duration-300 hover:border-[#C2671A]/40'>
        <div className='relative flex flex-col items-center gap-6 md:flex-row md:gap-8'>
          {/* Date section */}
          <div className='flex w-full flex-col items-center gap-4 border-[#EBDED2] text-center md:w-[35%] md:items-start md:border-r md:pr-8 md:text-left'>
            <div className='flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#EBDED2] bg-[#FAF7F2] text-[#4A2818]'>
              <CalendarDays className='size-7 text-[#C2671A]' />
            </div>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-[#786C65]'>
                Hôm nay theo lịch dương
              </p>
              <p className='text-sm font-semibold text-[#4A2818] mt-0.5'>
                {lunar.solarStr}
              </p>
              <div className='mt-2.5 inline-flex items-center gap-2 rounded-full border border-[#EBDED2] bg-[#FAF7F2] px-3.5 py-1'>
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
                          className={`size-10 rounded-xl ${cfg.bg} flex shrink-0 items-center justify-center border border-[#EBDED2]`}>
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

      {/* ── 4 Cột Trụ Cốt Lõi ─────────────────────────────── */}
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

      {/* ── Tiện Ích Dòng Họ ──────────────────────────────── */}
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

      {/* ── Khu Vực Quản Trị Dòng Họ (Admin) ─────────────── */}
      {isAdmin && (
        <section className='space-y-4 pt-4'>
          <div className='flex items-center gap-2 border-b border-[#EBDED2] pb-2'>
            <span className='h-2 w-2 rounded-full bg-[#4A2818]'></span>
            <h3 className='font-serif text-lg font-bold text-[#4A2818]'>
              Ban Quản Trị & Ban Trị Sự Dòng Họ
            </h3>
          </div>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {adminFeatures.map((feat) => (
              <Link
                key={feat.href}
                href={feat.href}
                className='group flex flex-col justify-between rounded-2xl border border-[#EBDED2] bg-white p-5 shadow-xs transition duration-200 hover:border-[#4A2818] hover:shadow-xs'>
                <div>
                  <div className='mb-3 flex size-12 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#EBDED2] text-[#4A2818]'>
                    {feat.icon}
                  </div>
                  <h4 className='text-sm font-bold text-[#4A2818]'>
                    {feat.title}
                  </h4>
                  <p className='mt-1 text-xs text-[#786C65] line-clamp-2'>
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

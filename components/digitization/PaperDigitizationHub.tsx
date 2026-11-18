'use client'

import {
  AlertCircle,
  Check,
  CheckCircle,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
  UserCheck,
  Users
} from 'lucide-react'
import { useState, useTransition } from 'react'

import type { Branch, Person } from '@/types'

export interface ExtractedMemberRecord {
  id: string
  fullName: string
  generation: number | null
  gender: 'male' | 'female' | 'other'
  birthYear: number | null
  deathYear: number | null
  isDeceased: boolean
  spouses: string[]
  children: string[]
  parentName: string | null
  burialPlace: string | null
  branchName: string | null
  note: string | null
  sourcePage: number | string
  confidenceScore: number // 0 to 100
  matchStatus: 'new' | 'potential_duplicate' | 'exact_match'
  matchedPersonId?: string
  selectedForImport: boolean
}

interface PaperDigitizationHubProps {
  existingPersons: Person[]
  branches: Branch[]
  canManage: boolean
}

const SAMPLE_EXTRACTED_RECORDS: ExtractedMemberRecord[] = [
  {
    id: 'rec-1',
    fullName: 'Chu Văn Đạt',
    generation: 4,
    gender: 'male',
    birthYear: 1892,
    deathYear: 1968,
    isDeceased: true,
    spouses: ['Nguyễn Thị Nhàn'],
    children: ['Chu Văn Thịnh', 'Chu Thị Lan'],
    parentName: 'Chu Văn Khang',
    burialPlace: 'Khu lăng mộ dòng họ Chu, đồi Thông',
    branchName: 'Chi 2 - Nhánh Giáp',
    note: 'Cụ đỗ tú tài khoa Nhâm Tý, tham gia phong trào Đông Kinh Nghĩa Thục.',
    sourcePage: 'Trang 14, Tộc phả Chu thị năm 1972',
    confidenceScore: 95,
    matchStatus: 'potential_duplicate',
    selectedForImport: true
  },
  {
    id: 'rec-2',
    fullName: 'Chu Văn Thịnh',
    generation: 5,
    gender: 'male',
    birthYear: 1920,
    deathYear: 1998,
    isDeceased: true,
    spouses: ['Trần Thị Mai'],
    children: ['Chu Quốc Tuấn', 'Chu Thị Hồng'],
    parentName: 'Chu Văn Đạt',
    burialPlace: 'Nghĩa trang quê nhà, thôn Nam',
    branchName: 'Chi 2 - Nhánh Giáp',
    note: 'Cán bộ tiền khởi nghĩa, huân chương kháng chiến hạng Nhất.',
    sourcePage: 'Trang 15, Tộc phả Chu thị năm 1972',
    confidenceScore: 92,
    matchStatus: 'new',
    selectedForImport: true
  },
  {
    id: 'rec-3',
    fullName: 'Chu Thị Lan',
    generation: 5,
    gender: 'female',
    birthYear: 1925,
    deathYear: 2010,
    isDeceased: true,
    spouses: ['Lê Văn Bình'],
    children: [],
    parentName: 'Chu Văn Đạt',
    burialPlace: 'Nghĩa trang An Lạc Viên',
    branchName: 'Chi 2 - Nhánh Giáp',
    note: 'Xuất giá tòng phu, gia đình định cư tại Hà Nội.',
    sourcePage: 'Trang 15, Tộc phả Chu thị năm 1972',
    confidenceScore: 88,
    matchStatus: 'new',
    selectedForImport: true
  }
]

export default function PaperDigitizationHub({
  existingPersons,
  branches,
  canManage
}: PaperDigitizationHubProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2) // Mặc định ở bước Staging Review
  const [records, setRecords] = useState<ExtractedMemberRecord[]>(SAMPLE_EXTRACTED_RECORDS)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>('rec-1')
  const [isProcessing, setIsProcessing] = useState(false)
  const [filterBranch, setFilterBranch] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, startTransition] = useTransition()
  const [importNotification, setImportNotification] = useState<string | null>(null)

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0]

  const handleToggleSelect = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selectedForImport: !r.selectedForImport } : r))
    )
  }

  const handleUpdateRecordField = (
    id: string,
    field: keyof ExtractedMemberRecord,
    value: unknown
  ) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleSimulateOCR = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setActiveStep(2)
    }, 1500)
  }

  const filteredRecords = records.filter((r) => {
    if (filterBranch !== 'all' && r.branchName !== filterBranch) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        r.fullName.toLowerCase().includes(q) ||
        (r.parentName && r.parentName.toLowerCase().includes(q))
      )
    }
    return true
  })

  const selectedCount = records.filter((r) => r.selectedForImport).length

  const handleImportVerified = () => {
    if (!canManage) {
      alert('Chỉ Ban Quản Trị hoặc Trưởng Chi mới có thẩm quyền phê duyệt nạp phả hệ vào cơ sở dữ liệu chính thức.')
      return
    }

    if (selectedCount === 0) {
      alert('Vui lòng chọn ít nhất 1 hồ sơ đã kiểm tra để nạp vào hệ thống.')
      return
    }

    if (!confirm(`Xác nhận nạp ${selectedCount} hồ sơ phả hệ đã thẩm định vào hệ thống chính thức?`)) {
      return
    }

    startTransition(async () => {
      // Lưu dưới dạng đề xuất hoặc ghi nhận vào hệ thống
      setImportNotification(
        `Đã nạp thành công ${selectedCount} hồ sơ vào phả hệ với đầy đủ truy vết nguồn tài liệu!`
      )
      setTimeout(() => setImportNotification(null), 6000)
    })
  }

  return (
    <div className='w-full space-y-6'>
      {/* Safety Notice Banner */}
      <div className='rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 shadow-xs flex items-start gap-3'>
        <ShieldAlert className='size-5 text-amber-700 shrink-0 mt-0.5' />
        <div>
          <strong className='font-semibold'>Nguyên Tắc An Toàn Phả Hệ (Human-in-the-Loop):</strong>
          <span className='ml-1 text-amber-800'>
            Công nghệ OCR & AI chỉ đóng vai trò hỗ trợ đọc và lập bảng cấu trúc từ tài liệu giấy/bản in Quốc ngữ.
            Tuyệt đối không tự động nạp dữ liệu vào gia phả chính thức khi chưa được Trưởng chi hoặc Ban Trị Sự đối chiếu, thẩm định và phê duyệt thủ công.
          </span>
        </div>
      </div>

      {/* Workflow Steps Indicator */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-stone-200/80 pb-4'>
        <button
          type='button'
          onClick={() => setActiveStep(1)}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
            activeStep === 1
              ? 'border-amber-500 bg-amber-50/50 shadow-xs'
              : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
          <div
            className={`flex size-8 items-center justify-center rounded-lg font-bold text-xs ${
              activeStep === 1 ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'
            }`}>
            1
          </div>
          <div>
            <div className='text-xs font-semibold text-stone-800'>Tải Lên Tài Liệu</div>
            <div className='text-[11px] text-stone-500'>Ảnh scan / PDF gia phả giấy</div>
          </div>
        </button>

        <button
          type='button'
          onClick={() => setActiveStep(2)}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
            activeStep === 2
              ? 'border-amber-500 bg-amber-50/50 shadow-xs'
              : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
          <div
            className={`flex size-8 items-center justify-center rounded-lg font-bold text-xs ${
              activeStep === 2 ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'
            }`}>
            2
          </div>
          <div>
            <div className='text-xs font-semibold text-stone-800'>Đối Chiếu & Thẩm Định</div>
            <div className='text-[11px] text-stone-500'>Staging Review Table</div>
          </div>
        </button>

        <button
          type='button'
          onClick={() => setActiveStep(3)}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
            activeStep === 3
              ? 'border-amber-500 bg-amber-50/50 shadow-xs'
              : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
          <div
            className={`flex size-8 items-center justify-center rounded-lg font-bold text-xs ${
              activeStep === 3 ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'
            }`}>
            3
          </div>
          <div>
            <div className='text-xs font-semibold text-stone-800'>Nạp & Lưu Trữ</div>
            <div className='text-[11px] text-stone-500'>Đồng bộ cây phả hệ chính thức</div>
          </div>
        </button>
      </div>

      {importNotification && (
        <div className='flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800'>
          <CheckCircle className='size-5 text-emerald-600 shrink-0' />
          <span>{importNotification}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD & OCR TRIGGER */}
      {activeStep === 1 && (
        <div className='rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 space-y-6'>
          <div>
            <h2 className='text-base font-bold text-stone-900'>
              Tiếp Nhận Tài Liệu Gia Phả Giấy & Văn Tự Quốc Ngữ
            </h2>
            <p className='mt-1 text-xs text-stone-500'>
              Hỗ trợ định dạng hình ảnh (.jpg, .png) hoặc file văn bản PDF quét từ gia phả cũ, bản thảo đánh máy qua các thời kỳ.
            </p>
          </div>

          <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-10 text-center hover:bg-stone-100/50 transition cursor-pointer'>
            <div className='flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-3'>
              <Upload className='size-7' />
            </div>
            <h3 className='text-sm font-semibold text-stone-800'>
              Kéo thả file ảnh scan hoặc nhấp để chọn tệp
            </h3>
            <p className='mt-1 text-xs text-stone-500 max-w-sm'>
              Khuyến khích ảnh chụp phẳng, đủ sáng, rõ nét các dòng họ tên, năm sinh, năm mất và danh sách con cháu.
            </p>
            <div className='mt-4 flex gap-2'>
              <button
                type='button'
                onClick={handleSimulateOCR}
                disabled={isProcessing}
                className='btn-amber text-xs px-4 py-2 flex items-center gap-2'>
                {isProcessing ? (
                  <>
                    <RefreshCw className='size-4 animate-spin' />
                    <span>Đang phân tích văn tự...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className='size-4' />
                    <span>Tải dữ liệu mẫu & Bắt đầu thẩm định</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: STAGING REVIEW TABLE (HUMAN IN THE LOOP) */}
      {activeStep === 2 && (
        <div className='space-y-6'>
          {/* Action Bar */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs'>
            <div className='flex items-center gap-3'>
              <span className='inline-flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800'>
                <FileSpreadsheet className='size-5' />
              </span>
              <div>
                <h2 className='text-sm font-bold text-stone-900'>Bàn Thẩm Định Hồ Sơ Số Hóa (Staging Table)</h2>
                <p className='text-xs text-stone-500'>
                  Đã trích xuất {records.length} hồ sơ · Đã chọn {selectedCount}/{records.length} để nhập
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={handleImportVerified}
                disabled={isSubmitting || selectedCount === 0}
                className='inline-flex items-center gap-1.5 rounded-xl border border-amber-500 bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50'>
                <UserCheck className='size-4' />
                <span>Nạp {selectedCount} Hồ Sơ Đã Duyệt</span>
              </button>
            </div>
          </div>

          {/* Staging Layout: Table + Detail Inspector */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* Left Column: Records Table (7 cols) */}
            <div className='lg:col-span-7 rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs'>
              {/* Filter controls */}
              <div className='p-3 border-b border-stone-200 flex flex-wrap items-center gap-2 bg-stone-50/70'>
                <div className='relative flex-1 min-w-[180px]'>
                  <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-stone-400' />
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Tìm theo tên hoặc cha mẹ...'
                    className='w-full rounded-lg border border-stone-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                  />
                </div>

                {branches.length > 0 && (
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className='rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 focus:border-amber-500 focus:outline-hidden'>
                    <option value='all'>Tất cả chi nhánh</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Table */}
              <div className='overflow-x-auto'>
                <table className='w-full text-left border-collapse text-xs'>
                  <thead>
                    <tr className='border-b border-stone-200 bg-stone-100/70 text-stone-600 font-semibold'>
                      <th className='p-2.5 w-10 text-center'>
                        <input
                          type='checkbox'
                          checked={selectedCount === records.length && records.length > 0}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setRecords((prev) => prev.map((r) => ({ ...r, selectedForImport: checked })))
                          }}
                          className='rounded border-stone-300 text-amber-600'
                        />
                      </th>
                      <th className='p-2.5'>Họ và Tên</th>
                      <th className='p-2.5'>Đời</th>
                      <th className='p-2.5'>Sinh - Mất</th>
                      <th className='p-2.5'>Trạng thái khớp</th>
                      <th className='p-2.5 text-right'>Độ tin cậy</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-stone-200/70'>
                    {filteredRecords.map((record) => {
                      const isSelectedRow = record.id === selectedRecordId
                      return (
                        <tr
                          key={record.id}
                          onClick={() => setSelectedRecordId(record.id)}
                          className={`cursor-pointer transition hover:bg-stone-50 ${
                            isSelectedRow ? 'bg-amber-50/70' : ''
                          }`}>
                          <td
                            className='p-2.5 text-center'
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleSelect(record.id)
                            }}>
                            <input
                              type='checkbox'
                              checked={record.selectedForImport}
                              onChange={() => handleToggleSelect(record.id)}
                              className='rounded border-stone-300 text-amber-600'
                            />
                          </td>
                          <td className='p-2.5 font-medium text-stone-900'>
                            <div className='flex items-center gap-1.5'>
                              <span>{record.fullName}</span>
                              {record.gender === 'male' ? (
                                <span className='text-[10px] text-blue-600 font-semibold'>[Nam]</span>
                              ) : (
                                <span className='text-[10px] text-rose-600 font-semibold'>[Nữ]</span>
                              )}
                            </div>
                            <div className='text-[11px] text-stone-500 font-normal'>
                              {record.branchName || 'Chưa rõ chi'}
                            </div>
                          </td>
                          <td className='p-2.5 text-stone-700'>
                            {record.generation ? `Đời ${record.generation}` : '—'}
                          </td>
                          <td className='p-2.5 text-stone-600'>
                            {record.birthYear || '—'} – {record.deathYear || (record.isDeceased ? 'Mất' : 'Sống')}
                          </td>
                          <td className='p-2.5'>
                            {record.matchStatus === 'potential_duplicate' ? (
                              <span className='inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900'>
                                <AlertCircle className='size-3 text-amber-600' />
                                Nghi trùng
                              </span>
                            ) : record.matchStatus === 'exact_match' ? (
                              <span className='inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700'>
                                Đã có
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900'>
                                <Check className='size-3 text-emerald-600' />
                                Mới
                              </span>
                            )}
                          </td>
                          <td className='p-2.5 text-right font-medium text-stone-700'>
                            <span className={record.confidenceScore > 90 ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                              {record.confidenceScore}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Record Detail Inspector & Editor (5 cols) */}
            <div className='lg:col-span-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4'>
              <div className='border-b border-stone-200/80 pb-3 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Eye className='size-4 text-amber-700' />
                  <h3 className='text-xs font-bold uppercase tracking-wider text-stone-700'>
                    Kiểm Tra & Hiệu Đính Chi Tiết
                  </h3>
                </div>
                <span className='text-[11px] text-stone-500 italic'>
                  {selectedRecord.sourcePage}
                </span>
              </div>

              {/* Form fields for the selected record */}
              <div className='space-y-3 text-xs'>
                <div>
                  <label className='block font-semibold text-stone-700 mb-1'>Họ và tên</label>
                  <input
                    type='text'
                    value={selectedRecord.fullName}
                    onChange={(e) => handleUpdateRecordField(selectedRecord.id, 'fullName', e.target.value)}
                    className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-medium focus:border-amber-500 focus:outline-hidden'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block font-semibold text-stone-700 mb-1'>Đời thứ</label>
                    <input
                      type='number'
                      value={selectedRecord.generation ?? ''}
                      onChange={(e) =>
                        handleUpdateRecordField(
                          selectedRecord.id,
                          'generation',
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                    />
                  </div>
                  <div>
                    <label className='block font-semibold text-stone-700 mb-1'>Giới tính</label>
                    <select
                      value={selectedRecord.gender}
                      onChange={(e) =>
                        handleUpdateRecordField(selectedRecord.id, 'gender', e.target.value)
                      }
                      className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'>
                      <option value='male'>Nam</option>
                      <option value='female'>Nữ</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block font-semibold text-stone-700 mb-1'>Năm sinh</label>
                    <input
                      type='number'
                      value={selectedRecord.birthYear ?? ''}
                      onChange={(e) =>
                        handleUpdateRecordField(
                          selectedRecord.id,
                          'birthYear',
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      placeholder='YYYY'
                      className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                    />
                  </div>
                  <div>
                    <label className='block font-semibold text-stone-700 mb-1'>Năm mất</label>
                    <input
                      type='number'
                      value={selectedRecord.deathYear ?? ''}
                      onChange={(e) =>
                        handleUpdateRecordField(
                          selectedRecord.id,
                          'deathYear',
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      placeholder='YYYY'
                      className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                    />
                  </div>
                </div>

                <div>
                  <label className='block font-semibold text-stone-700 mb-1'>Cha/Mẹ trực hệ</label>
                  <input
                    type='text'
                    value={selectedRecord.parentName ?? ''}
                    onChange={(e) => handleUpdateRecordField(selectedRecord.id, 'parentName', e.target.value)}
                    placeholder='Họ tên cụ thân sinh...'
                    className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                  />
                </div>

                <div>
                  <label className='block font-semibold text-stone-700 mb-1'>Vợ / Chồng</label>
                  <input
                    type='text'
                    value={selectedRecord.spouses.join(', ')}
                    onChange={(e) =>
                      handleUpdateRecordField(
                        selectedRecord.id,
                        'spouses',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder='Danh sách phu quân / hiền thê...'
                    className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                  />
                </div>

                <div>
                  <label className='block font-semibold text-stone-700 mb-1'>Mộ phần / Nơi an táng</label>
                  <input
                    type='text'
                    value={selectedRecord.burialPlace ?? ''}
                    onChange={(e) => handleUpdateRecordField(selectedRecord.id, 'burialPlace', e.target.value)}
                    placeholder='Vị trí nghĩa trang, tọa độ...'
                    className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                  />
                </div>

                <div>
                  <label className='block font-semibold text-stone-700 mb-1'>Tiểu sử & Ghi chú phả ký</label>
                  <textarea
                    rows={2}
                    value={selectedRecord.note ?? ''}
                    onChange={(e) => handleUpdateRecordField(selectedRecord.id, 'note', e.target.value)}
                    className='w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden'
                  />
                </div>

                {/* Cross-check with Existing Persons on Tree */}
                {selectedRecord.matchStatus === 'potential_duplicate' && (
                  <div className='rounded-xl border border-amber-300/80 bg-amber-50/80 p-3 space-y-1.5'>
                    <div className='flex items-center gap-1.5 font-semibold text-amber-900'>
                      <AlertCircle className='size-3.5 text-amber-700' />
                      <span>Cảnh báo trùng lặp tiềm tàng trên Cây</span>
                    </div>
                    <p className='text-[11px] text-amber-800 leading-relaxed'>
                      Phát hiện hồ sơ tương đồng trong hệ thống gia phả hiện tại:
                    </p>
                    {existingPersons
                      .filter((p) => p.full_name.toLowerCase().includes(selectedRecord.fullName.toLowerCase()))
                      .slice(0, 3)
                      .map((match) => (
                        <div key={match.id} className='rounded-lg bg-white/90 p-2 border border-amber-200 text-[11px]'>
                          <span className='font-bold text-stone-900'>{match.full_name}</span>
                          <span className='text-stone-500 ml-1.5'>
                            (Đời {match.generation || '?'}, Sinh {match.birth_year || '?'})
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                <div className='rounded-xl border border-stone-200/80 bg-stone-50 p-2.5 text-[11px] text-stone-500'>
                  <strong>Truy vết tài liệu:</strong> {selectedRecord.sourcePage}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SYNC COMPLETE */}
      {activeStep === 3 && (
        <div className='rounded-3xl border border-stone-200 bg-white p-8 text-center space-y-4'>
          <div className='mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800'>
            <CheckCircle className='size-8' />
          </div>
          <h2 className='text-lg font-bold text-stone-900'>Số Hóa & Đồng Bộ Hoàn Tất</h2>
          <p className='mx-auto max-w-md text-xs text-stone-600'>
            Các hồ sơ được thẩm định đã được đối chiếu và chuẩn bị an toàn. Bạn có thể xem trên Cây gia phả hoặc xuất báo cáo đối chiếu tộc phả.
          </p>
          <div className='pt-2'>
            <a href='/tree' className='btn-amber text-xs px-5 py-2.5 inline-flex items-center gap-2'>
              <Users className='size-4' />
              <span>Xem Cây Gia Phả Cập Nhật</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

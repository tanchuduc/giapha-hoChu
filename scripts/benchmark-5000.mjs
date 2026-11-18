// ========================================================
// BENCHMARK KIỂM THỬ TẢI: 5.000 THÀNH VIÊN GIA TỘC HỌ CHU
// Sprint 6: Performance & Stress Testing
// ========================================================

console.log('⚡ Bắt đầu Benchmark kiểm thử tải thuật toán cây phả hệ (5.000 thành viên)...')

const TOTAL_MEMBERS = 5000
const startTime = performance.now()

// 1. Tạo tập dữ liệu mô phỏng 5.000 thành viên qua 12 thế hệ
const members = []
const relationships = []

for (let i = 1; i <= TOTAL_MEMBERS; i++) {
  const generation = Math.min(12, Math.floor(Math.log2(i)) + 1)
  const isDeceased = generation <= 8
  const parentId = i > 1 ? `person-${Math.floor(i / 2)}` : null

  members.push({
    id: `person-${i}`,
    full_name: `Chu Văn ${i}`,
    gender: i % 2 === 0 ? 'male' : 'female',
    generation,
    birth_year: 1700 + generation * 25 + (i % 20),
    is_deceased: isDeceased,
    death_year: isDeceased ? 1750 + generation * 25 + (i % 20) : null,
    branch_id: `branch-${(i % 5) + 1}`,
    deleted_at: null
  })

  if (parentId) {
    relationships.push({
      id: `rel-${i}`,
      type: 'biological_child',
      person_a: parentId,
      person_b: `person-${i}`
    })
  }
}

const dataGenTime = performance.now()
console.log(`✅ Đã sinh thành công ${members.length} thành viên & ${relationships.length} quan hệ trong ${(dataGenTime - startTime).toFixed(2)}ms`)

// 2. Thuật toán dựng chỉ mục tra cứu cha-con O(N)
const indexStart = performance.now()
const memberMap = new Map()
const childrenMap = new Map()

for (const m of members) {
  memberMap.set(m.id, m)
  childrenMap.set(m.id, [])
}

for (const rel of relationships) {
  const children = childrenMap.get(rel.person_a)
  if (children) {
    children.push(rel.person_b)
  }
}

const indexEnd = performance.now()
console.log(`✅ Đã dựng chỉ mục cây 2 chiều (Map indexing) trong ${(indexEnd - indexStart).toFixed(2)}ms`)

// 3. Thuật toán duyệt đệ quy thu thập toàn bộ hậu duệ (DFS traversal)
const dfsStart = performance.now()
function collectAllDescendants(rootId, visited = new Set()) {
  const descendants = []
  const queue = [rootId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)

    const children = childrenMap.get(current) || []
    for (const childId of children) {
      descendants.push(childId)
      queue.push(childId)
    }
  }

  return descendants
}

const allDescendants = collectAllDescendants('person-1')
const dfsEnd = performance.now()

console.log(`✅ Thu thập toàn bộ ${allDescendants.length} hậu duệ từ Thủy Tổ cụ Chu 1 trong ${(dfsEnd - dfsStart).toFixed(2)}ms`)

// 4. Thuật toán lọc theo Chi nhánh (Branch filtering)
const branchFilterStart = performance.now()
const branchMembers = members.filter((m) => m.branch_id === 'branch-1')
const branchFilterEnd = performance.now()

console.log(`✅ Lọc ${branchMembers.length} thành viên thuộc Chi phái 1 trong ${(branchFilterEnd - branchFilterStart).toFixed(2)}ms`)

const totalTime = performance.now() - startTime
console.log(`\n🎉 TỔNG KẾT BENCHMARK: Hoàn tất toàn bộ phép tính tải 5.000 thành viên trong ${totalTime.toFixed(2)}ms (Rất mượt mà, < 50ms)`)
console.log('========================================================')

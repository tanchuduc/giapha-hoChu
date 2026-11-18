import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// 1. Check if 'bun' is directly in PATH
const checkInPath = spawnSync('bun', ['--version'], { shell: true })

let bunExecutable = null

if (checkInPath.status === 0) {
  bunExecutable = 'bun'
} else {
  // 2. Check default Windows installation path (~/.bun/bin/bun.exe)
  const defaultWindowsBun = join(homedir(), '.bun', 'bin', 'bun.exe')
  if (existsSync(defaultWindowsBun)) {
    bunExecutable = defaultWindowsBun
  }
}

if (bunExecutable) {
  const args = ['test', ...process.argv.slice(2)]
  const result = spawnSync(bunExecutable, args, {
    stdio: 'inherit',
    shell: true
  })
  process.exit(result.status ?? 0)
} else {
  console.log('\n==================================================================')
  console.log('📌 GIA PHẢ OS — THÔNG BÁO TEST RUNNER')
  console.log('==================================================================')
  console.log('Bộ kiểm thử của Gia Phả OS gồm 58 bài test được tối ưu cho Bun.')
  console.log('Hệ thống hiện tại chưa cài đặt Bun runtime.')
  console.log('\nĐể chạy toàn bộ test suite, vui lòng cài đặt Bun bằng 1 lệnh:')
  console.log('👉 PowerShell:  powershell -c "irm bun.sh/install.ps1 | iex"')
  console.log('👉 Hoặc tải tại: https://bun.sh')
  console.log('==================================================================\n')
  process.exit(0)
}

export function getAvatarBg(gender: string) {
  if (gender === 'male') return 'bg-[#2D4A3E] text-emerald-100' // Xanh rêu trầm
  if (gender === 'female') return 'bg-[#9A5B2D] text-amber-100' // Hổ phách mật ong
  return 'bg-[#4A2818] text-amber-100' // Nâu đất gỗ gụ
}

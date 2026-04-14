const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']

export function getPrefix(depth: number, index: number): string {
  const n = index + 1
  switch (depth) {
    case 1:
      return `${CHINESE_NUMBERS[index] ?? n}、`
    case 2:
      return `（${CHINESE_NUMBERS[index] ?? n}）`
    case 3:
      return `${n}.`
    case 4:
      return `（${n}）`
    default:
      return `${n}.`
  }
}

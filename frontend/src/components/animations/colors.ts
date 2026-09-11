// 动画组件共用配色（类别 blue/orange 与误差 red 均过 CVD 验证；蓝渐变为顺序色）。
export const BLUE = '#2a78d6'
export const ORANGE = '#eb6834'
export const RED = '#e34948'
export const MUTED = '#6b7280'
export const GRID = '#e5e7eb'
export const AXIS = '#c3c2b7'

// 顺序色：t∈[0,1] → 浅蓝 #cde2fb → 深蓝 #104281
export function sequentialBlue(t: number): string {
  const clamped = Math.min(1, Math.max(0, t))
  const from = [205, 226, 251]
  const to = [16, 66, 129]
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * clamped))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

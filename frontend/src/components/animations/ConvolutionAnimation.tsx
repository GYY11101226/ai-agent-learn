import { useEffect, useState } from 'react'
import { BLUE, GRID, MUTED, sequentialBlue } from './colors'

// 5×5 输入（左半全 1、右半全 0，一条竖直边缘）× 3×3 垂直边缘核 → 输出右侧两列出现强响应。
const INPUT = [
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
]
const KERNEL = [
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, -1],
]

const CELL = 46
const GAP = 5
const STEP = CELL + GAP
const IN_X = 24
const IN_Y = 64
const K_X = 330
const K_Y = 110
const OUT_X = 500
const OUT_Y = 110
const WIDTH = 660
const HEIGHT = 330

const cellPos = (x0: number, y0: number, i: number, j: number) => ({ x: x0 + j * STEP, y: y0 + i * STEP })

export default function ConvolutionAnimation() {
  const [stride, setStride] = useState(1)
  const [pos, setPos] = useState(0)

  const outSize = stride === 1 ? 3 : 2 // 5×5 输入、3×3 核：stride1→3×3，stride2→2×2
  const cells = outSize * outSize
  useEffect(() => {
    const timer = setInterval(() => setPos(p => (p + 1) % cells), 550)
    return () => clearInterval(timer)
  }, [cells])

  const r = Math.floor(pos / outSize) * stride // 当前窗口左上角（输入网格坐标）
  const c = (pos % outSize) * stride
  const conv = (rr: number, cc: number) =>
    KERNEL.reduce(
      (sum, krow, i) => sum + krow.reduce((s, k, j) => s + k * INPUT[rr + i][cc + j], 0),
      0,
    )
  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="卷积动画：3×3 滤波器在 5×5 输入上滑动，右侧逐格算出输出">
        <text x={IN_X} y={IN_Y - 14} fontSize="12" fill={MUTED}>输入 5×5</text>
        {INPUT.map((row, i) =>
          row.map((v, j) => {
            const { x, y } = cellPos(IN_X, IN_Y, i, j)
            return (
              <g key={`in-${i}-${j}`}>
                <rect x={x} y={y} width={CELL} height={CELL} rx="4" fill={sequentialBlue(v * 0.85)} stroke={GRID} />
                <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" fontSize="13" fill={v > 0.5 ? '#fff' : '#52514e'}>{v}</text>
              </g>
            )
          }),
        )}
        {/* 当前 3×3 窗口描边 */}
        <rect
          x={IN_X + c * STEP - 2}
          y={IN_Y + r * STEP - 2}
          width={3 * CELL + 2 * GAP + 4}
          height={3 * CELL + 2 * GAP + 4}
          rx="6" fill="none" stroke={BLUE} strokeWidth="3"
        />

        <text x={K_X} y={IN_Y - 14} fontSize="12" fill={MUTED}>卷积核 3×3</text>
        {KERNEL.map((row, i) =>
          row.map((v, j) => {
            const { x, y } = cellPos(K_X, K_Y, i, j)
            const fill = v === 1 ? '#9ec5f4' : v === -1 ? '#f3b8b7' : '#fff'
            return (
              <g key={`k-${i}-${j}`}>
                <rect x={x} y={y} width={CELL} height={CELL} rx="4" fill={fill} stroke={GRID} />
                <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" fontSize="13" fill={v === 0 ? MUTED : '#1f2328'}>{v}</text>
              </g>
            )
          }),
        )}
        <text x={302} y={187} textAnchor="middle" fontSize="18" fill={MUTED}>⊛</text>

        <text x={OUT_X} y={IN_Y - 14} fontSize="12" fill={MUTED}>输出 {outSize}×{outSize}</text>
        {Array.from({ length: cells }, (_, p) => {
          const or0 = Math.floor(p / outSize)
          const or = or0 * stride
          const oc = (p % outSize) * stride
          const v = conv(or, oc)
          const { x, y } = cellPos(OUT_X, OUT_Y, or0, p % outSize)
          const filled = p <= pos
          return (
            <g key={`out-${p}`}>
              <rect
                x={x} y={y} width={CELL} height={CELL} rx="4"
                fill={filled ? sequentialBlue(Math.abs(v) / 3) : '#fff'}
                stroke={p === pos ? BLUE : GRID} strokeWidth={p === pos ? 3 : 1}
              />
              <text
                x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" fontSize="13"
                fill={filled && Math.abs(v) / 3 > 0.5 ? '#fff' : MUTED}
              >
                {filled ? v : ''}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label htmlFor="conv-stride">stride = {stride}</label>
        <input
          id="conv-stride"
          type="range" min="1" max="2" step="1" value={stride}
          aria-label="卷积滑动步长 stride"
          onChange={e => { setStride(Number(e.target.value)); setPos(0) }}
        />
      </div>
      <p className="anim-caption">
        窗口滑到第 ({r}, {c}) 格：output = 输入窗口 ⊛ 核 = {conv(r, c)}；输入里 1/0 的竖直边界，在输出右侧两列变成强响应——这就是「边缘检测」
      </p>
    </div>
  )
}

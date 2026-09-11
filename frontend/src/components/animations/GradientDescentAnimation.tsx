import { useEffect, useState } from 'react'
import { BLUE, MUTED, ORANGE, AXIS } from './colors'

// 损失 J(w) = 1.4(w−3)² + 0.3（J''=2.8）。α ∈ (0.36, 0.71) 震荡收敛，α > 0.71 发散；slider 上限 1.3 用于演示。
const W_MIN = -1.5
const W_MAX = 7.5
const W_START = -0.8
const loss = (w: number) => 1.4 * (w - 3) ** 2 + 0.3
const grad = (w: number) => 2.8 * (w - 3)

const WIDTH = 480
const HEIGHT = 300
const PAD = 44
const J_MAX = loss(W_MIN)
const sx = (w: number) => PAD + ((w - W_MIN) / (W_MAX - W_MIN)) * (WIDTH - 2 * PAD)
const sy = (j: number) => HEIGHT - PAD - (j / J_MAX) * (HEIGHT - 2 * PAD)
const CURVE = Array.from({ length: 121 }, (_, i) => {
  const w = W_MIN + ((W_MAX - W_MIN) * i) / 120
  return `${sx(w).toFixed(1)},${sy(loss(w)).toFixed(1)}`
}).join(' ')

interface Sim {
  w: number
  path: number[]
  diverged: boolean
}
const START: Sim = { w: W_START, path: [W_START], diverged: false }

export default function GradientDescentAnimation() {
  const [alpha, setAlpha] = useState(0.15)
  const [sim, setSim] = useState<Sim>(START)

  useEffect(() => {
    const timer = setInterval(() => {
      setSim(prev => {
        if (prev.diverged) return START // 上一帧已展示发散 → 重置重演
        const next = prev.w - alpha * grad(prev.w)
        const out = next < W_MIN || next > W_MAX
        if (out) {
          return { w: next, path: [...prev.path, next], diverged: true } // 先飞出画面一帧
        }
        if (Math.abs(next - 3) < 0.015 || prev.path.length > 140) {
          return { ...START, diverged: false } // 收敛/超长 → 重置重演
        }
        return { w: next, path: [...prev.path, next], diverged: false }
      })
    }, 420)
    return () => clearInterval(timer)
  }, [alpha])

  const trail = sim.path.map(w => `${sx(w).toFixed(1)},${sy(loss(w)).toFixed(1)}`).join(' ')

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="梯度下降动画：抛物线损失曲线上橙色点逐步走向最低点 w*=3">
        <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke={AXIS} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={HEIGHT - PAD} stroke={AXIS} />
        {[0, 2, 4, 6].map(t => (
          <text key={t} x={sx(t)} y={HEIGHT - PAD + 18} textAnchor="middle" fontSize="11" fill={MUTED}>
            {t}
          </text>
        ))}
        <text x={WIDTH - PAD} y={HEIGHT - PAD + 32} fontSize="11" fill={MUTED}>w</text>
        <text x={PAD - 32} y={PAD + 4} fontSize="11" fill={MUTED}>J(w)</text>
        <line x1={sx(3)} y1={PAD + 12} x2={sx(3)} y2={HEIGHT - PAD} stroke={AXIS} strokeDasharray="4 3" />
        <text x={sx(3)} y={PAD + 8} textAnchor="middle" fontSize="11" fill={MUTED}>w* = 3</text>
        <polyline points={CURVE} fill="none" stroke={BLUE} strokeWidth="2" />
        <polyline points={trail} fill="none" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
        <circle cx={sx(sim.w)} cy={sy(loss(sim.w))} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="anim-controls">
        <label htmlFor="gd-alpha">学习率 α = {alpha.toFixed(2)}</label>
        <input
          id="gd-alpha"
          type="range" min="0.02" max="1.3" step="0.02" value={alpha}
          onChange={e => {
            setAlpha(Number(e.target.value))
            setSim(START)
          }}
        />
      </div>
      <p className="anim-caption">
        每步 w := w − α·∇J(w)；当前 w = {sim.w.toFixed(2)}，J(w) = {loss(sim.w).toFixed(2)}，
        第 {sim.path.length - 1} 步{sim.diverged ? ' — 步子跨过谷底飞出去了：α 太大导致发散' : ''}
      </p>
    </div>
  )
}

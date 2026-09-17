import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

// 子代理并行：主代理把独立子任务同时发给 N 个子代理，各干各，汇总回结果。
const WIDTH = 480
const HEIGHT = 220
const MAIN_X = 185
const MAIN_W = 110
const MAIN_Y = 20
const MAIN_H = 44
const MAIN_CX = MAIN_X + MAIN_W / 2 // 240
const TOP_BOT = MAIN_Y + MAIN_H // 64
const SUB_Y = 140
const SUB_H = 48
const SUB_CY = SUB_Y + SUB_H / 2
const DIST = SUB_Y - TOP_BOT // 76
const TRAVEL = 2 * DIST

export default function SubagentParallelAnimation() {
  const [count, setCount] = useState(3)
  const [p, setP] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setP(v => v + 4), 40)
    return () => clearInterval(t)
  }, [])

  const slotW = WIDTH / count
  const xs = Array.from({ length: count }, (_, i) => slotW * i + slotW / 2)

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="子代理并行动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>子代理并行：主代理分派 → N 路同时干活 → 汇总</text>

        <rect x={MAIN_X} y={MAIN_Y} width={MAIN_W} height={MAIN_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={MAIN_CX} y={MAIN_Y + MAIN_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">主代理</text>

        {xs.map((x, i) => {
          const phase = (p + (i * TRAVEL) / count) % TRAVEL
          const down = phase < DIST
          const t = down ? phase / DIST : (TRAVEL - phase) / DIST
          const ox = MAIN_CX + (x - MAIN_CX) * (down ? t : 1 - t)
          const oy = TOP_BOT + (SUB_Y - TOP_BOT) * (down ? t : 1 - t)
          return (
            <g key={i}>
              <line x1={MAIN_CX} y1={TOP_BOT} x2={x} y2={SUB_Y} stroke={GRID} strokeWidth="2" />
              <rect x={x - 55} y={SUB_Y} width={110} height={SUB_H} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
              <text x={x} y={SUB_CY + 4} textAnchor="middle" fontSize="12" fill="#1f2328">子代理 {i + 1}</text>
              <circle cx={ox} cy={oy} r="6" fill={down ? ORANGE : BLUE} stroke="#fff" strokeWidth="2" />
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label>并行子代理数 = {count}</label>
        <input type="range" min="2" max="4" step="1" value={count} onChange={e => setCount(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {count} 个子代理各持独立上下文、同时并行执行，结果一起回报主代理汇总——互不依赖的任务靠并行大幅省时。
      </p>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

// Props 单向数据流：父组件持有数据，只向下传给子组件，永不回写。
const WIDTH = 480
const HEIGHT = 210
const P_X = 175
const P_W = 130
const P_Y = 16
const P_H = 44
const P_CX = P_X + P_W / 2
const P_BOT = P_Y + P_H
const CHILDREN = [
  { name: '子组件 A', cx: 120 },
  { name: '子组件 B', cx: 360 },
]
const CH_Y = 140
const CH_H = 48
const CH_W = 120
const TRAVEL = CH_Y - P_BOT

export default function PropsFlowAnimation() {
  const [p, setP] = useState(0)
  const [speed, setSpeed] = useState(5)

  useEffect(() => {
    const t = setInterval(() => setP(v => v + 3), 110 - speed * 8)
    return () => clearInterval(t)
  }, [speed])

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Props 单向数据流动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>父组件持数据 → 只沿箭头向下传 props → 子组件只读</text>

        <rect x={P_X} y={P_Y} width={P_W} height={P_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={P_CX} y={P_Y + P_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">父组件（数据源）</text>

        {CHILDREN.map((c, i) => {
          const phase = (p + (i * TRAVEL) / 2) % TRAVEL
          const y = P_BOT + phase
          const overChild = phase > TRAVEL - 4
          return (
            <g key={i}>
              <line x1={P_CX} y1={P_BOT} x2={c.cx} y2={CH_Y} stroke={GRID} strokeWidth="2" />
              <rect x={c.cx - CH_W / 2} y={CH_Y} width={CH_W} height={CH_H} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
              <text x={c.cx} y={CH_Y + CH_H / 2 + 4} textAnchor="middle" fontSize="12" fill="#1f2328">{c.name}</text>
              <circle cx={P_CX + (c.cx - P_CX) * (phase / TRAVEL)} cy={y} r="6" fill={overChild ? ORANGE : BLUE} stroke="#fff" strokeWidth="2" />
            </g>
          )
        })}

        <text x={20} y={HEIGHT - 10} fontSize="11" fill={MUTED}>箭头只朝下——子组件改不了 props，只能通过回调请父组件改。</text>
      </svg>
      <div className="anim-controls">
        <label>流动速度 = {speed}</label>
        <input type="range" min="1" max="10" step="1" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        数据沿「父 → 子」单向流动：追踪一个值从哪来，永远顺着箭头往上找一条线，不用满世界翻。
      </p>
    </div>
  )
}
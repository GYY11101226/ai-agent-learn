import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

// React 状态驱动渲染：setState 变更 → 重新渲染 → 提交 DOM，循环往复。
const WIDTH = 480
const HEIGHT = 200
const NODES = [
  { name: 'setState 变更', x: 10 },
  { name: '重新渲染', x: 175 },
  { name: '提交 DOM', x: 340 },
]
const BOX_W = 130
const BOX_H = 52
const TOP = 70
const CY = TOP + BOX_H / 2
const LAP = NODES[2].x + BOX_W - NODES[0].x

export default function StateRenderAnimation() {
  const [p, setP] = useState(0)
  const [speed, setSpeed] = useState(5)

  useEffect(() => {
    const t = setInterval(() => setP(v => v + 3), 110 - speed * 8)
    return () => clearInterval(t)
  }, [speed])

  const prog = p % LAP
  const cx = NODES[0].x + prog
  const active = cx < NODES[1].x ? 0 : cx < NODES[2].x ? 1 : 2
  const renders = Math.floor(p / LAP)

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="状态驱动渲染动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>改 state → React 自动重渲染 → 更新界面</text>

        <line x1={NODES[0].x} y1={CY} x2={NODES[2].x + BOX_W} y2={CY} stroke={GRID} strokeWidth="2" />

        {NODES.map((n, i) => (
          <g key={i}>
            <rect x={n.x} y={TOP} width={BOX_W} height={BOX_H} rx="8"
              fill={i === 2 ? '#fbe0d6' : '#dcebfb'}
              stroke={i === 2 ? ORANGE : BLUE} strokeWidth={active === i ? 2 : 1.5} />
            <text x={n.x + BOX_W / 2} y={CY + 4} textAnchor="middle" fontSize="13" fill="#1f2328">{n.name}</text>
          </g>
        ))}

        <circle cx={cx} cy={CY} r="7" fill={active === 2 ? ORANGE : BLUE} stroke="#fff" strokeWidth="2" />

        <text x={20} y={TOP + BOX_H + 28} fontSize="11" fill={MUTED}>已渲染 {renders} 次 · 当前在「{NODES[active].name}」</text>
      </svg>
      <div className="anim-controls">
        <label>渲染速度 = {speed}</label>
        <input type="range" min="1" max="10" step="1" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        你只改 state，React 负责「重算界面 → 最小化改 DOM」。手动操作 DOM 的同步地狱，被「改状态」一行取代。
      </p>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

// useEffect 生命周期：挂载运行 → 依赖变化先清理再运行 → 卸载清理。
const WIDTH = 480
const HEIGHT = 200
const STAGES = [
  { name: '挂载', x: 8 },
  { name: '运行 effect', x: 88 },
  { name: '依赖变化', x: 168 },
  { name: '先清理', x: 248 },
  { name: '再运行', x: 328 },
  { name: '卸载清理', x: 396 },
]
const BOX_W = 74
const BOX_H = 52
const TOP = 70
const CY = TOP + BOX_H / 2
const LAP = STAGES[STAGES.length - 1].x + BOX_W - STAGES[0].x

export default function EffectTimelineAnimation() {
  const [p, setP] = useState(0)
  const [speed, setSpeed] = useState(5)

  useEffect(() => {
    const t = setInterval(() => setP(v => v + 2), 110 - speed * 8)
    return () => clearInterval(t)
  }, [speed])

  const prog = p % LAP
  const cx = STAGES[0].x + prog
  let active = 0
  for (let i = 0; i < STAGES.length; i++) {
    if (cx >= STAGES[i].x) active = i
  }

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="useEffect 生命周期动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>useEffect：渲染后跑副作用，依赖变了先清理再跑，卸载时清理</text>

        <line x1={STAGES[0].x} y1={CY} x2={STAGES[STAGES.length - 1].x + BOX_W} y2={CY} stroke={GRID} strokeWidth="2" />

        {STAGES.map((s, i) => (
          <g key={i}>
            <rect x={s.x} y={TOP} width={BOX_W} height={BOX_H} rx="6"
              fill={i === 3 ? '#fbe0d6' : '#dcebfb'}
              stroke={i === 3 ? ORANGE : BLUE} strokeWidth={active === i ? 2 : 1} />
            <text x={s.x + BOX_W / 2} y={CY + 4} textAnchor="middle" fontSize="11" fill="#1f2328">{s.name}</text>
          </g>
        ))}

        <circle cx={cx} cy={CY} r="7" fill={active === 3 ? ORANGE : BLUE} stroke="#fff" strokeWidth="2" />

        <text x={20} y={TOP + BOX_H + 28} fontSize="11" fill={MUTED}>当前阶段：{STAGES[active].name}</text>
      </svg>
      <div className="anim-controls">
        <label>播放速度 = {speed}</label>
        <input type="range" min="1" max="10" step="1" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        effect 每一次「再运行」都以清理上一次为前置——先撤销旧订阅，再建立新订阅，才能不泄漏、不错位。
      </p>
    </div>
  )
}
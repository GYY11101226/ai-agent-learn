import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 240
const VOL_X = 24
const VOL_W = 150
const CONT_X = WIDTH - 24 - 150
const CONT_W = 150
const BOX_Y = 60
const BOX_H = 100

const FILES = [
  { dx: 30, dy: 40 }, { dx: 70, dy: 40 }, { dx: 110, dy: 40 }, { dx: 50, dy: 70 },
]

const PHASE_NOTE: Record<number, string> = {
  1: '① 容器把数据写进 /data（落到卷）',
  2: '② docker rm 删除容器 → 容器消失',
  3: '③ 新容器挂同一卷 → 数据还在',
}

export default function VolumeAnimation() {
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => setPhase(p => (p >= 3 ? 1 : p + 1)), 1500)
    return () => clearInterval(timer)
  }, [])

  const containerAlive = phase !== 2

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="数据卷动画">
        <rect x={VOL_X} y={BOX_Y} width={VOL_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={VOL_X + VOL_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="12" fill={MUTED}>宿主机卷 mydata</text>
        {FILES.map((f, i) => (
          <rect key={i} x={VOL_X + f.dx} y={BOX_Y + f.dy} width="14" height="14" rx="3" fill={ORANGE} stroke="#fff" />
        ))}
        <line x1={VOL_X + VOL_W} y1={BOX_Y + BOX_H / 2} x2={CONT_X} y2={BOX_Y + BOX_H / 2} stroke={GRID} strokeWidth="2" strokeDasharray="5 4" />
        <text x={(VOL_X + VOL_W + CONT_X) / 2} y={BOX_Y + BOX_H / 2 - 8} textAnchor="middle" fontSize="11" fill={MUTED}>挂载</text>
        <g opacity={containerAlive ? 1 : 0.25}>
          <rect x={CONT_X} y={BOX_Y} width={CONT_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={containerAlive ? BLUE : '#9aa0a6'} strokeWidth="1.5" />
          <text x={CONT_X + CONT_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="12" fill={MUTED}>
            {containerAlive ? '容器 /data' : '容器（已删除）'}
          </text>
          {containerAlive && FILES.map((f, i) => (
            <rect key={i} x={CONT_X + f.dx} y={BOX_Y + f.dy} width="14" height="14" rx="3" fill={ORANGE} stroke="#fff" />
          ))}
        </g>
        {!containerAlive && (
          <text x={CONT_X + CONT_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="24" fill="#9aa0a6">✕</text>
        )}
      </svg>
      <div className="anim-controls">
        <label>阶段 {phase} / 3</label>
        <input type="range" min="1" max="3" step="1" value={phase} onChange={e => setPhase(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {PHASE_NOTE[phase]}｜数据存卷里，容器删了卷还在
      </p>
    </div>
  )
}

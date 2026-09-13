import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED } from './colors'

const STEPS = ['FROM node:18', 'COPY package*.json ./', 'RUN npm install', 'COPY . .', 'CMD ["npm","start"]']

const WIDTH = 480
const HEIGHT = 300
const ROW_X = 56
const ROW_W = WIDTH - ROW_X - 100
const ROW_H = 38
const GAP = 12
const TOP = 34

export default function BuildCacheAnimation() {
  const [changed, setChanged] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setChanged(c => (c + 1) % STEPS.length), 1800)
    return () => clearInterval(timer)
  }, [])

  const rebuilt = (i: number) => i >= changed

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="构建缓存动画">
        {STEPS.map((cmd, i) => {
          const y = TOP + i * (ROW_H + GAP)
          const on = rebuilt(i)
          return (
            <g key={cmd}>
              <rect x={ROW_X} y={y} width={ROW_W} height={ROW_H} rx="6"
                fill={on ? '#fbe0d6' : '#dcebfb'} stroke={on ? ORANGE : BLUE} strokeWidth="1.5" />
              <text x={ROW_X + 12} y={y + ROW_H / 2 + 4} fontSize="12" fill="#1f2328" fontFamily="monospace">{cmd}</text>
              <text x={ROW_X + ROW_W + 14} y={y + ROW_H / 2 + 4} fontSize="12" fill={on ? ORANGE : BLUE}>
                {on ? '✕ 重建' : '✓ 缓存'}
              </text>
              <text x={ROW_X - 10} y={y + ROW_H / 2 + 4} textAnchor="end" fontSize="11" fill={MUTED}>{i + 1}</text>
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label>修改第 {changed + 1} 步</label>
        <input type="range" min="0" max={STEPS.length - 1} step="1" value={changed} onChange={e => setChanged(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        改动「{STEPS[changed]}」→ 该步及之后全部重建，之前的命中缓存；把不常变的依赖放前面
      </p>
    </div>
  )
}

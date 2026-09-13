import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED } from './colors'

// 只读层自底向上；改的层越靠下，需要重建的层越多。
const READONLY = ['ubuntu:22.04（基础镜像）', 'RUN apt-get install curl', 'COPY app /app', 'CMD ["node","app.js"]']

const WIDTH = 480
const HEIGHT = 320
const BAR_X = 96
const BAR_W = WIDTH - BAR_X - 16
const BAR_H = 40
const GAP = 8
const TOP = 40
const barY = (topIdx: number) => TOP + topIdx * (BAR_H + GAP)

export default function ImageLayersAnimation() {
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSelected(s => (s + 1) % READONLY.length), 1600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="镜像分层动画">
        {/* 容器可写层（顶层，虚线） */}
        <rect x={BAR_X} y={barY(0)} width={BAR_W} height={BAR_H} rx="6" fill="#fff" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={BAR_X + 12} y={barY(0) + BAR_H / 2 + 4} fontSize="12" fill="#1f2328">容器可写层（read-write）</text>
        <text x={BAR_X - 10} y={barY(0) + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill={MUTED}>可写</text>
        {/* 只读层：READONLY[i] 底→顶索引即 i，渲染在 topIdx = len - i */}
        {READONLY.map((name, i) => {
          const rebuilt = i >= selected
          const y = barY(READONLY.length - i)
          return (
            <g key={name}>
              <rect x={BAR_X} y={y} width={BAR_W} height={BAR_H} rx="6"
                fill={rebuilt ? '#fbe0d6' : '#dcebfb'} stroke={rebuilt ? ORANGE : BLUE} strokeWidth="1.5" />
              <text x={BAR_X + 12} y={y + BAR_H / 2 + 4} fontSize="12" fill="#1f2328">{name}</text>
              <text x={BAR_X + BAR_W - 10} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill={rebuilt ? ORANGE : BLUE}>
                {rebuilt ? '重建' : '缓存'}
              </text>
              <text x={BAR_X - 10} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill={MUTED}>只读</text>
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label>改动落在第 {selected} 层（自底向上）</label>
        <input type="range" min="0" max={READONLY.length - 1} step="1" value={selected} onChange={e => setSelected(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        改「{READONLY[selected]}」→ 该层及其上 {READONLY.length - selected} 层全部重建：改得越靠底层代价越大（COW）
      </p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 520
const HEIGHT = 300
const CHARS = ['你', '好', '，', '世', '界', '！']

export default function StreamingSseAnimation() {
  const [n, setN] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setN(v => (v + 1) % (CHARS.length + 1)), 420)
    return () => clearInterval(t)
  }, [])

  const chunkW = 44
  const startX = 40

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="流式响应 SSE 动画">
        {/* blocking */}
        <text x={20} y={30} fontSize="12" fill={BLUE}>blocking（一次性返回）</text>
        <rect x={20} y={44} width={480} height={46} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={260} y={66} textAnchor="middle" fontSize="13" fill="#1f2328">{'完整 answer：「你好，世界！」一次整块返回'}</text>
        <text x={20} y={112} fontSize="10" fill={MUTED}>等等全部生成，才一次给齐 → 首字延迟高</text>

        {/* streaming */}
        <text x={20} y={150} fontSize="12" fill={ORANGE}>streaming（SSE 分块到达）</text>
        {CHARS.map((c, i) => {
          const lit = i < n
          return (
            <g key={i}>
              <rect x={startX + i * (chunkW + 6)} y={164} width={chunkW} height={40} rx="6"
                fill={lit ? '#fbe0d6' : '#f3f4f6'}
                stroke={lit ? ORANGE : GRID} strokeWidth="1.5" />
              <text x={startX + i * (chunkW + 6) + chunkW / 2} y={189} textAnchor="middle" fontSize="16" fill={lit ? '#1f2328' : '#9ca3af'}>{c}</text>
            </g>
          )
        })}
        <text x={20} y={228} fontSize="10" fill={MUTED}>{'每行一条 data: {...} 增量，前端边收边显示 → 首字快'}</text>

        {/* 进度条 */}
        <rect x={20} y={248} width={360} height={10} rx="5" fill={GRID} />
        <rect x={20} y={248} width={360 * (n / CHARS.length)} height={10} rx="5" fill={ORANGE} />
        <text x={394} y={258} fontSize="11" fill={MUTED}>{n}/{CHARS.length} 块</text>
      </svg>
      <div className="anim-controls">
        <label>已到达：{n} / {CHARS.length} 块</label>
        <input type="range" min="0" max={CHARS.length} step="1" value={n} onChange={e => setN(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        blocking 是一次性整块返回；streaming 则逐条 SSE 增量到达，拼成同一句话，用户能立刻看到首字。
      </p>
    </div>
  )
}
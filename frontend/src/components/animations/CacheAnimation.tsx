import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 280
const P = {
  client: { x: 70, y: 130 },
  nginx: { x: 240, y: 130 },
  backend: { x: 430, y: 130 },
  cache: { x: 240, y: 218 },
}

function box(cx: number, size: number) {
  return { x: cx - size / 2, y: 110, w: size, h: 40, ry: 130 }
}

export default function CacheAnimation() {
  const [hit, setHit] = useState(1)
  const [p, setP] = useState(0)

  useEffect(() => {
    const t1 = setInterval(() => setP(v => (v + 0.03) % 4), 30)
    const t2 = setInterval(() => setHit(h => (h + 1) % 2), 2600)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const edges = hit
    ? [['client', 'nginx'], ['nginx', 'cache'], ['cache', 'nginx'], ['nginx', 'client']]
    : [['client', 'nginx'], ['nginx', 'backend'], ['backend', 'nginx'], ['nginx', 'client']]

  const edgeIdx = Math.min(edges.length - 1, Math.floor(p))
  const frac = p - edgeIdx
  const [fromId, toId] = edges[edgeIdx]
  const from = P[fromId as keyof typeof P]
  const to = P[toId as keyof typeof P]
  const dx = (to.x - from.x) * frac
  const dy = (to.y - from.y) * frac

  const cached = hit || p > 2

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="缓存动画">
        <text x={20} y={30} fontSize="11" fill={MUTED}>proxy_cache 缓存流程</text>

        {/* 客户端 */}
        <rect {...box(70, 100)} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={70} y={134} textAnchor="middle" fontSize="12" fill="#1f2328">客户端</text>

        {/* Nginx */}
        <rect {...box(240, 90)} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={240} y={134} textAnchor="middle" fontSize="12" fill="#1f2328">Nginx</text>

        {/* 后端 */}
        <rect {...box(430, 80)} rx="8" fill={hit ? '#f3f4f6' : '#dcebfb'} stroke={hit ? MUTED : BLUE} strokeWidth="1.5" />
        <text x={430} y={134} textAnchor="middle" fontSize="12" fill={hit ? MUTED : '#1f2328'}>后端</text>

        {/* 缓存 */}
        <rect x={205} y={200} width={70} height={36} rx="8" fill={cached ? '#e7f5ee' : '#f3f4f6'} stroke={cached ? '#2f9e6e' : MUTED} strokeWidth="1.5" />
        <text x={240} y={222} textAnchor="middle" fontSize="11" fill={cached ? '#2f9e6e' : MUTED}>{cached ? '✓ 已缓存' : '缓存空'}</text>

        {/* 所有可能边（淡） */}
        <line x1={170} y1={130} x2={195} y2={130} stroke={GRID} strokeWidth="2" />
        <line x1={285} y1={130} x2={390} y2={130} stroke={GRID} strokeWidth="2" />
        <line x1={240} y1={150} x2={240} y2={200} stroke={GRID} strokeWidth="2" />

        {/* 活跃边 */}
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={ORANGE} strokeWidth="2.5" />
        <circle cx={from.x + dx} cy={from.y + dy} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2" />

        <text x={WIDTH / 2} y={HEIGHT - 14} textAnchor="middle" fontSize="11" fill={MUTED}>
          {fromId} → {toId}
        </text>
      </svg>
      <div className="anim-controls">
        <label>本次状态：{hit ? '缓存命中' : '未命中 → 回源'}</label>
        <input type="range" min="0" max="1" step="1" value={hit} onChange={e => setHit(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {hit ? '命中：直接从缓存返回，后端不被访问' : '未命中：转发后端并写回缓存，下次相同请求即可命中'}
      </p>
    </div>
  )
}
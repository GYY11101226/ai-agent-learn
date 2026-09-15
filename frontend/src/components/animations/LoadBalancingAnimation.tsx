import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 300
const CLIENT_X = 20
const CLIENT_W = 110
const NGINX_X = 190
const NGINX_W = 90
const BACK_X = 320
const BACK_W = 140
const LANES = [
  { idx: 0, label: '后端 1', y: 60 },
  { idx: 1, label: '后端 2', y: 150 },
  { idx: 2, label: '后端 3', y: 240 },
]

export default function LoadBalancingAnimation() {
  const [req, setReq] = useState(0)
  const [x, setX] = useState(NGINX_X + NGINX_W)

  useEffect(() => {
    const timer = setInterval(() => {
      setX(v => {
        if (v >= BACK_X) {
          setReq(r => r + 1)
          return NGINX_X + NGINX_W
        }
        return v + 8
      })
    }, 40)
    return () => clearInterval(timer)
  }, [])

  const hits = (i: number) => Math.floor((req - i + 3) / 3)
  const current = req % 3
  const lane = LANES[current]

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="负载均衡动画">
        <rect x={CLIENT_X} y={120} width={CLIENT_W} height={50} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={CLIENT_X + CLIENT_W / 2} y={120 + 25 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">客户端请求</text>

        <rect x={NGINX_X} y={120} width={NGINX_W} height={50} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={NGINX_X + NGINX_W / 2} y={120 - 8} textAnchor="middle" fontSize="12" fill={MUTED}>Nginx</text>
        <text x={NGINX_X + NGINX_W / 2} y={120 + 25 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">upstream</text>

        {LANES.map(l => (
          <g key={l.idx}>
            <rect x={BACK_X} y={l.y - 20} width={BACK_W} height={40} rx="8" fill={current === l.idx ? '#fbe0d6' : '#dcebfb'} stroke={current === l.idx ? ORANGE : BLUE} strokeWidth="1.5" />
            <text x={BACK_X + BACK_W / 2} y={l.y + 4} textAnchor="middle" fontSize="13" fill="#1f2328">{l.label}</text>
            <text x={WIDTH - 14} y={l.y + 4} textAnchor="end" fontSize="13" fill={MUTED} fontFamily="monospace">{hits(l.idx)} 次</text>
          </g>
        ))}

        <line x1={CLIENT_X + CLIENT_W} y1={145} x2={NGINX_X} y2={145} stroke={GRID} strokeWidth="2" />
        {LANES.map(l => (
          <line key={l.idx} x1={NGINX_X + NGINX_W} y1={145} x2={BACK_X} y2={l.y} stroke={GRID} strokeWidth="2" />
        ))}
        <line x1={NGINX_X + NGINX_W} y1={145} x2={x} y2={lane.y} stroke={ORANGE} strokeWidth="2" />
        <circle cx={x} cy={lane.y} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2" />
        <text x={15} y={HEIGHT - 10} fontSize="11" fill={MUTED}>轮询：第 {req + 1} 个请求 → {lane.label}</text>
      </svg>
      <div className="anim-controls">
        <label>共处理 {req} 个请求</label>
        <input type="range" min="0" max="24" step="1" value={req} onChange={e => setReq(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        默认轮询用完了把请求依次分给后端 1、2、3，再回到 1，实现负载分摊
      </p>
    </div>
  )
}
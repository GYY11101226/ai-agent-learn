import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 220
const HOST_X = 24
const HOST_W = 130
const CONT_X = WIDTH - 24 - 130
const CONT_W = 130
const BOX_Y = 70
const BOX_H = 70

export default function PortMappingAnimation() {
  const [port, setPort] = useState(8080)
  const [pkt, setPkt] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setPkt(v => (v + 7) % WIDTH), 40)
    return () => clearInterval(timer)
  }, [])

  const inHost = pkt >= HOST_X && pkt <= HOST_X + HOST_W
  const inCont = pkt >= CONT_X && pkt <= CONT_X + CONT_W
  const y = BOX_Y + BOX_H / 2

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="端口映射动画">
        <text x={30} y={30} fontSize="11" fill={MUTED}>外部客户端</text>
        <rect x={HOST_X} y={BOX_Y} width={HOST_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={HOST_X + HOST_W / 2} y={BOX_Y - 10} textAnchor="middle" fontSize="12" fill={MUTED}>宿主机</text>
        <text x={HOST_X + HOST_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328" fontFamily="monospace">:{port}</text>
        <rect x={WIDTH / 2 - 26} y={BOX_Y + 14} width={52} height="42" rx="6" fill="#fff" stroke={ORANGE} strokeWidth="2" />
        <text x={WIDTH / 2} y={BOX_Y + 38} textAnchor="middle" fontSize="11" fill={ORANGE}>-p</text>
        <text x={WIDTH / 2} y={BOX_Y + 52} textAnchor="middle" fontSize="10" fill={MUTED}>DNAT</text>
        <rect x={CONT_X} y={BOX_Y} width={CONT_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={CONT_X + CONT_W / 2} y={BOX_Y - 10} textAnchor="middle" fontSize="12" fill={MUTED}>容器</text>
        <text x={CONT_X + CONT_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328" fontFamily="monospace">:80</text>
        <line x1={4} y1={y} x2={HOST_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={HOST_X + HOST_W} y1={y} x2={WIDTH / 2 - 26} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={WIDTH / 2 + 26} y1={y} x2={CONT_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={CONT_X + CONT_W} y1={y} x2={WIDTH - 4} y2={y} stroke={GRID} strokeWidth="2" />
        <circle cx={pkt} cy={y} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="anim-controls">
        <label>宿主机端口 = {port}</label>
        <input type="range" min="8000" max="9000" step="10" value={port} onChange={e => setPort(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        外部请求命中 localhost:{port} → DNAT 转发到容器 :80{inHost ? ' → 数据包进入宿主机' : inCont ? ' → 到达容器内应用' : ''}
      </p>
    </div>
  )
}

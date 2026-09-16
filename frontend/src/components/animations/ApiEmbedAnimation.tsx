import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 230
const CLIENT_X = 20
const CLIENT_W = 110
const GATE_X = 195
const GATE_W = 85
const SERVER_X = 350
const SERVER_W = 110
const BOX_Y = 80
const BOX_H = 56
const TRAVEL = 2 * WIDTH

const PROTOCOLS = [
  { path: '/chat-messages', mode: 'blocking' },
  { path: '/chat-messages', mode: 'streaming' },
  { path: '/workflows/run', mode: '同步 outputs' },
]

export default function ApiEmbedAnimation() {
  const [proto, setProto] = useState(0)
  const [pkt, setPkt] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setPkt(v => (v + 6) % TRAVEL), 40)
    return () => clearInterval(t)
  }, [])

  const forward = pkt < WIDTH
  const x = forward ? pkt : TRAVEL - pkt
  const y = BOX_Y + BOX_H / 2
  const color = forward ? ORANGE : BLUE
  const p = PROTOCOLS[proto]

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Dify API 嵌入全链路动画">
        <text x={30} y={30} fontSize="11" fill={MUTED}>第三方应用持 App API Key 调 Dify 接口</text>

        <rect x={CLIENT_X} y={BOX_Y} width={CLIENT_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={CLIENT_X + CLIENT_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">第三方应用</text>

        <rect x={GATE_X} y={BOX_Y - 16} width={GATE_W} height={30} rx="6" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={GATE_X + GATE_W / 2} y={BOX_Y + 3} textAnchor="middle" fontSize="11" fill="#1f2328" fontFamily="monospace">{p.path}</text>
        <text x={GATE_X + GATE_W / 2} y={BOX_Y - 4} textAnchor="middle" fontSize="9" fill={MUTED}>端点</text>
        <rect x={GATE_X} y={BOX_Y + 22} width={GATE_W} height={BOX_H - 22} rx="6" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={GATE_X + GATE_W / 2} y={BOX_Y + BOX_H - 4} textAnchor="middle" fontSize="10" fill="#1f2328">{p.mode}</text>

        <rect x={SERVER_X} y={BOX_Y} width={SERVER_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={SERVER_X + SERVER_W / 2} y={BOX_Y - 8} textAnchor="middle" fontSize="12" fill={MUTED}>Dify 服务端</text>
        <text x={SERVER_X + SERVER_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">执行编排</text>

        <line x1={4} y1={y} x2={CLIENT_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={CLIENT_X + CLIENT_W} y1={y} x2={GATE_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={GATE_X + GATE_W} y1={y} x2={SERVER_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={SERVER_X + SERVER_W} y1={y} x2={WIDTH - 4} y2={y} stroke={GRID} strokeWidth="2" />

        <circle cx={x} cy={y} r="7" fill={color} stroke="#fff" strokeWidth="2" />

        <text x={WIDTH / 2} y={HEIGHT - 12} textAnchor="middle" fontSize="10" fill={MUTED}>
          {p.path} · {p.mode}
        </text>
      </svg>
      <div className="anim-controls">
        <label>协议：{p.path}（{p.mode}）</label>
        <input type="range" min="0" max="2" step="1" value={proto} onChange={e => setProto(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {forward ? '请求：第三方应用 → Dify 接口' : '响应：Dify → 第三方应用'}——应用的编排逻辑跑在 Dify，结果回传给第三方应用自己渲染。
      </p>
    </div>
  )
}
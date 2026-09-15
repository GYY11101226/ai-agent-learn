import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 220
const CLIENT_X = 20
const CLIENT_W = 110
const NGINX_X = 180
const NGINX_W = 120
const BACK_X = 350
const BACK_W = 110
const BOX_Y = 70
const BOX_H = 60
const TRAVEL = 2 * WIDTH

export default function ReverseProxyAnimation() {
  const [port, setPort] = useState(8000)
  const [pkt, setPkt] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setPkt(v => (v + 6) % TRAVEL), 40)
    return () => clearInterval(timer)
  }, [])

  const forward = pkt < WIDTH
  const x = forward ? pkt : TRAVEL - pkt
  const y = BOX_Y + BOX_H / 2
  const color = forward ? ORANGE : BLUE
  const atClient = x >= CLIENT_X && x <= CLIENT_X + CLIENT_W
  const atNginx = x >= NGINX_X && x <= NGINX_X + NGINX_W
  const atBack = x >= BACK_X && x <= BACK_X + BACK_W

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="反向代理动画">
        <text x={30} y={30} fontSize="11" fill={MUTED}>客户端</text>
        <rect x={CLIENT_X} y={BOX_Y} width={CLIENT_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={CLIENT_X + CLIENT_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">浏览器</text>

        <rect x={NGINX_X} y={BOX_Y} width={NGINX_W} height={BOX_H} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={NGINX_X + NGINX_W / 2} y={BOX_Y - 8} textAnchor="middle" fontSize="12" fill={MUTED}>Nginx :80</text>
        <text x={NGINX_X + NGINX_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">反向代理</text>

        <rect x={BACK_X} y={BOX_Y} width={BACK_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={BACK_X + BACK_W / 2} y={BOX_Y - 8} textAnchor="middle" fontSize="12" fill={MUTED}>后端应用</text>
        <text x={BACK_X + BACK_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328" fontFamily="monospace">:{port}</text>

        <line x1={4} y1={y} x2={CLIENT_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={CLIENT_X + CLIENT_W} y1={y} x2={NGINX_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={NGINX_X + NGINX_W} y1={y} x2={BACK_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={BACK_X + BACK_W} y1={y} x2={WIDTH - 4} y2={y} stroke={GRID} strokeWidth="2" />

        <circle cx={x} cy={y} r="7" fill={color} stroke="#fff" strokeWidth="2" />
        <text x={NGINX_X + NGINX_W / 2} y={HEIGHT - 10} textAnchor="middle" fontSize="10" fill={MUTED}>
          proxy_pass http://127.0.0.1:{port}
        </text>
      </svg>
      <div className="anim-controls">
        <label>后端端口 = {port}</label>
        <input type="range" min="3000" max="9000" step="10" value={port} onChange={e => setPort(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {forward ? '请求：客户端 → Nginx' : '响应：后端 → Nginx'}（{atNginx ? '正在 Nginx 转发' : atBack ? '到达后端' : atClient ? '回到客户端' : '传输中'}）；客户端只见 Nginx，后端 {port} 被隐藏
      </p>
    </div>
  )
}
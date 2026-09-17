import { useEffect, useState } from 'react'
import { BLUE, ORANGE, RED, MUTED, GRID } from './colors'

// 权限流程：模型要执行操作 → 命中规则判断 → allow / ask / deny 三种去向。
const WIDTH = 480
const HEIGHT = 220
const OUTCOMES = [
  { key: 'allow', label: '直接执行', fill: '#dcebfb', stroke: BLUE, cy: 50, desc: '命中 allow 白名单 → 直接执行，不打断你' },
  { key: 'ask', label: '弹你确认', fill: '#fbe0d6', stroke: ORANGE, cy: 110, desc: '未命中规则 → 弹给你确认，等你决定' },
  { key: 'deny', label: '直接拒绝', fill: '#fbe0d6', stroke: RED, cy: 170, desc: '命中 deny 黑名单 → 直接拒绝，一票否决' },
]
const REQ_X = 20
const REQ_W = 100
const REQ_Y = 90
const REQ_H = 40
const REQ_CY = REQ_Y + REQ_H / 2
const DIA_CX = 210
const DIA_CY = 110
const OUT_X = 330
const OUT_W = 140
const L1 = DIA_CX - (REQ_X + REQ_W) // 90

export default function PermissionFlowAnimation() {
  const [sel, setSel] = useState(1)
  const [p, setP] = useState(0)

  useEffect(() => {
    setP(0)
  }, [sel])

  useEffect(() => {
    const t = setInterval(() => setP(v => v + 4), 40)
    return () => clearInterval(t)
  }, [])

  const out = OUTCOMES[sel]
  const L2 = Math.hypot(OUT_X - DIA_CX, out.cy - DIA_CY)
  const TOTAL = L1 + L2
  const prog = p % TOTAL

  let x: number
  let y: number
  let arrived: boolean
  if (prog < L1) {
    x = REQ_X + REQ_W + prog
    y = REQ_CY
    arrived = false
  } else {
    const t = (prog - L1) / L2
    x = DIA_CX + (OUT_X - DIA_CX) * t
    y = DIA_CY + (out.cy - DIA_CY) * t
    arrived = t > 0.9
  }

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="权限判断流程动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>权限流程：操作 → 命中规则判断 → allow / ask / deny</text>

        <line x1={REQ_X + REQ_W} y1={REQ_CY} x2={DIA_CX} y2={DIA_CY} stroke={GRID} strokeWidth="2" />
        <line x1={DIA_CX} y1={DIA_CY} x2={OUT_X} y2={out.cy} stroke={GRID} strokeWidth="2" />

        <rect x={REQ_X} y={REQ_Y} width={REQ_W} height={REQ_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={REQ_X + REQ_W / 2} y={REQ_CY + 4} textAnchor="middle" fontSize="12" fill="#1f2328">模型要执行操作</text>

        <polygon points={`${DIA_CX},${DIA_CY - 18} ${DIA_CX + 24},${DIA_CY} ${DIA_CX},${DIA_CY + 18} ${DIA_CX - 24},${DIA_CY}`}
          fill="#fff" stroke={MUTED} strokeWidth="1.5" />
        <text x={DIA_CX} y={DIA_CY + 4} textAnchor="middle" fontSize="10" fill={MUTED}>命中规则?</text>

        {OUTCOMES.map((o, i) => (
          <g key={i}>
            <rect x={OUT_X} y={o.cy - 20} width={OUT_W} height={40} rx="8"
              fill={i === sel ? o.fill : '#fbfbfb'} stroke={o.stroke} strokeWidth={i === sel ? 2 : 1} />
            <text x={OUT_X + OUT_W / 2} y={o.cy + 4} textAnchor="middle" fontSize="12" fill="#1f2328">{o.label}</text>
          </g>
        ))}

        <circle cx={x} cy={y} r="7" fill={arrived ? out.stroke : BLUE} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="anim-controls">
        <label>规则命中结果：{out.label}</label>
        <input type="range" min="0" max="2" step="1" value={sel} onChange={e => setSel(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {out.desc}。allow 省去打扰、deny 一票否决、其余走 ask——三态构成权限系统的安全边界。
      </p>
    </div>
  )
}
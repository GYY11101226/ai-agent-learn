import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED } from './colors'

const WIDTH = 480
const HEIGHT = 300
const CX = 90
const SX = 390
const TOP = 60
const H = 52

// 0/2 客户端 → 服务端，1/3 服务端 → 客户端
const STEPS = [
  { msg: 'ClientHello', dir: 'c2s' },
  { msg: 'ServerHello + 证书', dir: 's2c' },
  { msg: '密钥交换', dir: 'c2s' },
  { msg: 'Finished（开始加密）', dir: 's2c' },
]

export default function TlsHandshakeAnimation() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % (STEPS.length + 1)), 1400)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="TLS 握手动画">
        <rect x={CX - 40} y={TOP - 30} width={80} height={40} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={CX} y={TOP - 6} textAnchor="middle" fontSize="12" fill="#1f2328">客户端</text>
        <rect x={SX - 40} y={TOP - 30} width={80} height={40} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={SX} y={TOP - 6} textAnchor="middle" fontSize="12" fill="#1f2328">服务端</text>

        {STEPS.map((s, i) => {
          const y = TOP + i * H
          const fromX = s.dir === 'c2s' ? CX : SX
          const toX = s.dir === 'c2s' ? SX : CX
          const done = i < step
          const active = i === step
          const color = active ? ORANGE : done ? BLUE : '#e5e7eb'
          return (
            <g key={s.msg}>
              <line x1={fromX} y1={y} x2={toX} y2={y} stroke={color} strokeWidth={active ? 3 : 2} />
              {active && <polygon points={`${toX},${y} ${toX + (s.dir === 'c2s' ? -8 : 8)},${y - 4} ${toX + (s.dir === 'c2s' ? -8 : 8)},${y + 4}`} fill={ORANGE} />}
              <text x={WIDTH / 2} y={y - 6} textAnchor="middle" fontSize="12" fill={active || done ? '#1f2328' : MUTED}>
                {i + 1}. {s.msg}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label>握手进度：{Math.min(step, STEPS.length)} / {STEPS.length} 步</label>
        <input type="range" min="0" max={STEPS.length} step="1" value={step} onChange={e => setStep(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {step >= STEPS.length ? '握手完成，双方用协商的对称密钥加密通信' : `进行中：${STEPS[step].msg}`}
      </p>
    </div>
  )
}
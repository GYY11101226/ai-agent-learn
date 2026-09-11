import { useEffect, useState } from 'react'
import { AXIS, BLUE, MUTED, RED, sequentialBlue } from './colors'

// 2→2→1 网络：sigmoid 激活 + 平方误差，每个完整周期跑 前向→损失→反向→更新，E 逐轮变小。
const X = [1.0, 0.5]
const TARGET = 0.8
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

interface Net {
  w1: number[][] // 隐藏层 2×2
  b1: number[]
  w2: number[] // 输出层 1×2
  b2: number
  round: number
}
const INIT: Net = {
  w1: [
    [0.6, -0.4],
    [0.3, 0.8],
  ],
  b1: [0.1, -0.2],
  w2: [0.5, -0.6],
  b2: 0.15,
  round: 1,
}

function forward(net: Net) {
  const z1 = [0, 1].map(j => X[0] * net.w1[j][0] + X[1] * net.w1[j][1] + net.b1[j])
  const a1 = z1.map(sigmoid)
  const z2 = a1[0] * net.w2[0] + a1[1] * net.w2[1] + net.b2
  const a2 = sigmoid(z2)
  const loss = 0.5 * (TARGET - a2) ** 2
  return { a1, a2, loss }
}

function trained(net: Net, alpha: number): Net {
  const { a1, a2 } = forward(net)
  const d2 = (a2 - TARGET) * a2 * (1 - a2) // 输出层 δ
  const d1 = [0, 1].map(j => d2 * net.w2[j] * a1[j] * (1 - a1[j])) // 回传到隐藏层
  return {
    ...net,
    w2: [net.w2[0] - alpha * d2 * a1[0], net.w2[1] - alpha * d2 * a1[1]],
    b2: net.b2 - alpha * d2,
    w1: [
      [net.w1[0][0] - alpha * d1[0] * X[0], net.w1[0][1] - alpha * d1[0] * X[1]],
      [net.w1[1][0] - alpha * d1[1] * X[0], net.w1[1][1] - alpha * d1[1] * X[1]],
    ],
    b1: [net.b1[0] - alpha * d1[0], net.b1[1] - alpha * d1[1]],
    round: net.round + 1,
  }
}

const PHASES = ['f1', 'f2', 'loss', 'b1', 'b2', 'update'] as const
type Phase = (typeof PHASES)[number]
const PHASE_NOTE: Record<Phase, string> = {
  f1: '① 前向：输入 × 权重 → 隐藏层激活',
  f2: '② 前向：隐藏层 × 权重 → 输出 ŷ',
  loss: '③ 算损失 E = ½(t − ŷ)²',
  b1: '④ 反向：误差信号 δ 从输出层回传（红）',
  b2: '⑤ 反向：δ 继续逐层回传到隐藏层',
  update: '⑥ 按 w := w − α·δ·a 更新权重与偏置（偏置未画出）',
}

const WIDTH = 480
const HEIGHT = 300
const NODES = {
  input: [
    { x: 90, y: 110 },
    { x: 90, y: 210 },
  ],
  hidden: [
    { x: 250, y: 110 },
    { x: 250, y: 210 },
  ],
  output: [{ x: 410, y: 160 }],
}

function Node({ x, y, value, active }: { x: number; y: number; value: string; active: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r="18" fill={sequentialBlue(active ? 0.75 : 0.15)} stroke={AXIS} strokeWidth="1" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fill={active ? '#fff' : '#52514e'}>{value}</text>
    </g>
  )
}

export default function BackpropAnimation() {
  const [alpha, setAlpha] = useState(0.5)
  const [net, setNet] = useState<Net>(INIT)
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIdx(prev => (prev + 1) % PHASES.length)
    }, 700)
    return () => clearInterval(timer)
  }, [])

  // 进入 update 相位时应用一轮训练（纯 updater，无嵌套副作用；StrictMode 安全）
  useEffect(() => {
    if (PHASES[phaseIdx] !== 'update') return
    setNet(n => trained(n, alpha))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx])

  const phase = PHASES[phaseIdx]
  const { a1, a2, loss } = forward(net)
  const hot = (p: Phase) => phase === p
  const edgeStyle = (on: boolean, backward: boolean) => ({
    stroke: on ? (backward ? RED : BLUE) : '#e5e7eb',
    strokeWidth: on ? 3 : 1.5,
    opacity: on ? 1 : 0.8,
    markerEnd: on ? (backward ? 'url(#bp-arrow-b)' : 'url(#bp-arrow-f)') : undefined,
  })
  const weightText = (w: number) => w.toFixed(2)
  const fmtLoss = (v: number) => (v < 1e-4 ? v.toExponential(2) : v.toFixed(4))
  const labelFill = hot('update') ? RED : MUTED

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="反向传播动画：2-2-1 网络上前向传播与误差信号逐层回传">
        <defs>
          <marker id="bp-arrow-f" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill={BLUE} />
          </marker>
          <marker id="bp-arrow-b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill={RED} />
          </marker>
        </defs>
        {NODES.input.map((i, ii) =>
          NODES.hidden.map((h, hj) => {
            const fwd = { x1: i.x + 18, y1: i.y, x2: h.x - 18, y2: h.y }
            const bwd = { x1: h.x - 18, y1: h.y, x2: i.x + 18, y2: i.y }
            const e = hot('b2') ? bwd : fwd
            return <line key={`e1-${ii}-${hj}`} {...e} {...edgeStyle(hot('f1') || hot('b2'), hot('b2'))} />
          }),
        )}
        {NODES.hidden.map((h, j) => {
          const fwd = { x1: h.x + 18, y1: h.y, x2: NODES.output[0].x - 18, y2: NODES.output[0].y }
          const bwd = { x1: NODES.output[0].x - 18, y1: NODES.output[0].y, x2: h.x + 18, y2: h.y }
          const e = hot('b1') ? bwd : fwd
          return <line key={`e2-${j}`} {...e} {...edgeStyle(hot('f2') || hot('b1'), hot('b1'))} />
        })}
        {NODES.hidden.map((h, j) => (
          <text
            key={`w2-${j}`}
            x={(h.x + NODES.output[0].x) / 2}
            y={NODES.output[0].y + (j === 0 ? -6 : 30)}
            textAnchor="middle" fontSize="11" fill={labelFill}
            stroke="#fff" strokeWidth={3} paintOrder="stroke"
          >
            w={weightText(net.w2[j])}
          </text>
        ))}
        {NODES.input.map((i, ii) =>
          NODES.hidden.map((h, hj) => (
            <text
              key={`w1-${ii}-${hj}`}
              x={(i.x + h.x) / 2 + (ii === 0 ? -12 : 12)}
              y={(i.y + h.y) / 2 + (hj === 0 ? -14 : 20)}
              textAnchor="middle" fontSize="10" fill={labelFill}
              stroke="#fff" strokeWidth={3} paintOrder="stroke"
            >
              {weightText(net.w1[hj][ii])}
            </text>
          )),
        )}
        <Node x={NODES.input[0].x} y={NODES.input[0].y} value={X[0].toFixed(1)} active />
        <Node x={NODES.input[1].x} y={NODES.input[1].y} value={X[1].toFixed(1)} active />
        <Node x={NODES.hidden[0].x} y={NODES.hidden[0].y} value={a1[0].toFixed(2)} active={phase !== 'f1'} />
        <Node x={NODES.hidden[1].x} y={NODES.hidden[1].y} value={a1[1].toFixed(2)} active={phase !== 'f1'} />
        <Node x={NODES.output[0].x} y={NODES.output[0].y} value={a2.toFixed(2)} active={hot('loss') || hot('b1') || hot('f2')} />
        <text x={NODES.input[0].x} y={NODES.input[0].y - 30} textAnchor="middle" fontSize="12" fill={MUTED}>输入层</text>
        <text x={NODES.hidden[0].x} y={NODES.hidden[0].y - 30} textAnchor="middle" fontSize="12" fill={MUTED}>隐藏层</text>
        <text x={NODES.output[0].x} y={NODES.output[0].y - 30} textAnchor="middle" fontSize="12" fill={MUTED}>输出 ŷ</text>
        <text x={WIDTH / 2} y={28} textAnchor="middle" fontSize="12" fill={RED}>
          {hot('loss') ? `E = ${fmtLoss(loss)}（目标 t = ${TARGET}）` : ''}
        </text>
      </svg>
      <div className="anim-controls">
        <label htmlFor="bp-alpha">学习率 α = {alpha.toFixed(2)}</label>
        <input
          id="bp-alpha"
          type="range" min="0.1" max="1.5" step="0.05" value={alpha}
          onChange={e => setAlpha(Number(e.target.value))}
        />
      </div>
      <p className="anim-caption">
        {PHASE_NOTE[phase]}｜第 {net.round} 轮，E = {fmtLoss(loss)}（每轮更新后变小）
      </p>
    </div>
  )
}

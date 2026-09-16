import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 200
const NODES = [
  { name: '开始', inp: '—', out: 'query' },
  { name: 'LLM', inp: 'query', out: 'result' },
  { name: '代码', inp: 'result', out: 'cleaned' },
  { name: '结束', inp: 'cleaned', out: 'output' },
]
const XS = [30, 155, 280, 405]
const W = 70
const Y = 70
const H = 48
const CY = Y + H / 2
const TRAVEL = 440

export default function WorkflowNodeFlowAnimation() {
  const [sel, setSel] = useState(1)
  const [p, setP] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setP(v => (v + 5) % TRAVEL), 40)
    return () => clearInterval(t)
  }, [])

  const bx = 20 + p

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="工作流节点数据流动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>节点数据流：前节点输出 = 后节点输入</text>

        {XS.slice(0, -1).map((x, i) => (
          <line key={i} x1={x + W} y1={CY} x2={XS[i + 1]} y2={CY} stroke={GRID} strokeWidth="2" />
        ))}

        {NODES.map((n, i) => {
          const active = i === sel
          return (
            <g key={i}>
              <rect x={XS[i]} y={Y} width={W} height={H} rx="8"
                fill={active ? '#fbe0d6' : '#dcebfb'}
                stroke={active ? ORANGE : BLUE} strokeWidth={active ? 2 : 1.5} />
              <text x={XS[i] + W / 2} y={CY + 4} textAnchor="middle" fontSize="13" fill="#1f2328">{n.name}</text>
              <text x={XS[i] + W / 2} y={CY + 16} textAnchor="middle" fontSize="9" fill={active ? ORANGE : MUTED}>{n.out}</text>
            </g>
          )
        })}

        <circle cx={bx} cy={CY} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2" />

        <text x={20} y={132} fontSize="11" fill={MUTED}>
          选中节点：{NODES[sel].name}（输入 {NODES[sel].inp} → 输出 {NODES[sel].out}）
        </text>
      </svg>
      <div className="anim-controls">
        <label>选中节点：{NODES[sel].name}</label>
        <input type="range" min="0" max="3" step="1" value={sel} onChange={e => setSel(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {NODES[sel].inp} 进入 {NODES[sel].name} 处理，输出 {NODES[sel].out}，再沿连线成为下一个节点的输入——变量就这样一路向后流动。
      </p>
    </div>
  )
}
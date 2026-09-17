import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

// agentic loop：模型决策 → 调用工具 → 执行结果，再回模型进入下一轮，直到完成。
const WIDTH = 480
const HEIGHT = 200
const NODES = [
  { name: '模型决策', x: 30 },
  { name: '调用工具', x: 185 },
  { name: '执行结果', x: 340 },
]
const BOX_W = 110
const BOX_H = 52
const TOP = 60
const CY = TOP + BOX_H / 2 // 顶部连线高度
const BOT = 150 // 底部回程连线高度
const X0 = NODES[0].x + BOX_W / 2 // 85
const X3 = NODES[2].x + BOX_W / 2 // 395

type Pt = [number, number]
interface Seg {
  len: number
  a: Pt
  b: Pt
  name: string
}

const SEGS: Seg[] = [
  { len: X3 - X0, a: [X0, CY], b: [X3, CY], name: '模型决策 → 调用工具，执行中' },
  { len: BOT - CY, a: [X3, CY], b: [X3, BOT], name: '工具跑完，产出结果' },
  { len: X3 - X0, a: [X3, BOT], b: [X0, BOT], name: '结果反馈回模型，进入下一轮决策' },
  { len: BOT - CY, a: [X0, BOT], b: [X0, CY], name: '模型消化结果，准备再决策' },
]
const PERIM = SEGS.reduce((s, g) => s + g.len, 0)

function pos(p: number) {
  let rem = p % PERIM
  for (let i = 0; i < SEGS.length; i++) {
    if (rem <= SEGS[i].len) {
      const t = SEGS[i].len === 0 ? 0 : rem / SEGS[i].len
      const [ax, ay] = SEGS[i].a
      const [bx, by] = SEGS[i].b
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, seg: i }
    }
    rem -= SEGS[i].len
  }
  return { x: X0, y: CY, seg: 0 }
}

export default function AgenticLoopAnimation() {
  const [p, setP] = useState(0)
  const [speed, setSpeed] = useState(5)

  useEffect(() => {
    const t = setInterval(() => setP(v => v + 4), 90 - speed * 8)
    return () => clearInterval(t)
  }, [speed])

  const orb = pos(p)
  const laps = Math.floor(p / PERIM)

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="agentic 循环动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>agentic loop：决策 → 执行 → 看结果 → 再决策</text>

        {/* 顶部前进连线 + 三个方框 */}
        <line x1={X0} y1={CY} x2={X3} y2={CY} stroke={GRID} strokeWidth="2" />
        {NODES.map((n, i) => {
          // 依当前段高亮「离 orb 最近 / 即将到达」的节点
          const HIGHLIGHT: Record<number, number> = { 0: 1, 1: 2, 2: 0, 3: 0 }
          const active = HIGHLIGHT[orb.seg] === i
          return (
            <g key={i}>
              <rect x={n.x} y={TOP} width={BOX_W} height={BOX_H} rx="8"
                fill={i === 1 ? '#fbe0d6' : '#dcebfb'}
                stroke={i === 1 ? ORANGE : BLUE} strokeWidth={active ? 2 : 1.5} />
              <text x={n.x + BOX_W / 2} y={CY + 4} textAnchor="middle" fontSize="13" fill="#1f2328">{n.name}</text>
            </g>
          )
        })}

        {/* 底部回程连线（结果 → 模型） */}
        <line x1={X3} y1={CY} x2={X3} y2={BOT} stroke={GRID} strokeWidth="2" />
        <line x1={X3} y1={BOT} x2={X0} y2={BOT} stroke={GRID} strokeWidth="2" />
        <line x1={X0} y1={BOT} x2={X0} y2={CY} stroke={GRID} strokeWidth="2" />
        <text x={WIDTH / 2} y={BOT - 6} textAnchor="middle" fontSize="9" fill={MUTED}>结果反馈</text>

        <circle cx={orb.x} cy={orb.y} r="7" fill={orb.seg <= 1 ? ORANGE : BLUE} stroke="#fff" strokeWidth="2" />

        <text x={20} y={BOT + 24} fontSize="11" fill={MUTED}>已循环 {laps} 轮 · 第 {orb.seg + 1}/4 段</text>
      </svg>
      <div className="anim-controls">
        <label>循环速度 = {speed}</label>
        <input type="range" min="1" max="10" step="1" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {SEGS[orb.seg].name}。模型不是一次答完，而是反复「决策 → 执行 → 看结果」，靠每轮反馈收敛到最终结果。
      </p>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID, sequentialBlue } from './colors'

const WIDTH = 600
const HEIGHT = 300
const BOX_W = 180
const BOX_H = 44
const LX = 40
const RX = 380
const YS = [70, 135, 200]

export default function WorkflowVsChatflowAnimation() {
  const [round, setRound] = useState(1)

  useEffect(() => {
    const t = setInterval(() => setRound(r => (r % 5) + 1), 800)
    return () => clearInterval(t)
  }, [])

  const loopActive = round > 1

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Workflow 与 Chatflow 对比动画">
        <text x={LX} y={24} fontSize="12" fill={BLUE}>Workflow（一次性）</text>
        <text x={RX} y={24} fontSize="12" fill={ORANGE}>Chatflow（多轮，有记忆）</text>

        {/* 左侧：Workflow 单次线性 */}
        <rect x={LX} y={YS[0]} width={BOX_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={LX + BOX_W / 2} y={YS[0] + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">开始</text>
        <line x1={LX + BOX_W / 2} y1={YS[0] + BOX_H} x2={LX + BOX_W / 2} y2={YS[1]} stroke={GRID} strokeWidth="2" />
        <rect x={LX} y={YS[1]} width={BOX_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={LX + BOX_W / 2} y={YS[1] + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">处理</text>
        <line x1={LX + BOX_W / 2} y1={YS[1] + BOX_H} x2={LX + BOX_W / 2} y2={YS[2]} stroke={GRID} strokeWidth="2" />
        <rect x={LX} y={YS[2]} width={BOX_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={LX + BOX_W / 2} y={YS[2] + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">结束</text>
        <text x={LX} y={270} fontSize="11" fill={MUTED}>跑一遍出结果，不记得上次</text>

        {/* 右侧：Chatflow 多轮循环 */}
        <rect x={RX} y={YS[0]} width={BOX_W} height={BOX_H} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={RX + BOX_W / 2} y={YS[0] + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">开始(聊天)</text>
        <line x1={RX + BOX_W / 2} y1={YS[0] + BOX_H} x2={RX + BOX_W / 2} y2={YS[1]} stroke={GRID} strokeWidth="2" />
        <rect x={RX} y={YS[1]} width={BOX_W} height={BOX_H} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={RX + BOX_W / 2} y={YS[1] + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">LLM</text>
        <line x1={RX + BOX_W / 2} y1={YS[1] + BOX_H} x2={RX + BOX_W / 2} y2={YS[2]} stroke={GRID} strokeWidth="2" />
        <rect x={RX} y={YS[2]} width={BOX_W} height={BOX_H} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={RX + BOX_W / 2} y={YS[2] + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328">回答</text>

        {/* 循环回路：回答 → 开始（第二轮起激活） */}
        <polyline
          points={`${RX - 22},${YS[2] + BOX_H / 2} ${RX - 22},${YS[0] + BOX_H / 2} ${RX - 6},${YS[0] + BOX_H / 2}`}
          fill="none"
          stroke={loopActive ? ORANGE : GRID}
          strokeWidth={loopActive ? 2.5 : 2}
        />
        <polygon
          points={`${RX - 14},${YS[0] + BOX_H / 2 - 6} ${RX - 14},${YS[0] + BOX_H / 2 + 6} ${RX - 4},${YS[0] + BOX_H / 2}`}
          fill={loopActive ? ORANGE : GRID}
        />
        <text x={RX - 30} y={YS[0] + BOX_H / 2 - 10} textAnchor="end" fontSize="10" fill={loopActive ? ORANGE : MUTED}>第{round}轮</text>

        {/* 记忆累积：逐步点亮 5 格 */}
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={i} x={380 + i * 36} y={250} width={30} height={18} rx="4"
            fill={i < round ? sequentialBlue((i + 1) / 5) : '#f3f4f6'}
            stroke={i < round ? BLUE : GRID} strokeWidth="1" />
        ))}
        <text x={380} y={288} fontSize="11" fill={MUTED}>记忆累积：{round} 轮上下文</text>
      </svg>
      <div className="anim-controls">
        <label>轮次 = {round}</label>
        <input type="range" min="1" max="5" step="1" value={round} onChange={e => setRound(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        Workflow 每次从开始跑到结束即结束；Chatflow 则循环回到「开始」，并把上下文累积进记忆，一轮比一轮记得多。
      </p>
    </div>
  )
}
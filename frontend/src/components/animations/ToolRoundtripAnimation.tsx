import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

// 一次工具往返：模型发请求 → 工具执行 → 结果返回模型。
const WIDTH = 480
const HEIGHT = 220
const TOOLS = [
  { name: 'Read 读文件', req: '读 src/store.py', res: '文件内容' },
  { name: 'Edit 修改', req: '改 login() 返回 401', res: 'diff 结果' },
  { name: 'Bash 运行', req: '跑 pytest', res: '测试输出' },
]
const TOP_Y = 20
const TOP_H = 48
const BOT_Y = 120
const BOT_H = 48
const BOX_X = 165
const BOX_W = 150
const CX = BOX_X + BOX_W / 2
const CY_TOP = TOP_Y + TOP_H / 2
const CY_BOT = BOT_Y + BOT_H / 2
const DIST = CY_BOT - CY_TOP
const TRAVEL = 2 * DIST

export default function ToolRoundtripAnimation() {
  const [sel, setSel] = useState(0)
  const [p, setP] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setP(v => (v + 4) % TRAVEL), 40)
    return () => clearInterval(t)
  }, [])

  const down = p < DIST
  const y = down ? CY_TOP + p : CY_TOP + (TRAVEL - p)
  const tool = TOOLS[sel]

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="工具调用往返动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>一次工具往返：请求下行 → 结果上行</text>

        <line x1={CX} y1={CY_TOP} x2={CX} y2={CY_BOT} stroke={GRID} strokeWidth="2" />

        <rect x={BOX_X} y={TOP_Y} width={BOX_W} height={TOP_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={CX} y={CY_TOP + 4} textAnchor="middle" fontSize="13" fill="#1f2328">模型</text>

        <rect x={BOX_X} y={BOT_Y} width={BOX_W} height={BOT_H} rx="8" fill="#fbe0d6" stroke={ORANGE} strokeWidth="1.5" />
        <text x={CX} y={CY_BOT + 4} textAnchor="middle" fontSize="13" fill="#1f2328">{tool.name}</text>

        <circle cx={CX} cy={y} r="7" fill={down ? ORANGE : BLUE} stroke="#fff" strokeWidth="2" />

        <text x={BOX_X - 12} y={CY_TOP} textAnchor="end" fontSize="10" fill={MUTED}>下发：{tool.req}</text>
        <text x={BOX_X + BOX_W + 12} y={CY_BOT} fontSize="10" fill={MUTED}>返回：{tool.res}</text>
      </svg>
      <div className="anim-controls">
        <label>选择工具：{tool.name}</label>
        <input type="range" min="0" max="2" step="1" value={sel} onChange={e => setSel(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {down ? `请求下行：模型让「${tool.name}」${tool.req}` : `结果上行：工具返回「${tool.res}」喂回模型，供下一步决策`}。
        工具只负责执行，判断权始终在模型手里。
      </p>
    </div>
  )
}
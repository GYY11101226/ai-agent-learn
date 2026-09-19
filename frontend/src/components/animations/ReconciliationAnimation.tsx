import { useState } from 'react'
import { BLUE, ORANGE, RED, MUTED, GRID } from './colors'

// 虚拟 DOM diff：旧列表 vs 新列表，React 只把「变化项」更新到真实 DOM。
const WIDTH = 480
const HEIGHT = 230
const ROW_Y = 58
const NEW_Y = 128
const BOX_W = 72
const BOX_H = 40
const GAP = 12
const START_X = 60

// 三种 diff 场景：新增 / 删除 / 乱序（标注每个 item 是 unchanged / added / removed / moved）。
const SCENARIOS = [
  {
    name: '新增一项',
    old: [
      { k: 'A', s: 'same' },
      { k: 'B', s: 'same' },
      { k: 'C', s: 'same' },
    ],
    neu: [
      { k: 'A', s: 'same' },
      { k: 'B', s: 'same' },
      { k: 'C', s: 'same' },
      { k: 'D', s: 'added' },
    ],
  },
  {
    name: '删除一项',
    old: [
      { k: 'A', s: 'same' },
      { k: 'B', s: 'removed' },
      { k: 'C', s: 'same' },
    ],
    neu: [
      { k: 'A', s: 'same' },
      { k: 'C', s: 'same' },
    ],
  },
  {
    name: '乱序两项',
    old: [
      { k: 'A', s: 'same' },
      { k: 'B', s: 'moved' },
      { k: 'C', s: 'moved' },
    ],
    neu: [
      { k: 'A', s: 'same' },
      { k: 'C', s: 'moved' },
      { k: 'B', s: 'moved' },
    ],
  },
]

const FILL: Record<string, string> = {
  same: '#dcebfb',
  added: '#fbe0d6',
  moved: '#fbe0d6',
  removed: '#fdeaea',
}
const STROKE: Record<string, string> = {
  same: BLUE,
  added: ORANGE,
  moved: ORANGE,
  removed: RED,
}
const LABEL: Record<string, string> = {
  same: '复用',
  added: '新增',
  moved: '移动',
  removed: '删除',
}

function row(items: Array<{ k: string; s: string }>, y: number) {
  return items.map((it, i) => {
    const x = START_X + i * (BOX_W + GAP)
    return (
      <g key={it.k}>
        <rect x={x} y={y} width={BOX_W} height={BOX_H} rx="8" fill={FILL[it.s]} stroke={STROKE[it.s]} strokeWidth="1.5" />
        <text x={x + BOX_W / 2} y={y + BOX_H / 2 + 4} textAnchor="middle" fontSize="15" fill="#1f2328">{it.k}</text>
        <text x={x + BOX_W / 2} y={y - 6} textAnchor="middle" fontSize="9" fill={STROKE[it.s]}>{LABEL[it.s]}</text>
      </g>
    )
  })
}

export default function ReconciliationAnimation() {
  const [sel, setSel] = useState(0)
  const sc = SCENARIOS[sel]

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="虚拟 DOM diff 动画">
        <text x={20} y={28} fontSize="11" fill={MUTED}>旧虚拟 DOM vs 新虚拟 DOM：只 patch 变化项</text>

        <text x={20} y={ROW_Y + BOX_H / 2 + 4} fontSize="11" fill={MUTED}>旧</text>
        {row(sc.old, ROW_Y)}

        <line x1={START_X} y1={ROW_Y + BOX_H + 6} x2={START_X} y2={NEW_Y - 6} stroke={GRID} strokeWidth="2" />
        <text x={START_X + 8} y={ROW_Y + BOX_H + 22} fontSize="10" fill={MUTED}>diff → patch</text>

        <text x={20} y={NEW_Y + BOX_H / 2 + 4} fontSize="11" fill={MUTED}>新</text>
        {row(sc.neu, NEW_Y)}
      </svg>
      <div className="anim-controls">
        <label>diff 场景：{sc.name}</label>
        <input type="range" min="0" max="2" step="1" value={sel} onChange={e => setSel(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {sc.name}时：蓝色项被直接复用，只有橙色/红色项需要动真实 DOM——React 把昂贵的 DOM 操作压到最少。
      </p>
    </div>
  )
}
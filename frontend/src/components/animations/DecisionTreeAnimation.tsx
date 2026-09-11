import { useEffect, useState } from 'react'
import { AXIS, BLUE, MUTED, ORANGE } from './colors'

// 20 个主体点（XOR 型：blue 聚左下/右上，orange 聚左上/右下）+ 2 个噪声点，共 22 个。
interface Pt { x: number; y: number; label: 0 | 1 }
const POINTS: Pt[] = [
  { x: 0.7, y: 0.8, label: 0 }, { x: 1.2, y: 0.6, label: 0 }, { x: 0.9, y: 1.5, label: 0 },
  { x: 1.4, y: 1.1, label: 0 }, { x: 0.6, y: 1.3, label: 0 },
  { x: 3.1, y: 3.0, label: 0 }, { x: 3.4, y: 2.7, label: 0 }, { x: 2.8, y: 3.3, label: 0 },
  { x: 3.3, y: 3.4, label: 0 }, { x: 2.9, y: 2.8, label: 0 },
  { x: 3.2, y: 0.9, label: 1 }, { x: 2.9, y: 0.6, label: 1 }, { x: 3.5, y: 1.2, label: 1 },
  { x: 3.0, y: 1.6, label: 1 }, { x: 3.4, y: 0.8, label: 1 },
  { x: 0.8, y: 2.9, label: 1 }, { x: 1.3, y: 3.2, label: 1 }, { x: 0.6, y: 3.4, label: 1 },
  { x: 1.1, y: 2.6, label: 1 }, { x: 1.4, y: 3.0, label: 1 },
  { x: 1.0, y: 2.2, label: 0 }, // 噪声：blue 混进左上 orange 区
  { x: 2.8, y: 2.2, label: 1 }, // 噪声：orange 混进右上 blue 区
]

// 完全二叉树层序切分：节点 k 的切分是 SPLITS[k]；depth d 的切分节点是 2^(d−1)−1 … 2^d−2。
// 每个 threshold 都落在所属节点的区域内部（切分线绝不越出区域）。
const SPLITS: { axis: 'x' | 'y'; threshold: number }[] = [
  { axis: 'x', threshold: 2.0 }, // node 0：左右分。XOR 数据一刀下去 Gini 几乎不变
  { axis: 'y', threshold: 2.0 }, // node 1 左半：左下 / 左上
  { axis: 'y', threshold: 2.0 }, // node 2 右半：右下 / 右上
  { axis: 'x', threshold: 1.0 }, // node 3 左下（已纯）：演示「纯了也继续切」
  { axis: 'y', threshold: 2.4 }, // node 4 左上：把噪声点 (1.0, 2.2) 单独隔成叶
  { axis: 'x', threshold: 3.0 }, // node 5 右下（已纯）：同 node 3
  { axis: 'y', threshold: 2.4 }, // node 6 右上：把噪声点 (2.8, 2.2) 单独隔成叶
]

const WIDTH = 480
const HEIGHT = 340
const PAD = 40
const sx = (x: number) => PAD + (x / 4) * (WIDTH - 2 * PAD)
const sy = (y: number) => HEIGHT - PAD - (y / 4) * (HEIGHT - 2 * PAD)

interface Region { xmin: number; xmax: number; ymin: number; ymax: number; depth: number }

function regionsAt(depth: number): Region[] {
  const leaves: Region[] = []
  const walk = (node: number, r: Region) => {
    if (r.depth >= depth || node >= SPLITS.length) {
      leaves.push(r)
      return
    }
    const s = SPLITS[node]
    if (s.axis === 'x') {
      walk(2 * node + 1, { ...r, xmax: Math.min(r.xmax, s.threshold), depth: r.depth + 1 })
      walk(2 * node + 2, { ...r, xmin: Math.max(r.xmin, s.threshold), depth: r.depth + 1 })
    } else {
      walk(2 * node + 1, { ...r, ymax: Math.min(r.ymax, s.threshold), depth: r.depth + 1 })
      walk(2 * node + 2, { ...r, ymin: Math.max(r.ymin, s.threshold), depth: r.depth + 1 })
    }
  }
  walk(0, { xmin: 0, xmax: 4, ymin: 0, ymax: 4, depth: 0 })
  return leaves
}

const pointsIn = (r: Region) => POINTS.filter(p => p.x >= r.xmin && p.x < r.xmax && p.y >= r.ymin && p.y < r.ymax)

const gini = (pts: Pt[]) => {
  if (!pts.length) return 0
  const p = pts.filter(q => q.label === 0).length / pts.length
  return 1 - p * p - (1 - p) * (1 - p)
}

// 与 regionsAt 同构：返回 depth 内每一刀的线段（含所属 node），供高亮「当前层新下的刀」。
function splitLines(depth: number) {
  const out: { x1: number; y1: number; x2: number; y2: number; node: number }[] = []
  const walk = (node: number, r: Region) => {
    if (r.depth >= depth || node >= SPLITS.length) return
    const s = SPLITS[node]
    if (s.axis === 'x') {
      out.push({ x1: sx(s.threshold), y1: sy(r.ymin), x2: sx(s.threshold), y2: sy(r.ymax), node })
      walk(2 * node + 1, { ...r, xmax: Math.min(r.xmax, s.threshold), depth: r.depth + 1 })
      walk(2 * node + 2, { ...r, xmin: Math.max(r.xmin, s.threshold), depth: r.depth + 1 })
    } else {
      out.push({ x1: sx(r.xmin), y1: sy(s.threshold), x2: sx(r.xmax), y2: sy(s.threshold), node })
      walk(2 * node + 1, { ...r, ymax: Math.min(r.ymax, s.threshold), depth: r.depth + 1 })
      walk(2 * node + 2, { ...r, ymin: Math.max(r.ymin, s.threshold), depth: r.depth + 1 })
    }
  }
  walk(0, { xmin: 0, xmax: 4, ymin: 0, ymax: 4, depth: 0 })
  return out
}

// node 是否属于第 d 层（该层新下的刀）
const isNew = (node: number, d: number) => node >= 2 ** (d - 1) - 1 && node <= 2 ** d - 2

export default function DecisionTreeAnimation() {
  const [depth, setDepth] = useState(1)
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    if (!auto) return
    const timer = setInterval(() => setDepth(d => (d >= 3 ? 1 : d + 1)), 950)
    return () => clearInterval(timer)
  }, [auto])

  const leaves = regionsAt(depth)
  const leafInfo = leaves.map(r => {
    const pts = pointsIn(r)
    return { r, n: pts.length, gini: gini(pts) }
  })
  const totalGini = leafInfo.reduce((s, l) => s + (l.gini * l.n) / POINTS.length, 0)

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="决策树切分动画：逐层切分特征平面，每一刀降低 Gini 不纯度">
        <rect x={PAD} y={PAD} width={WIDTH - 2 * PAD} height={HEIGHT - 2 * PAD} fill="none" stroke={AXIS} />
        {splitLines(depth).map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={isNew(l.node, depth) ? BLUE : AXIS}
            strokeWidth={isNew(l.node, depth) ? 2.5 : 1.5}
            strokeDasharray={isNew(l.node, depth) ? undefined : '4 3'} />
        ))}
        {POINTS.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="6"
            fill={p.label === 0 ? BLUE : ORANGE} stroke="#fff" strokeWidth="1.5" />
        ))}
        {leafInfo.map((l, i) =>
          l.n === 0 ? null : (
            <text key={i} x={sx(l.r.xmin) + 8} y={sy(l.r.ymax) + 15} fontSize="11" fill={MUTED}>
              Gini {l.gini.toFixed(2)}
            </text>
          ),
        )}
        <text x={WIDTH - PAD} y={HEIGHT - PAD + 16} textAnchor="end" fontSize="11" fill={MUTED}>特征 x →</text>
        <text x={PAD - 28} y={PAD + 4} fontSize="11" fill={MUTED}>特征 y</text>
      </svg>
      <div className="anim-controls">
        <label htmlFor="dt-depth">树的深度 = {depth}</label>
        <input
          id="dt-depth" type="range" min="1" max="3" step="1" value={depth}
          aria-label="决策树深度，1 到 3 层"
          onChange={e => { setDepth(Number(e.target.value)); setAuto(false) }}
        />
      </div>
      <p className="anim-caption">
        每一刀选「让两侧 Gini 最纯」的位置切：当前 {leafInfo.length} 个叶区域，
        {depth === 1
          ? `初始 Gini = 0.500 → 一刀几乎没降到 ${totalGini.toFixed(3)}`
          : `加权 Gini = ${totalGini.toFixed(3)}`}
        （深度 3 时纯了的区域也会被强制继续切，把噪声点单独隔成叶——把噪声当规律记住，就是过拟合）
      </p>
    </div>
  )
}

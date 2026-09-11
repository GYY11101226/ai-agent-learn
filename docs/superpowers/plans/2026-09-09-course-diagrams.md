# 课程配图（流程图 + 动画）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给三门课全部 80 章配 Mermaid 流程图（`diagram` 字段），给 ML 课 4 个核心概念章挂交互式 SVG 动画（`animation` 字段），在讲授页渲染。

**Architecture:** 内容存课程 JSON（新可选字段 `diagram`/`animation`，手写、不进 LLM prompt）；后端仅 `lesson` 接口多返回两字段；前端 `MermaidDiagram` 组件 + 4 个纯 React+SVG 动画组件（自动播放 + 单 slider）。

**Tech Stack:** Mermaid v11（前端渲染 + Node/jsdom 语法校验）、React 18 + SVG、Python（一次性内容注入脚本）。

**Spec:** `docs/superpowers/specs/2026-09-09-course-diagrams-design.md`

---

## 执行须知（零上下文必读）

1. **本项目无测试框架**（无 pytest/vitest，前端仅有 `npm run typecheck` 与 `npm run build`）。各任务的"验证"步骤 = typecheck / build / 语法校验脚本 / 接口冒烟，不写单测。
2. **Git 规则（用户全局约定，优先级最高）：不自动 commit/push。** 所有任务做完后统一在 Task 12 提交一次，提交前向用户展示变更摘要。中途任何任务都不执行 `git commit`。
3. **课程 JSON 是混合缩进风格**：外层 indent=2，但 `concepts` 数组内对象是紧凑单行。**禁止** `json.dump` 整文件重写（会把 concepts 展开成多行，制造巨大 diff）。内容注入一律用**行级文本注入**：在每个 chapter 的 `"goal": ...` 行后插入新行（goal 键只存在于 chapter 层，module 层没有，是安全的锚点）。
4. **Mermaid 语法铁律**（Node 实测结论，违反即 parse 失败）：
   - 只用 `flowchart TD` 或 `flowchart LR`。
   - 节点标签含 `(`、`)` 时必须用引号形式 `A["损失 J(w)"]`；标签内禁用 `{`、`}`。
   - 边标 `-->|文本|` 内禁用括号（引号救不了边标）。
   - Unicode 数学符号 `ŷ ∇ α λ σ · − × ²` 均可安全使用；菱形 `C{评估?}`、循环边 `D --> B` 可用。
   - JSON 里换行写成 `\n`（与现有 `code` 字段一致）。
5. **动画组件配色**（已过 dataviz validator，CVD ΔE 24.7）：类别 blue `#2a78d6` / orange `#eb6834`；误差/反向 red `#e34948`；顺序色蓝渐变 `#cde2fb`→`#104281`；文字用项目 ink（`--fg`/`--muted`），曲线 2px、网格 hairline。
6. **动画统一交互模型**：自动播放（`setInterval` 步进 + cleanup）+ 单 slider 调参，无暂停键；播放到终点自动循环重置。

## File Structure

| 文件 | 操作 | 职责 |
|---|---|---|
| `src/main.py` | Modify | `lesson` 接口 chapter 多返回 `diagram`/`animation` |
| `frontend/package.json` | Modify | 加 `mermaid` 依赖、`jsdom` devDependency（校验脚本用） |
| `frontend/src/types.ts` | Modify | `LessonResponse.chapter` 加两字段 |
| `frontend/src/components/MermaidDiagram.tsx` | Create | mermaid 源码 → SVG 异步渲染 |
| `frontend/src/components/LessonView.tsx` | Modify | 按 `diagram`/`animation` 渲染图与动画 |
| `frontend/src/pages/Lesson.tsx` | Modify | 透传两字段给 LessonView |
| `frontend/src/components/animations/colors.ts` | Create | 动画共用配色常量 + 顺序色插值 |
| `frontend/src/components/animations/GradientDescentAnimation.tsx` | Create | 梯度下降动画 |
| `frontend/src/components/animations/BackpropAnimation.tsx` | Create | 反向传播动画 |
| `frontend/src/components/animations/ConvolutionAnimation.tsx` | Create | 卷积滑动动画 |
| `frontend/src/components/animations/DecisionTreeAnimation.tsx` | Create | 决策树切分动画 |
| `frontend/src/components/animations/index.tsx` | Create | animation 枚举 → 组件映射（AnimationHost） |
| `frontend/src/styles.css` | Modify | 图/动画卡片、控件样式 |
| `frontend/scripts/validate-diagrams.mjs` | Create | 全部 diagram 的 mermaid 语法批量校验 |
| `curriculum/{ai-agent,fastapi,machine-learning}/*.json` | Modify | 80 章加 `diagram`，ML 4 章加 `animation` |

依赖顺序：Task 1（后端）与 Task 2–4（前端管线）独立 → Task 5–7（内容，依赖 4 的校验脚本）→ Task 8–11（动画，依赖 2 的类型与样式）→ Task 12（总验证 + 提交）。

---

### Task 1: 后端 lesson 接口返回 diagram / animation

**Files:**
- Modify: `src/main.py:153-156`

- [ ] **Step 1: 修改 lesson 接口的返回体**

把 `src/main.py` 中 `lesson()` 的 return（第 153–156 行）改为：

```python
    return {
        "chapter": {
            "id": ch["id"],
            "title": ch["title"],
            "goal": ch.get("goal", ""),
            "diagram": ch.get("diagram", ""),
            "animation": ch.get("animation", ""),
        },
        "lesson": result.model_dump(),
    }
```

注意：只改 `lesson`，**不改** `quiz()` 的返回体（spec：图只出现在讲授页）；**不改** `src/curriculum.py` 的 `chapter_text`（图不进 prompt）。

- [ ] **Step 2: 验证 import 无异常**

Run: `python3 -c "from src.main import app; print('ok')"`
Expected: `ok`

---

### Task 2: 前端依赖、类型与 LessonView 渲染管线

**Files:**
- Modify: `frontend/package.json`（经 npm install）
- Modify: `frontend/src/types.ts:39-42`
- Create: `frontend/src/components/MermaidDiagram.tsx`
- Modify: `frontend/src/components/LessonView.tsx`
- Modify: `frontend/src/pages/Lesson.tsx:36`
- Modify: `frontend/src/styles.css`（文件尾部追加）

- [ ] **Step 1: 安装依赖**

```bash
cd frontend && npm install mermaid && npm install -D jsdom
```

`mermaid` 用于渲染；`jsdom` 供 Task 4 的校验脚本在 Node 里跑 `mermaid.parse`（mermaid v11 import 时需要 DOM，实测纯 Node 报 `DOMPurify.addHook is not a function`，注入 jsdom 全局后可用）。

- [ ] **Step 2: types.ts 加字段**

`LessonResponse`（第 39–42 行）改为：

```ts
export interface LessonResponse {
  chapter: {
    id: string
    title: string
    goal: string
    diagram: string
    animation: string
  }
  lesson: LessonContent
}
```

- [ ] **Step 3: 新建 MermaidDiagram 组件**

`frontend/src/components/MermaidDiagram.tsx`：

```tsx
import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })

export default function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const id = `mmd-${Math.random().toString(36).slice(2)}`
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [code])

  if (error) return <p className="muted">流程图渲染失败：{error}</p>
  return <div ref={containerRef} className="mermaid-box" />
}
```

（随机 id 让 React 18 StrictMode 下 effect 双跑时两次渲染互不冲突。）

- [ ] **Step 4: LessonView 接收并渲染两字段**

`frontend/src/components/LessonView.tsx` 整体替换为：

```tsx
import type { LessonContent } from '../types'
import AnimationHost from './animations'
import MermaidDiagram from './MermaidDiagram'

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="lesson-section">
      <h3>{title}</h3>
      <p className="text-block">{body}</p>
    </div>
  )
}

export default function LessonView({
  content,
  diagram = '',
  animation = '',
}: {
  content: LessonContent
  diagram?: string
  animation?: string
}) {
  return (
    <div className="lesson">
      <div className="callout">{content.conclusion}</div>
      <Section title="展开" body={content.explanation} />
      {diagram ? (
        <div className="lesson-section">
          <h3>本章流程图</h3>
          <MermaidDiagram code={diagram} />
        </div>
      ) : null}
      {animation ? (
        <div className="lesson-section">
          <h3>动态演示</h3>
          <AnimationHost kind={animation} />
        </div>
      ) : null}
      <Section title="类比" body={content.analogy} />
      <Section title="实践" body={content.practice} />
    </div>
  )
}
```

（此刻 `./animations` 尚不存在——先建占位，Step 5 一并完成后再 typecheck。）

- [ ] **Step 5: 新建 animations 目录的最小映射**

`frontend/src/components/animations/index.tsx`（Task 8 起逐个填充）：

```tsx
import type { ComponentType } from 'react'

// chapter.animation 枚举 → 动画组件。未注册的值静默不渲染（向后兼容）。
const ANIMATIONS: Record<string, ComponentType> = {}

export default function AnimationHost({ kind }: { kind: string }) {
  const Cmp = ANIMATIONS[kind]
  if (!Cmp) return null
  return <Cmp />
}
```

- [ ] **Step 6: Lesson.tsx 透传字段**

`frontend/src/pages/Lesson.tsx` 第 36 行改为：

```tsx
      <LessonView
        content={data!.lesson}
        diagram={data!.chapter.diagram}
        animation={data!.chapter.animation}
      />
```

- [ ] **Step 7: styles.css 尾部追加样式**

```css
/* ---------- 课程配图与动画 ---------- */
.mermaid-box {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  overflow-x: auto;
}
.mermaid-box svg {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}
.animation-box {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
}
.animation-box svg {
  width: 100%;
  height: auto;
  display: block;
}
.anim-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}
.anim-controls label {
  font-size: 14px;
  color: var(--muted);
  white-space: nowrap;
}
.anim-controls input[type='range'] {
  flex: 1;
  accent-color: var(--accent);
}
.anim-caption {
  font-size: 13px;
  color: var(--muted);
  margin: 6px 0 0;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 8: 验证**

```bash
cd frontend && npm run typecheck && npm run build
```
Expected: 两者均无报错退出。

---

### Task 3: mermaid 语法批量校验脚本

**Files:**
- Create: `frontend/scripts/validate-diagrams.mjs`

- [ ] **Step 1: 写脚本**

```js
// 校验 curriculum/**/*.json 里所有 chapter.diagram 的 mermaid 语法。
// mermaid v11 在 Node 下 import 需要 DOM，先注入 jsdom 全局再动态 import。
// 用法：cd frontend && node scripts/validate-diagrams.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
})
const { default: mermaid } = await import('mermaid')
mermaid.initialize({ startOnLoad: false })

const COURSES = ['ai-agent', 'fastapi', 'machine-learning']
let chapters = 0
let diagrams = 0
let animations = 0
let failed = 0
const missing = []

for (const course of COURSES) {
  const dir = join(root, 'curriculum', course)
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const mod = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    for (const ch of mod.chapters) {
      chapters++
      if (ch.animation) animations++
      if (!ch.diagram) {
        missing.push(`${course}/${f} ${ch.id} ${ch.title}`)
        continue
      }
      diagrams++
      try {
        await mermaid.parse(ch.diagram)
      } catch (e) {
        failed++
        console.error(`✗ ${course}/${f} ${ch.id} ${ch.title}\n  ${String(e).split('\n')[0]}`)
      }
    }
  }
}

console.log(`\n${chapters} chapters / ${diagrams} diagrams / ${animations} animations / ${failed} invalid`)
if (missing.length) console.log(`missing diagram (${missing.length}):\n  ${missing.join('\n  ')}`)
process.exit(failed ? 1 : 0)
```

- [ ] **Step 2: 空跑验证（此刻 0 diagram，应全部列入 missing 且退出码 0）**

```bash
cd frontend && node scripts/validate-diagrams.mjs; echo "exit=$?"
```
Expected: `80 chapters / 0 diagrams / 0 animations / 0 invalid`，`missing diagram (80)` 列表，`exit=0`。

---

### Task 4: ML 课 27 章 diagram + 4 章 animation

**Files:**
- Modify: `curriculum/machine-learning/module-0.json` ~ `module-5.json`（共 27 章插入字段）

- [ ] **Step 1: 写内容注入脚本**

建 `/tmp/inject_ml.py`（一次性，不进仓库）。DIAGRAMS dict 的 key 是章 id，值是 mermaid 源码字符串（Python 字面量里换行直接写 `\n`）；ANIMATIONS 挂 4 章：

```python
"""按行注入：在每个 chapter 的 "goal": 行后插 diagram / animation 行。只跑一次。"""
import json
import pathlib
import re

COURSE = "machine-learning"
DIAGRAMS = {
    "0.1": "flowchart TD\n  A[\"传统编程: 规则+数据→答案\"] --- B[机器学习反转]\n  C[数据+答案] --> D[学习算法]\n  D --> E[模型=学到的规则]\n  F[新数据] --> E\n  E --> G[预测]",
    "0.2": "flowchart TD\n  A[数据集] --> B{有标签?}\n  B -->|是| C[\"监督学习\"]\n  C --> D{标签连续?}\n  D -->|连续| E[回归]\n  D -->|离散| F[分类]\n  B -->|无标签| G[\"无监督学习\"]\n  G --> H[聚类]\n  G --> I[降维]\n  J[环境反馈] --> K[\"强化学习: 状态→动作→奖励循环\"]",
    # ……其余 25 章见下方主题表，按同样的字符串形式补全……
}
ANIMATIONS = {"1.2": "gradient-descent", "2.2": "decision-tree", "4.3": "backprop", "5.2": "convolution"}

root = pathlib.Path("curriculum") / COURSE
for f in sorted(root.glob("*.json")):
    lines = f.read_text(encoding="utf-8").splitlines(keepends=True)
    out = []
    chapter_id = None
    for line in lines:
        out.append(line)
        m = re.search(r'"id": "(\d+\.\d+)"', line)
        if m:
            chapter_id = m.group(1)
        if '"goal":' in line and chapter_id in DIAGRAMS:
            indent = line[: len(line) - len(line.lstrip())]
            out.append(f'{indent}"diagram": {json.dumps(DIAGRAMS[chapter_id], ensure_ascii=False)},\n')
            if chapter_id in ANIMATIONS:
                out.append(f'{indent}"animation": "{ANIMATIONS[chapter_id]}",\n')
    f.write_text("".join(out), encoding="utf-8")

# 自检：所有 JSON 仍合法、每章恰好一个 diagram
for f in sorted(root.glob("*.json")):
    mod = json.loads(f.read_text(encoding="utf-8"))
    for ch in mod["chapters"]:
        assert ch.get("diagram"), f"{f.name} {ch['id']} 缺 diagram"
print("injected ok")
```

（`re` 匹配 `\d+\.\d+` 只命中章 id，module 层的 `"id": "module-1"` 不会误配；`"goal":` 只在 chapter 层出现。）

- [ ] **Step 2: 按主题表补全 DIAGRAMS 的 27 条内容**

写作规范（每条都要过）：
1. `flowchart TD`（流程/层级）或 `flowchart LR`（链路/管道）。
2. 4–7 个节点，中文标签 + 英文术语/公式（`ŷ = w·x + b` 这类）。
3. 标签含 `(`/`)` 用引号形式 `A["损失 J(w)"]`；边标 `-->|文本|` 内禁括号；标签内禁 `{}`。
4. 有循环的画循环边（`D --> B`），有分支的用菱形 `C{条件?}`。
5. 每条 2–5 行，多行缩进两空格。

黄金标尺（成品参考，直接可用）：

```python
"1.2": "flowchart LR\n  A[\"数据 X, y\"] --> B[\"模型 ŷ = w·x + b\"]\n  B --> C[\"损失 J = MSE\"]\n  C -->|算梯度 ∇J| D[\"更新 w := w − α·∇J\"]\n  D --> B",
"1.1": "flowchart TD\n  A[\"数据点 x, y\"] --> B[\"预测 ŷ = w·x + b\"]\n  B --> C[\"残差 e = ŷ − y\"]\n  C --> D[\"平方 e² 再取均值 → MSE\"]\n  D --> E{调整 w, b}\n  E -->|MSE 变小| F[\"更好的拟合\"]\n  E --> B",
```

其余 25 章主题表（每行 = 该图必须出现的节点与流向，按规范转成 mermaid 字符串）：

| 章 | 节点与流向（→=边，? =菱形分支，⟲=循环边） |
|---|---|
| 0.3 | 向量→矩阵；矩阵×向量=线性变换（改变形状）；频率→概率 P(y∣x)→贝叶斯更新 |
| 0.4 | 读 CSV→`train_test_split`→`model.fit`→`model.predict`→`model.score`（sklearn 五步管道） |
| 1.3 | 模型复杂度→训练误差单调下降；同一轴上测试误差 U 型曲线；U 型最低点=最佳复杂度；左侧标欠拟合、右侧标过拟合 |
| 1.4 | MSE + λ·权重范数→新损失 J′；λ=0→过拟合分支；λ 太大→欠拟合分支；λ 适中→平衡分支（三路菱形） |
| 2.1 | z=w·x+b→σ(z) 映射到 0..1→概率 p→阈值 0.5 分支→类别；决策边界即 z=0 |
| 2.2 | 根节点全部数据→选最优特征+阈值（Gini 最小）→子节点⟲递归→叶子纯；旁路：多棵树→随机森林→投票 |
| 2.3 | 两类点→找最大间隔超平面→支持向量定边界；线性不可分分支→核技巧 φ(x) 升维→高维可分 |
| 2.4 | 预测结果×真实标签→混淆矩阵 TP/FP/FN/TN→Precision 与 Recall→F1；ROC 曲线扫阈值 |
| 2.5 | kNN：新样本→算距离→取 k 近邻→多数投票；NB：先验 P(c)×似然 P(x∣c)→后验→argmax |
| 3.1 | 随机初始化质心→每点归入最近质心→重算质心⟲直到收敛 |
| 3.2 | 数据中心化→协方差矩阵→特征值分解→按特征值排序取前 k 个特征向量→投影得低维数据（保留最大方差） |
| 3.3 | 原始数据→清洗缺失/异常→编码 One-Hot 与标准化→构造组合特征→特征表进模型 |
| 3.4 | 超参网格×K 折划分→每组合每折训练+验证→平均分→选最优组合→全量数据重训 |
| 4.1 | 感知机：输入×权重求和→阶跃函数输出；XOR 数据不可分分支→加隐藏层→MLP 可分 |
| 4.2 | 输入 x→线性 z=W·x+b→激活 a=σ(z)→下一层⟲逐层→输出 ŷ→损失 E |
| 4.3 | 损失 E→对输出层权重的梯度→链式法则逐层回传到输入层→得到所有 ∂E/∂w |
| 4.4 | SGD→+动量→RMSProp→Adam（动量+自适应步长）演进链；旁路技巧：BatchNorm、Dropout、早停 |
| 4.5 | 图片 28×28→展平 784→MLP 784→128→10→softmax→交叉熵损失→反向传播更新⟲训练循环→测试集准确率 |
| 5.1 | tensor 运算→autograd 记录计算图→loss.backward() 求梯度→optimizer.step() 更新→zero_grad()⟲ |
| 5.2 | 输入图→卷积层提取特征图→池化降采样⟲堆叠→展平→全连接→softmax 分类；标注卷积核权重共享 |
| 5.3 | 序列 x₁..xₜ→hₜ = f(xₜ, hₜ₋₁) 逐步递推→输出；LSTM 分支：遗忘门/输入门/输出门控制信息流 |
| 5.4 | 词嵌入+位置编码→自注意力 Q·Kᵀ/√d→softmax 权重→加权求和 V→多头并行→前馈层⟲堆叠 N 层 |
| 5.5 | 训练完成→过拟合?分支→正则化/数据增强/学习率调度→验证达标→导出 ONNX→部署为推理 API |

（0.1、0.2、1.1、1.2 四条已有成品，直接抄进脚本。）

- [ ] **Step 3: 执行注入并自检**

```bash
python3 /tmp/inject_ml.py
```
Expected: `injected ok`（断言失败说明漏章，补齐重跑前先 `git checkout -- curriculum/machine-learning/` 还原）

- [ ] **Step 4: 语法校验**

```bash
cd frontend && node scripts/validate-diagrams.mjs
```
Expected: `27 chapters / 27 diagrams / 4 animations / 0 invalid`，无 missing。

- [ ] **Step 5: 抽查 diff**

```bash
git diff curriculum/machine-learning/module-1.json
```
Expected: 只有 goal 行后新增 `diagram`/`animation` 行，concepts 紧凑格式未被改动。

---

### Task 5: ai-agent 课 26 章 diagram

**Files:**
- Modify: `curriculum/ai-agent/module-0.json` ~ `module-5.json`（26 章）

- [ ] **Step 1: 复用注入脚本换内容**

复制 `/tmp/inject_ml.py` 为 `/tmp/inject_ai_agent.py`，改 `COURSE = "ai-agent"`、`ANIMATIONS = {}`，按下方主题表写 26 条 DIAGRAMS（规范与黄金标尺同 Task 4）。

黄金标尺（成品，直接抄）：

```python
"0.1": "flowchart LR\n  A[用户目标] --> B[\"LLM 思考\"]\n  B --> C{需要工具?}\n  C -->|是| D[调用工具]\n  D --> E[观察结果]\n  E --> B\n  C -->|否| F[\"最终回答 = 目标达成\"]",
"2.3": "flowchart TD\n  A[\"用户消息进 messages\"] --> B{\"LLM 返回 tool_use?\"}\n  B -->|是| C[解析工具名+参数]\n  C --> D[执行工具]\n  D --> E[\"结果作为 tool_result 回填 messages\"]\n  E --> B\n  B -->|否| F[\"stop_reason=end → 输出最终回答\"]",
```

主题表：

| 章 | 节点与流向 |
|---|---|
| 0.2 | prompt→tokenizer 切分→模型逐 token 预测→概率分布→采样→拼接输出；上下文=有限滑动窗口 |
| 0.3 | `pip install anthropic`→设 API key→`client.messages.create`→解析响应 content |
| 0.4 | 能力阶梯 L0 裸 LLM→L1 +工具→L2 +循环→L3 +规划/记忆→L4 多智能体（每级标注新增能力） |
| 1.1 | prompt 五段：角色→任务→上下文→输出格式→约束；每段指向"影响模型的注意力方向" |
| 1.2 | Few-shot：示例₁+示例₂→新问题→模仿示例格式推理→答案；CoT：问题→先分步思考→再给答案（对比双路） |
| 1.3 | 需求→定义 JSON Schema→强制工具调用→返回结构化数据→校验分支→失败则带错误重试 |
| 1.4 | 测试集→跑 prompt v1/v2/v3→逐例打分（规则或 LLM 裁判）→汇总对比→选最优迭代⟲ |
| 2.1 | LLM 局限三例：不能精确算术/不知道实时信息/不能操作文件→工具补足→LLM+工具=手眼脑 |
| 2.2 | 功能描述→name+description+parameters JSON Schema→LLM 读 schema 理解→生成正确调用参数 |
| 2.4 | 调用工具→成功分支→结果回填；失败分支→错误信息也回填 LLM→LLM 重试或换方法→多次失败→兜底降级 |
| 3.1 | 任务 token 预算→分项估算：系统/历史/工具结果→超限?分支→截断或摘要压缩→重组上下文 |
| 3.2 | 离线：文档→切块→embedding→向量库；在线：查询→embedding→相似检索 top-k→拼进上下文→LLM 作答 |
| 3.3 | 短期记忆=上下文窗口（易失）→写外部存储（文件/向量库）→需要时检索回填→长期记忆 |
| 3.4 | 各工具散落→MCP server 统一暴露→client 发现工具列表→标准化调用；标注 USB-C 类比 |
| 4.1 | ReAct：思考→行动→观察⟲；Plan-and-Execute：先完整规划→逐步执行；Reflexion：执行→反思→修正⟲ |
| 4.2 | 目标→拆解子任务清单→逐个执行→检查完成度→有偏差?分支→修正计划→继续⟲ |
| 4.3 | 主控 agent 收任务→分派专家₁/专家₂/专家₃（各自独立 agentic loop）→汇总结果→主控校验合并 |
| 4.4 | 输入→权限检查→白名单?分支→高危操作先 dry-run/确认→执行→写审计日志 |
| 5.1 | 场景集→跑完整 agent 轨迹→逐例判分（规则/LLM 裁判/人工）→聚合报告→与基线对比防回归 |
| 5.2 | 每次请求→trace 下挂 span（LLM 调用/工具调用）→日志与指标导出→dashboard→异常告警 |
| 5.3 | 输入→输入护栏（注入检测）→agent 循环→输出护栏（格式/毒性校验）→通过放行/拦截分支 |
| 5.4 | token 用量×单价→成本统计；优化手段：prompt 缓存/换小模型/批处理→监控成本曲线 |
| 5.5 | 代码→容器化→CI 测试→部署→健康检查→失败回滚分支 |
| 5.6 | 数据分级→敏感数据脱敏→最小权限→操作审计→合规检查清单 |

- [ ] **Step 2: 执行注入 + 校验**

```bash
python3 /tmp/inject_ai_agent.py && cd frontend && node scripts/validate-diagrams.mjs
```
Expected: ai-agent 部分退出 missing；总计 `53 chapters / 53 diagrams / 4 animations / 0 invalid`。

- [ ] **Step 3: 抽查 diff**（同 Task 4 Step 5，文件换 `curriculum/ai-agent/module-0.json`）

---

### Task 6: fastapi 课 27 章 diagram

**Files:**
- Modify: `curriculum/fastapi/module-0.json` ~ `module-5.json`（27 章）

- [ ] **Step 1: 复用注入脚本换内容**

`/tmp/inject_fastapi.py`，`COURSE = "fastapi"`、`ANIMATIONS = {}`。

黄金标尺（成品，直接抄）：

```python
"0.1": "flowchart LR\n  A[浏览器] --> B[\"HTTP 请求: 方法+路径+头+体\"]\n  B --> C[服务器处理]\n  C --> D[\"HTTP 响应: 状态码+体\"]\n  D --> A",
"1.1": "flowchart LR\n  A[\"GET /items/42\"] --> B[路由匹配]\n  B --> C{\"int 类型校验\"}\n  C -->|通过| D[处理函数返回]\n  C -->|失败| E[\"422 Unprocessable Entity\"]",
```

主题表：

| 章 | 节点与流向 |
|---|---|
| 0.2 | 裸 ASGI：手写路由/解析/序列化 vs FastAPI：自动路由+Pydantic 校验+OpenAPI 文档+async；标注框架替你做的事 |
| 0.3 | `uvicorn` 启动→`FastAPI()` 实例→`@app.get` 注册路由→函数即处理逻辑→`/docs` 自动文档 |
| 0.4 | 请求进入事件循环→遇 `await` IO 让出→并发处理其它请求；对比：同步阻塞=排队 |
| 1.2 | `GET /items?skip=0&limit=10`→FastAPI 解析 query→默认值填充→函数参数→类型转换失败分支 422 |
| 1.3 | 客户端发 JSON→Pydantic 模型逐字段校验→通过则得到类型安全对象；失败→422+具体字段错误 |
| 1.4 | `multipart/form-data` 请求→`Form`/`File` 参数声明→解析表单字段与文件流 |
| 1.5 | 处理函数返回 dict→`response_model` 过滤→只留声明字段→序列化 JSON+状态码；防泄漏分支 |
| 2.1 | 字段声明 `Field(gt=0, max_length=…)`→请求进来逐约束校验→失败→422 带错误详情 |
| 2.2 | `Address` 模型嵌进 `User`→提交 JSON 递归校验→内外层都过才算有效；模型复用组合 |
| 2.3 | `@field_validator` 装饰器→自定义规则函数→通过/抛 `ValueError`→FastAPI 转 422 |
| 2.4 | `.env` 文件→`pydantic-settings` 读取→按类型注解转换→代码里 import Settings 使用；密钥不进 git |
| 3.1 | Python 类+`DeclarativeBase`→映射表结构→`create_all` 生成 SQL 建表 |
| 3.2 | 请求→`Depends(get_db)` 开 Session→CRUD 操作→`commit` 提交→响应后关闭 |
| 3.3 | async engine→async session→`await` 执行 SQL→不阻塞事件循环→高并发 |
| 3.4 | 改模型→`alembic revision --autogenerate`→生成迁移脚本（版本化）→`upgrade` 应用→版本表记录演进 |
| 4.1 | 依赖函数→注入路由参数→依赖可嵌套依赖→同一请求内结果缓存复用 |
| 4.2 | 请求→`@app.middleware` 前置逻辑→路由处理→后置逻辑（计时/加头）→响应；lifespan：启动建连接→关闭清理 |
| 4.3 | 注册：密码 hash 存储；登录→校验→签发 JWT→客户端携带 Bearer token→`Depends` 校验签名→放行受保护路由 |
| 4.4 | 异常→`HTTPException`→JSON 错误响应；未捕获异常→全局 handler 兜底→统一错误格式 |
| 4.5 | 请求→立即返回 202→`BackgroundTasks` 异步继续执行；WebSocket 分支：握手→双向帧通信 |
| 5.1 | `TestClient` 发请求→走完整 app→断言状态码与 JSON；pytest fixture 复用 app/db |
| 5.2 | 按功能拆 `APIRouter`→各自 prefix+tags→`include_router` 挂主 app→模块化目录 |
| 5.3 | 中间件捕获每请求→`logging` 结构化输出→聚合到收集器→按 trace 查询 |
| 5.4 | 代码→Dockerfile 打镜像→容器运行→`uvicorn --workers N` 多进程→前置负载均衡 |
| 5.5 | 上线清单：HTTPS→CORS 白名单→限流→输入校验→密钥管理→健康检查，逐项检查通过→上线 |

- [ ] **Step 2: 执行注入 + 校验**

```bash
python3 /tmp/inject_fastapi.py && cd frontend && node scripts/validate-diagrams.mjs
```
Expected: `80 chapters / 80 diagrams / 4 animations / 0 invalid`，无 missing。

- [ ] **Step 3: 抽查 diff**（同 Task 4 Step 5，文件换 `curriculum/fastapi/module-0.json`）

---

### Task 7: 共用配色 + GradientDescentAnimation + 注册

**Files:**
- Create: `frontend/src/components/animations/colors.ts`
- Create: `frontend/src/components/animations/GradientDescentAnimation.tsx`
- Modify: `frontend/src/components/animations/index.tsx`

- [ ] **Step 1: 新建 colors.ts**

```ts
// 动画组件共用配色（类别 blue/orange 与误差 red 均过 CVD 验证；蓝渐变为顺序色）。
export const BLUE = '#2a78d6'
export const ORANGE = '#eb6834'
export const RED = '#e34948'
export const MUTED = '#6b7280'
export const GRID = '#e5e7eb'
export const AXIS = '#c3c2b7'

// 顺序色：t∈[0,1] → 浅蓝 #cde2fb → 深蓝 #104281
export function sequentialBlue(t: number): string {
  const clamped = Math.min(1, Math.max(0, t))
  const from = [205, 226, 251]
  const to = [16, 66, 129]
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * clamped))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}
```

- [ ] **Step 2: 新建 GradientDescentAnimation.tsx**

```tsx
import { useEffect, useState } from 'react'
import { BLUE, MUTED, ORANGE, AXIS, GRID } from './colors'

// 损失 J(w) = 1.4(w−3)² + 0.3（J''=2.8，α>0.72 即发散，slider 上限 1.3 能演示震荡与发散）。
const W_MIN = -1.5
const W_MAX = 7.5
const W_START = -0.8
const loss = (w: number) => 1.4 * (w - 3) ** 2 + 0.3
const grad = (w: number) => 2.8 * (w - 3)

const WIDTH = 480
const HEIGHT = 300
const PAD = 44
const J_MAX = loss(W_MIN)
const sx = (w: number) => PAD + ((w - W_MIN) / (W_MAX - W_MIN)) * (WIDTH - 2 * PAD)
const sy = (j: number) => HEIGHT - PAD - (j / J_MAX) * (HEIGHT - 2 * PAD)
const CURVE = Array.from({ length: 121 }, (_, i) => {
  const w = W_MIN + ((W_MAX - W_MIN) * i) / 120
  return `${sx(w).toFixed(1)},${sy(loss(w)).toFixed(1)}`
}).join(' ')

interface Sim {
  w: number
  path: number[]
  diverged: boolean
}
const START: Sim = { w: W_START, path: [W_START], diverged: false }

export default function GradientDescentAnimation() {
  const [alpha, setAlpha] = useState(0.15)
  const [sim, setSim] = useState<Sim>(START)

  useEffect(() => {
    const timer = setInterval(() => {
      setSim(prev => {
        const next = prev.w - alpha * grad(prev.w)
        const out = next < W_MIN || next > W_MAX
        if (out || Math.abs(next - 3) < 0.015 || prev.path.length > 60) {
          return { ...START, diverged: out } // 收敛/发散/超长 → 重置重演
        }
        return { w: next, path: [...prev.path, next], diverged: false }
      })
    }, 420)
    return () => clearInterval(timer)
  }, [alpha])

  const trail = sim.path.map(w => `${sx(w).toFixed(1)},${sy(loss(w)).toFixed(1)}`).join(' ')

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="梯度下降动画">
        <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke={AXIS} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={HEIGHT - PAD} stroke={AXIS} />
        {[0, 2, 4, 6].map(t => (
          <text key={t} x={sx(t)} y={HEIGHT - PAD + 18} textAnchor="middle" fontSize="11" fill={MUTED}>
            {t}
          </text>
        ))}
        <text x={WIDTH - PAD} y={HEIGHT - PAD + 32} fontSize="11" fill={MUTED}>w</text>
        <text x={PAD - 32} y={PAD + 4} fontSize="11" fill={MUTED}>J(w)</text>
        <line x1={sx(3)} y1={sy(0)} x2={sx(3)} y2={sy(loss(3))} stroke={GRID} strokeDasharray="4 3" />
        <text x={sx(3)} y={sy(loss(3)) - 8} textAnchor="middle" fontSize="11" fill={MUTED}>w* = 3</text>
        <polyline points={CURVE} fill="none" stroke={BLUE} strokeWidth="2" />
        <polyline points={trail} fill="none" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
        <circle cx={sx(sim.w)} cy={sy(loss(sim.w))} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="anim-controls">
        <label>学习率 α = {alpha.toFixed(2)}</label>
        <input
          type="range" min="0.02" max="1.3" step="0.02" value={alpha}
          onChange={e => {
            setAlpha(Number(e.target.value))
            setSim(START)
          }}
        />
      </div>
      <p className="anim-caption">
        每步 w := w − α·∇J(w)；当前 w = {sim.w.toFixed(2)}，J(w) = {loss(sim.w).toFixed(2)}，
        第 {sim.path.length} 步{sim.diverged ? ' — 步子跨过谷底飞出去了：α 太大导致发散' : ''}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: 注册进 index.tsx**

```tsx
import type { ComponentType } from 'react'
import GradientDescentAnimation from './GradientDescentAnimation'

// chapter.animation 枚举 → 动画组件。未注册的值静默不渲染（向后兼容）。
const ANIMATIONS: Record<string, ComponentType> = {
  'gradient-descent': GradientDescentAnimation,
}

export default function AnimationHost({ kind }: { kind: string }) {
  const Cmp = ANIMATIONS[kind]
  if (!Cmp) return null
  return <Cmp />
}
```

- [ ] **Step 4: 验证**

```bash
cd frontend && npm run typecheck && npm run build
```
Expected: 通过。

---

### Task 8: BackpropAnimation

**Files:**
- Create: `frontend/src/components/animations/BackpropAnimation.tsx`
- Modify: `frontend/src/components/animations/index.tsx`

- [ ] **Step 1: 新建组件**

```tsx
import { useEffect, useState } from 'react'
import { BLUE, MUTED, RED, sequentialBlue } from './colors'

// 2→2→1 网络：sigmoid 激活 + 平方误差，每轮完整跑 前向→损失→反向→更新，E 逐轮变小。
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
  const d1 = [0, 1].map(j => (d2 * net.w2[j]) * a1[j] * (1 - a1[j])) // 逐层回传的隐藏层 δ
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
  update: '⑥ 按 w := w − α·δ·a 更新全部权重',
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
      <circle cx={x} cy={y} r="18" fill={sequentialBlue(active ? 0.75 : 0.15)} stroke={AXIS_STROKE} strokeWidth="1" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fill="#fff">{value}</text>
    </g>
  )
}
const AXIS_STROKE = '#c3c2b7'

export default function BackpropAnimation() {
  const [alpha, setAlpha] = useState(0.5)
  const [net, setNet] = useState<Net>(INIT)
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIdx(prev => {
        if (PHASES[prev] === 'b2') setNet(n => trained(n, alpha)) // b2 结束时应用更新
        return (prev + 1) % PHASES.length
      })
    }, 700)
    return () => clearInterval(timer)
  }, [alpha])

  const phase = PHASES[phaseIdx]
  const { a1, a2, loss } = forward(net)
  const hot = (p: Phase) => phase === p
  const edgeStyle = (on: boolean, backward: boolean) => ({
    stroke: on ? (backward ? RED : BLUE) : GRID,
    strokeWidth: on ? 3 : 1.5,
    opacity: on ? 1 : 0.8,
  })
  const weightText = (w: number) => w.toFixed(2)

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="反向传播动画">
        {/* 输入→隐藏 4 条边 */}
        {NODES.input.map((i, ii) =>
          NODES.hidden.map((h, hj) => (
            <line key={`e1-${ii}-${hj}`} x1={i.x + 18} y1={i.y} x2={h.x - 18} y2={h.y} {...edgeStyle(hot('f1'), hot('b2'))} />
          )),
        )}
        {/* 隐藏→输出 2 条边 */}
        {NODES.hidden.map((h, j) => (
          <line key={`e2-${j}`} x1={h.x + 18} y1={h.y} x2={NODES.output[0].x - 18} y2={NODES.output[0].y} {...edgeStyle(hot('f2'), hot('b1'))} />
        ))}
        {/* 边上的权重 */}
        {NODES.hidden.map((h, j) => (
          <text key={`w2-${j}`} x={(h.x + NODES.output[0].x) / 2} y={NODES.output[0].y + (j === 0 ? -18 : 26)} textAnchor="middle" fontSize="11" fill={MUTED}>
            w={weightText(net.w2[j])}
          </text>
        ))}
        {NODES.input.map((i, ii) =>
          NODES.hidden.map((h, hj) => (
            <text key={`w1-${ii}-${hj}`} x={(i.x + h.x) / 2 + (ii === 0 ? -12 : 12)} y={(i.y + h.y) / 2 + (hj === 0 ? -8 : 14)} textAnchor="middle" fontSize="10" fill={MUTED}>
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
          {hot('loss') ? `E = ${loss.toFixed(4)}（目标 t = ${TARGET}）` : ''}
        </text>
      </svg>
      <div className="anim-controls">
        <label>学习率 α = {alpha.toFixed(2)}</label>
        <input type="range" min="0.1" max="1.5" step="0.05" value={alpha} onChange={e => setAlpha(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {PHASE_NOTE[phase]}｜第 {net.round} 轮，E = {loss.toFixed(4)}（每轮更新后变小）
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 注册**

`index.tsx` 加 import 并注册 `'backprop': BackpropAnimation`。

- [ ] **Step 3: 验证** `cd frontend && npm run typecheck && npm run build`

---

### Task 9: ConvolutionAnimation

**Files:**
- Create: `frontend/src/components/animations/ConvolutionAnimation.tsx`
- Modify: `frontend/src/components/animations/index.tsx`

- [ ] **Step 1: 新建组件**

```tsx
import { useEffect, useState } from 'react'
import { BLUE, MUTED, GRID, sequentialBlue } from './colors'

// 5×5 输入（左 1 右 0，一条竖直边缘）× 3×3 垂直边缘核 → 输出中间列出现强响应。
const INPUT = [
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
]
const KERNEL = [
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, -1],
]

const CELL = 46
const GAP = 5
const step = CELL + GAP
const IN_X = 24
const IN_Y = 64
const K_X = 330
const K_Y = 110
const OUT_X = 500
const OUT_Y = 110
const WIDTH = 660
const HEIGHT = 330

export default function ConvolutionAnimation() {
  const [stride, setStride] = useState(1)
  const [pos, setPos] = useState(0)

  const outSize = stride === 1 ? 3 : 2 // 5×5 输入、3×3 核：stride1→3×3，stride2→2×2
  const cells = outSize * outSize
  useEffect(() => {
    const timer = setInterval(() => setPos(p => (p + 1) % cells), 550)
    return () => clearInterval(timer)
  }, [cells])

  const r = Math.floor(pos / outSize) * stride // 当前窗口左上角（输入网格坐标）
  const c = (pos % outSize) * stride
  const conv = (rr: number, cc: number) =>
    KERNEL.reduce((sum, krow, i) => sum + krow.reduce((s, k, j) => s + k * INPUT[rr + i][cc + j], 0), 0)
  const cellPos = (x0: number, y0: number, i: number, j: number) => ({ x: x0 + j * step, y: y0 + i * step })

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="卷积滑动动画">
        <text x={IN_X} y={IN_Y - 14} fontSize="12" fill={MUTED}>输入 5×5</text>
        {INPUT.map((row, i) =>
          row.map((v, j) => {
            const { x, y } = cellPos(IN_X, IN_Y, i, j)
            return (
              <g key={`in-${i}-${j}`}>
                <rect x={x} y={y} width={CELL} height={CELL} rx="4" fill={sequentialBlue(v * 0.85)} stroke={GRID} />
                <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" fontSize="13" fill={v > 0.5 ? '#fff' : MUTED}>{v}</text>
              </g>
            )
          }),
        )}
        {/* 当前 3×3 窗口描边 */}
        <rect x={IN_X + c * step - 2} y={IN_Y + r * step - 2} width={3 * CELL + 2 * GAP + 4} height={3 * CELL + 2 * GAP + 4} rx="6" fill="none" stroke={BLUE} strokeWidth="3" />

        <text x={K_X} y={IN_Y - 14} fontSize="12" fill={MUTED}>卷积核 3×3</text>
        {KERNEL.map((row, i) =>
          row.map((v, j) => {
            const { x, y } = cellPos(K_X, K_Y, i, j)
            const fill = v === 1 ? '#9ec5f4' : v === -1 ? '#f3b8b7' : '#fff'
            return (
              <g key={`k-${i}-${j}`}>
                <rect x={x} y={y} width={CELL} height={CELL} rx="4" fill={fill} stroke={GRID} />
                <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" fontSize="13" fill={v === 0 ? MUTED : '#1f2328'}>{v}</text>
              </g>
            )
          }),
        )}
        <text x={K_X + CELL * 1.5} y={K_Y + 3 * step + 24} textAnchor="middle" fontSize="11" fill={MUTED}>⊛</text>

        <text x={OUT_X} y={IN_Y - 14} fontSize="12" fill={MUTED}>输出 {outSize}×{outSize}</text>
        {Array.from({ length: cells }, (_, p) => {
          const or = Math.floor(p / outSize) * stride
          const oc = (p % outSize) * stride
          const v = conv(or, oc)
          const { x, y } = cellPos(OUT_X, OUT_Y, Math.floor(p / outSize), p % outSize)
          const filled = p <= pos
          return (
            <g key={`out-${p}`}>
              <rect x={x} y={y} width={CELL} height={CELL} rx="4"
                fill={filled ? sequentialBlue(Math.abs(v) / 3) : '#fff'}
                stroke={p === pos ? BLUE : GRID} strokeWidth={p === pos ? 3 : 1} />
              <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" fontSize="13"
                fill={filled && Math.abs(v) > 1.5 ? '#fff' : MUTED}>
                {filled ? v : ''}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label>stride = {stride}</label>
        <input type="range" min="1" max="2" step="1" value={stride} onChange={e => { setStride(Number(e.target.value)); setPos(0) }} />
      </div>
      <p className="anim-caption">
        窗口滑到第 ({r}, {c}) 格：output = Σ 输入窗口 ⊛ 核 = {conv(r, c)}；输入里 1/0 的竖直边界，在输出中间列变成强响应——这就是「边缘检测」
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 注册** `'convolution': ConvolutionAnimation`

- [ ] **Step 3: 验证** `cd frontend && npm run typecheck && npm run build`

---

### Task 10: DecisionTreeAnimation

**Files:**
- Create: `frontend/src/components/animations/DecisionTreeAnimation.tsx`
- Modify: `frontend/src/components/animations/index.tsx`

- [ ] **Step 1: 新建组件**

```tsx
import { useEffect, useState } from 'react'
import { AXIS, BLUE, ORANGE } from './colors'

// 24 个点：blue 聚左下/右上，orange 聚左上/右下（XOR 型），外加 2 个噪声点。
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

// 完全二叉树层序切分：节点 k 的切分是 SPLITS[k]，depth d 的叶子是节点 2^d−1 … 2^(d+1)−2。
const SPLITS: { axis: 'x' | 'y'; threshold: number }[] = [
  { axis: 'x', threshold: 2.0 }, // depth1：左右分
  { axis: 'y', threshold: 2.0 }, // depth2 左：左下 / 左上
  { axis: 'y', threshold: 2.0 }, // depth2 右：右下 / 右上
  { axis: 'y', threshold: 2.4 }, // depth3：把左上区噪声点隔出来
  { axis: 'x', threshold: 2.5 }, // depth3：右上区噪声点单独成叶
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

const gini = (pts: Pt[]) => {
  if (!pts.length) return 0
  const p = pts.filter(q => q.label === 0).length / pts.length
  return 1 - p * p - (1 - p) * (1 - p)
}

export default function DecisionTreeAnimation() {
  const [depth, setDepth] = useState(1)
  useEffect(() => {
    const timer = setInterval(() => setDepth(d => (d >= 3 ? 1 : d + 1)), 950)
    return () => clearInterval(timer)
  }, [])

  const leaves = regionsAt(depth)
  const leafInfo = leaves.map(r => {
    const pts = POINTS.filter(p => p.x >= r.xmin && p.x < r.xmax && p.y >= r.ymin && p.y < r.ymax)
    const zeros = pts.filter(p => p.label === 0).length
    return { r, n: pts.length, gini: gini(pts), majority: zeros * 2 > pts.length ? 'blue' : 'orange' }
  })
  const totalGini = leafInfo.reduce((s, l) => s + (l.gini * l.n) / POINTS.length, 0)

  // 当前 depth 新画的刀（层序 2^(depth−1)−1 … 2^depth−2）高亮，旧刀变淡。
  const isNew = (node: number, d: number) => node >= 2 ** (d - 1) - 1 && node <= 2 ** d - 2

  const splitLines = (d: number) => {
    const out: { x1: number; y1: number; x2: number; y2: number; node: number }[] = []
    const walk = (node: number, r: Region) => {
      if (r.depth >= d || node >= SPLITS.length) return
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

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="决策树切分动画">
        <rect x={PAD} y={PAD} width={WIDTH - 2 * PAD} height={HEIGHT - 2 * PAD} fill="none" stroke={AXIS} />
        {splitLines(depth).map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={isNew(l.node, depth) ? BLUE : AXIS} strokeWidth={isNew(l.node, depth) ? 2.5 : 1.5}
            strokeDasharray={isNew(l.node, depth) ? undefined : '4 3'} />
        ))}
        {POINTS.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="6"
            fill={p.label === 0 ? BLUE : ORANGE} stroke="#fff" strokeWidth="1.5" />
        ))}
        {leafInfo.map((l, i) => (
          <text key={i} x={sx((l.r.xmin + l.r.xmax) / 2)} y={sy((l.r.ymin + l.r.ymax) / 2)}
            textAnchor="middle" fontSize="11" fill="#6b7280">
            {l.n ? `Gini ${l.gini.toFixed(2)}` : ''}
          </text>
        ))}
        <text x={WIDTH - PAD} y={HEIGHT - PAD + 16} textAnchor="end" fontSize="11" fill="#6b7280">特征 x →</text>
        <text x={PAD - 28} y={PAD + 4} fontSize="11" fill="#6b7280">特征 y</text>
      </svg>
      <div className="anim-controls">
        <label>树的深度 = {depth}</label>
        <input type="range" min="1" max="3" step="1" value={depth} onChange={e => setDepth(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        每一刀选「让两侧 Gini 纯度最优」的切分：当前 {leafInfo.length} 个叶区域，加权 Gini = {totalGini.toFixed(3)}（越切越纯；深度过头会把噪声也记住=过拟合）
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 注册** `'decision-tree': DecisionTreeAnimation`

- [ ] **Step 3: 验证** `cd frontend && npm run typecheck && npm run build`

---

### Task 11: 总验证（对应 spec 成功标准）

- [ ] **Step 1: 全部静态检查**

```bash
cd frontend && npm run typecheck && npm run build && node scripts/validate-diagrams.mjs
python3 -c "from src.main import app; print('backend ok')"
```
Expected: 全部通过；`80 chapters / 80 diagrams / 4 animations / 0 invalid`。

- [ ] **Step 2: 起后端冒烟 lesson 接口字段**（会用少量 token，一次调用）

```bash
python3 -m uvicorn src.main:app --port 8010 &
sleep 2
curl -s -X POST localhost:8010/api/courses/machine-learning/chapters/1.2/lesson | python3 -c "
import json,sys
d = json.load(sys.stdin)
ch = d['chapter']
print('diagram head:', ch['diagram'][:40])
print('animation:', ch['animation'])
"
curl -s -X POST localhost:8010/api/courses/ai-agent/chapters/0.1/lesson | python3 -c "
import json,sys; ch = json.load(sys.stdin)['chapter']; print('ai-agent 0.1 animation:', repr(ch.get('animation')), 'diagram:', bool(ch['diagram']))"
# 验完 kill 该 uvicorn
```
Expected: ML 1.2 返回 `"animation": "gradient-descent"` 与非空 diagram；ai-agent 0.1 有 diagram、animation 为 `''`。

- [ ] **Step 3: 前端渲染冒烟**

```bash
cd frontend && npm run build && (python3 -m uvicorn src.main:app --port 8011 &) && sleep 2
open http://localhost:8011/#/course/machine-learning/lesson/1.2
```
人眼检查：流程图 SVG 渲染、动画自动播放、slider 可调、老章节（如 fastapi 0.1 有图、任一课 quiz 页）无报错。验证后 kill uvicorn。

---

### Task 12: 统一提交（需用户确认）

- [ ] **Step 1: 展示变更摘要给用户**

```bash
git status --short && git diff --stat
```
向用户列出：改动文件清单（18 个课程 JSON、main.py、前端 7 个新文件 + 4 个改动、styles.css、package.json、package-lock.json、spec 与 plan 文档），确认后继续。

- [ ] **Step 2: 提交（用户确认后执行）**

```bash
git add -A
git commit -m "Add mermaid diagrams for all 80 chapters and 4 interactive SVG animations"
```

---

## Self-Review 记录

- **Spec 覆盖**：§① 数据字段（Task 4–6）✓；§② 后端一处改动（Task 1）✓；§③ 前端依赖/类型/MermaidDiagram/4 动画/LessonView（Task 2、7–10）✓；§④ 80 章 mermaid + 4 动画（Task 4–6、7–10）✓；成功标准 1–6 由 Task 11 + 各任务验证步骤覆盖 ✓；Non-goals 未引入 D3/ECharts、未改 quiz 链路（Task 1 明确只改 lesson）✓。
- **占位符扫描**：Task 4 Step 1 脚本内 `# ……其余 25 章……` 注释指向紧随的主题表（27 条内容全量在表/成品中给出），非悬空 TODO。无其他占位符。
- **类型一致性**：`AnimationHost({ kind }: { kind: string })` 与 LessonView 调用一致；`LessonResponse.chapter` 字段与 main.py 返回键一致；`sequentialBlue` 在 colors.ts 定义、Backprop/Convolution 引用一致；GradientDescent 的 `Sim`、Backprop 的 `Net/Phase` 各自局部使用无交叉。
- **已知风险**：动画代码为计划期定稿、未经运行验证——Task 7–10 每任务后的 typecheck 与 Task 11 Step 3 的人眼冒烟是兜底；若 SVG 布局有重叠（如 backprop 权重标号位置），在对应任务内微调坐标即可，不影响结构。

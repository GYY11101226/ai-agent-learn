# 课程配图（流程图 + 动态图）设计

日期:2026-09-09

## 背景与目标

当前讲授是纯文本:后端让 LLM 返回 4 段文字（`conclusion/explanation/analogy/practice`），前端 `LessonView` 用 `<p>` 直接显示，不解析 markdown、无图表库。抽象概念（梯度、反向传播、训练流程）仅靠文字不易理解。

目标:给课程章节配**静态流程图**（Mermaid，三门课全覆盖）和**少数动态动画**（ML 课 4 个核心概念），帮助学员可视化理解。

## 已定决策

- 图形态:静态 Mermaid 流程图（每章）+ 4 个动态动画（仅 ML 课）。
- 图内容来源:**手写进 JSON**（`diagram` 字段存 mermaid 源码），不让 LLM 生成。
- 图**不进 LLM 讲授 prompt**:纯前端视觉补充，省 token、不干扰讲授。
- 动画交互深度:**自动播放 + 单 slider**（控制关键参数）。
- 范围:**全做**——80 章 mermaid + 4 个动画。

## Non-goals

- 不让 LLM 生成图（质量不可控、费 token）。
- 不做可拖拽/多点交互的复杂动画（只做「自动播放 + 单 slider」）。
- 不引入重型图表库（如 D3/ECharts）；动画用手写 React + SVG，流程图用 Mermaid。
- 不改测验/复习链路（图只出现在讲授页）。

---

## ① 数据层（课程 JSON）

每个 chapter 新增两个**可选**字段，向后兼容（没有的章节照旧不显示图）：

- `diagram`:字符串，Mermaid flowchart 源码。多行用 `\n` 转义（与现有 `code` 字段一致），UTF-8 编码。
- `animation`:枚举字符串，取值 `gradient-descent` / `backprop` / `convolution` / `decision-tree`，缺省为空。

示例（ML 课 1.2 梯度下降章）:

```json
{
  "diagram": "flowchart LR\n  A[数据 X, y] --> B[模型 ŷ = w·x + b]\n  B --> C[损失 J = 均值平方误差]\n  C -->|算梯度 ∇J| D[更新 w := w − α·∇J]\n  D --> B",
  "animation": "gradient-descent"
}
```

`animation` 仅挂 ML 课 4 章:

| 章节 | animation 值 |
|------|--------------|
| ML `1.2` 梯度下降 | `gradient-descent` |
| ML `2.2` 决策树 | `decision-tree` |
| ML `4.3` 反向传播 | `backprop` |
| ML `5.2` 卷积 | `convolution` |

## ② 后端（一处改动）

`src/main.py` 的 `lesson` 接口，返回 `chapter` 时带 `diagram`、`animation` 两个字段（图不进 `chapter_text`，讲授 prompt 不变）:

```python
return {
    "chapter": {
        "id": ch["id"], "title": ch["title"], "goal": ch.get("goal", ""),
        "diagram": ch.get("diagram", ""),
        "animation": ch.get("animation", ""),
    },
    "lesson": result.model_dump(),
}
```

`src/curriculum.py` 不改（`chapter_text` 不含图）。

## ③ 前端

### 依赖

```bash
cd frontend && npm install mermaid
```

### 类型

`frontend/src/types.ts` 的 `LessonResponse.chapter` 增加 `diagram: string`、`animation: string`。

### 组件

1. **`MermaidDiagram`**（新）:收 mermaid 源码 → `mermaid.render` 生成 SVG，插在讲授页「展开」段落之后。mermaid 渲染是异步的，用 `useRef` + `useEffect` 处理，组件卸载时清理节点。

2. **4 个动画组件**（新，放 `frontend/src/components/animations/`，均为 React + SVG，自动播放 + 单 slider）:
   - `GradientDescentAnimation` — 一维损失曲线 `J(w)` + 参数点沿梯度滚向最低点；slider 调学习率 α；直观展示 α 太大→震荡/发散、太小→慢收敛。
   - `BackpropAnimation` — 小网络 2 输入 → 2 隐藏 → 1 输出；误差信号从输出层沿边逐层回传（高亮流动的边）。
   - `ConvolutionAnimation` — 5×5 输入网格 + 3×3 滤波器；滤波器逐格滑动、高亮当前窗口并显示该窗口的加权和。
   - `DecisionTreeAnimation` — 二维散点按「特征 x < 阈值」逐层切分，展示纯度变化与树的生长。

3. **`LessonView`**（改）:按 `chapter.diagram` 渲染 `MermaidDiagram`，按 `chapter.animation` 渲染对应动画组件。两者都没有则原样渲染（向后兼容）。

## ④ 内容生产

### 80 章 mermaid 流程图

三门课每章手写一个 flowchart（`flowchart TD` 或 `LR`，中文标签 + 英文术语/公式），主题对应本章核心流程、结构或数据流。黄金标尺示例:

- ai-agent 章（Agent 循环）:`用户 → LLM 思考 → 调工具 → 观察结果 → 回到 LLM …直到目标达成`
- fastapi 章（请求链路）:`客户端 → 路由匹配 → 处理函数 → 响应`
- ML 章（训练流程）:`数据 → 前向 → 损失 → 反向(梯度) → 更新参数 → 循环`

### 4 个动画内容

见 §③，挂 ML 课 4 章（对应 §① 映射表）。每个动画组件 100–200 行，是本次最大的工作量。

---

## 成功标准

1. 三门课任一章进入讲授页，若该章配了 `diagram`，能渲染出对应 SVG 流程图；未配图的老章节不显示图、不报错。
2. ML 课 `1.2/2.2/4.3/5.2` 四章分别渲染对应动画组件，自动播放 + slider 可调。
3. 讲授内容（LLM 返回的四段文字）与改动前一致——图不进入 prompt，不额外消耗 token。
4. `lesson` 接口的 `chapter` 含 `diagram`/`animation` 字段。
5. 前端 `npm run typecheck` 与 `npm run build` 通过；后端 `python -c "import src.main"` 无异常。
6. 80 章 mermaid 全部合法（mermaid 语法可渲染；至少通过前端渲染冒烟）。
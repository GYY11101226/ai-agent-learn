# Dify 课程 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans 逐任务执行。步骤用 `- [ ]` 勾选追踪。
> 内容全量定义在 spec `docs/superpowers/specs/2026-09-16-dify-course-design.md`（§④ 大纲 26 章、§③ 动画规格、§⑤ 内容模板），本计划只承载文件级步骤与验证命令。

**Goal:** 新增「Dify 从入门到精通」课程（6 模块 26 章 + 4 交互动画），复用现有配图管线。

**Architecture:** 纯数据 + 前端组件交付。课程内容手写进 `curriculum/dify/module-0..5.json`（每章 `diagram` 必填、4 章挂 `animation`），`courses.json` 注册；4 个 SVG 动画组件落在 `frontend/src/components/animations/` 并在 `index.tsx` 注册。后端与验证脚本零改动（自动扫描目录）。

**Tech Stack:** JSON 课程数据 / React + SVG 动画（`colors.ts` 配色）/ mermaid 校验脚本 / FastAPI 后端不改。

---

## File Structure

**Create:**
- `curriculum/dify/module-0.json` — 预备·心智模型（4 章）
- `curriculum/dify/module-1.json` — 编排基础·节点与变量（4 章）
- `curriculum/dify/module-2.json` — 核心编排 Workflow/Chatflow（5 章，2 动画）
- `curriculum/dify/module-3.json` — 嵌入第三方应用·接口调用（5 章，2 动画）
- `curriculum/dify/module-4.json` — 封装与生产化（4 章）
- `curriculum/dify/module-5.json` — 实战（4 章）
- `frontend/src/components/animations/WorkflowNodeFlowAnimation.tsx`
- `frontend/src/components/animations/WorkflowVsChatflowAnimation.tsx`
- `frontend/src/components/animations/ApiEmbedAnimation.tsx`
- `frontend/src/components/animations/StreamingSseAnimation.tsx`

**Modify:**
- `curriculum/courses.json` — 追加 dify 条目
- `frontend/src/components/animations/index.tsx` — 注册 4 个枚举

**不动：** `src/main.py`、`src/curriculum.py`、`frontend/src/types.ts`、`frontend/scripts/validate-diagrams.mjs`、`frontend/src/styles.css`（`.animation-box/.anim-controls/.anim-caption` 已存在）。

---

## Task 1: 注册课程

**Files:** Modify `curriculum/courses.json`

- [ ] **Step 1** 在数组末尾（nginx 之后）追加：
```json
  {
    "id": "dify",
    "title": "Dify 从入门到精通",
    "description": "从可视化编排到工作流/会话流嵌入第三方应用，边做边学接口封装",
    "dir": "dify"
  }
```
（注意前一条 nginx 对象结尾加逗号。）

- [ ] **Step 2 验证**：`python3 -c "import json;json.load(open('curriculum/courses.json'))"` 无报错。

---

## Task 2–7: 课程 JSON（6 个模块，26 章）

每章严格按 spec §⑤ 模板与 §④ 大纲的 `id/title/goal/diagram 节点流向` 落地。每章字段：`id/title/goal/diagram/concepts[3]/code/todo("")/exercise/quiz_topics[3]`；其中 2.1/2.3/3.1/3.4 加 `animation`（值见 spec §① 表格）。

mermaid 铁律：节点标签引号包裹、标签内禁 `{}`、边标禁括号、`\n` 用 `\\n` 转义。每章 diagram 由 §④「diagram 节点流向」列转成 `flowchart TD/LR`（4–7 节点）。

**Files:** Create `curriculum/dify/module-0.json` … `module-5.json`

每章代码示例（Task 2 用 module-0.4 示范，其余模块遵循同构）：

```json
{
  "id": "module-0",
  "title": "预备：Dify 心智模型",
  "weeks": "第1周",
  "prerequisites": "有 LLM/API 基础即可",
  "chapters": [ { "id": "0.1", "title": "Dify 是什么：可视化 LLM 应用平台", "goal": "……", "diagram": "……", "concepts": [ {"name":"……","detail":"……"} ], "code": "", "todo": "", "exercise": "……", "quiz_topics": ["……"] } ]
}
```

`code` 字段统一写 Dify REST 调用片段（`requests`/`curl`/FastAPI 封装），无代码写 `""`。抽查要求：module-3 的 code 必须包含真实 `/chat-messages` 与 `/workflows/run` 调用示例（含 `Authorization: Bearer {api_key}`、`response_mode`、`conversation_id`、SSE 流解析）。

- [ ] **Step A** 写 module-0.json（0.1–0.4）
- [ ] **Step B** 写 module-1.json（1.1–1.4）
- [ ] **Step C** 写 module-2.json（2.1–2.5，2.1=`workflow-node-flow`、2.3=`workflow-vs-chatflow`）
- [ ] **Step D** 写 module-3.json（3.1–3.5，3.1=`api-embed`、3.4=`streaming-sse`）
- [ ] **Step E** 写 module-4.json（4.1–4.4）
- [ ] **Step F** 写 module-5.json（5.1–5.4）
- [ ] **Step G 验证**：`python3 -c "from src.curriculum import load_course_modules; print(len(load_course_modules('dify')))"` 输出 6。

---

## Task 8–11: 4 个动画组件

统一约定：React + SVG、`useEffect` + `setInterval` + cleanup、单 `input[type=range]` slider、`.animation-box/.anim-controls/.anim-caption`、配色 `import { BLUE, ORANGE, MUTED, GRID } from './colors'`。参照 `ReverseProxyAnimation.tsx`（单小球沿线往返）与 `CacheAnimation.tsx`（双 interval、状态切换）的既有写法。视觉与 slider 语义见 spec §③。

**Files:** Create `frontend/src/components/animations/*.tsx`

- [ ] **Task 8** `WorkflowNodeFlowAnimation.tsx` — 节点链 `开始→LLM→代码→结束`，小球沿线流动；slider 选节点高亮并显示输入→输出变量。默认导出函数组件 `export default function WorkflowNodeFlowAnimation()`。
- [ ] **Task 9** `WorkflowVsChatflowAnimation.tsx` — 左右两栏对照；slider 选轮次；右栏记忆块随轮次累积。导出 `WorkflowVsChatflowAnimation`。
- [ ] **Task 10** `ApiEmbedAnimation.tsx` — 左「第三方应用」→ 两 API 门 → 右「Dify」执行，请求/响应小球往返；slider 选协议。导出 `ApiEmbedAnimation`。
- [ ] **Task 11** `StreamingSseAnimation.tsx` — 上 blocking 整块、下 streaming 分块逐字点亮；slider 选进度。导出 `StreamingSseAnimation`。

---

## Task 12: 注册动画

**Files:** Modify `frontend/src/components/animations/index.tsx`

- [ ] **Step 1** 顶部追加 4 条 import。
- [ ] **Step 2** `ANIMATIONS` 对象追加：
```ts
  'workflow-node-flow': WorkflowNodeFlowAnimation,
  'workflow-vs-chatflow': WorkflowVsChatflowAnimation,
  'api-embed': ApiEmbedAnimation,
  'streaming-sse': StreamingSseAnimation,
```

---

## Task 13: 全量验证

- [ ] **Step 1** `cd frontend && node scripts/validate-diagrams.mjs` → `0 invalid / 0 missing`，dify 26 章全有 diagram、4 章有 animation。
- [ ] **Step 2** `cd frontend && npm run typecheck` → 无报错。
- [ ] **Step 3** `cd frontend && npm run build` → 通过。
- [ ] **Step 4** `python3 -c "from src.main import app"` → 无异常。
- [ ] **Step 5** 人眼冒烟：起后端+前端，进入 dify 课 2.1/2.3/3.1/3.4 渲染动画 + slider 可调，其余章渲染流程图；老课程不受影响。

---

## Self-Review 结论

- **Spec 覆盖**：§④ 26 章 → Task 2–7；§③ 4 动画 → Task 8–11；§① 注册/挂载 → Task 1/12；§⑥ 验证 → Task 13。全覆盖。
- **占位符**：JSON 章节正文（goal/concepts/diagram/detail 中文）由 §④ 大纲 + §⑤ 模板在 Task 2–7 内当场编写，非占位——执行时逐章产出，不引用「类似上章」。
- **类型一致**：animation 枚举值在 spec/课程 JSON/`index.tsx` 三处用同一串字符串（`workflow-node-flow` 等），组件默认导出名与 import 名一致。
# Dify 课程（聚焦「嵌入 + 接口」）设计

日期：2026-09-16

## 背景与目标

平台已有五门"从入门到精通"课程（ai-agent / fastapi / machine-learning / docker / nginx），均配 mermaid 流程图，ML / Docker / Nginx 三门另有 4 个交互式 SVG 动画。配图管线已成熟：内容手写进课程 JSON（`diagram`/`animation` 可选字段），后端 `lesson` 接口多返回两字段，前端 `MermaidDiagram` + 动画组件渲染。

目标：新增第 6 门课 **Dify 从入门到精通**，26 章全覆盖 mermaid 流程图，Dify 最核心的 4 个概念配交互式动画。课程范围经用户确认：**聚焦「工作流/会话流嵌入第三方应用 + 封装为接口调用」**——用一个模块压缩补齐 Dify 基础，其余五个模块围绕 Workflow / Chatflow 编排、API 接口调用与生产化展开。接口调用代码以**内容片段**形态提供（`code` 字段写真实可跑的 `requests`/`curl`/FastAPI 封装，不引额外 SDK），复用现有管线、不新增基础设施。

## 已定决策

- 大纲：6 模块（module-0..5）、26 章（下文 §④ 全量给出）。
- 每章配 mermaid 流程图（`diagram`），4 章额外配交互动画（`animation`）。
- 内容深浅：**对齐现有三门课**（每章 goal + 3 个 concept 各一句话 detail + code + exercise + quiz_topics）。
- `code` 字段写 **Dify REST API 调用片段**（Python `requests` / `curl` / FastAPI 封装），不写 Dify Python SDK。
- 动画 4 个：节点数据流、Workflow vs Chatflow 对比、API 嵌入全链路、流式响应 SSE。
- 交互模型沿用已有约定：**自动播放（setInterval + cleanup）+ 单 slider**，无暂停键，播到终点循环；配色复用 `colors.ts`。

## Non-goals

- 不改后端接口（`lesson` 已返回两字段）、不改 `types.ts`、不改 `src/curriculum.py`、不改 `src/main.py`。
- 不改 `validate-diagrams.mjs`（脚本 `readdirSync(curriculumDir)` 自动发现新目录）。
- 图不进 LLM 讲授 prompt（与现有课一致）。
- 不单独展开 Agent 模式、模型供应商管理、插件系统（基础压缩在 module-0/1，篇幅让给编排与接口）。
- 不做可运行的第三方 demo 目录（课程内容片段即可，见「范围已确认」）。
- 不改测验/复习链路。
- 章节正文不写 `TODO(人工)` 协作标记（整课一次性生成，非逐步引导）。

---

## ① 数据层

### 课程注册（`curriculum/courses.json`）

新增一条：

```json
{
  "id": "dify",
  "title": "Dify 从入门到精通",
  "description": "从可视化编排到工作流/会话流嵌入第三方应用，边做边学接口封装",
  "dir": "dify"
}
```

### 章节字段（`curriculum/dify/module-0..5.json`）

与现有课完全一致，每章：

```json
{
  "id": "3.1",
  "title": "API 接入全貌：两种协议与 App API Key",
  "goal": "……",
  "diagram": "flowchart TD\n  ……",
  "animation": "api-embed",
  "concepts": [ {"name": "……", "detail": "……"} ],
  "code": "……",
  "todo": "",
  "exercise": "……",
  "quiz_topics": ["……"]
}
```

`animation` 仅挂 4 章：

| 章节 | animation 值 | 组件 |
|------|-------------|------|
| 2.1 Workflow 编排：节点串接与数据流 | `workflow-node-flow` | `WorkflowNodeFlowAnimation` |
| 2.3 Workflow vs Chatflow：何时用哪个 | `workflow-vs-chatflow` | `WorkflowVsChatflowAnimation` |
| 3.1 API 接入全貌 | `api-embed` | `ApiEmbedAnimation` |
| 3.4 流式响应：blocking vs streaming | `streaming-sse` | `StreamingSseAnimation` |

## ② 后端 / 前端管线

- 后端 `src/main.py`：**零改动**。
- `frontend/src/types.ts`：零改动。
- `frontend/scripts/validate-diagrams.mjs`：零改动（自动扫描）。
- `frontend/src/components/animations/index.tsx`：注册 4 新枚举 → 新组件。

## ③ 4 个动画组件规格

统一约束：React + SVG（无第三方）、`viewBox` 约 480×300（对比/全链路类可更宽，如 560×300）、自动播放 `setInterval`（每组件 500–1100ms 步进）+ effect cleanup、单 slider。配色用 `colors.ts`（`BLUE #2a78d6` / `ORANGE #eb6834` / `RED #e34948` / `GRID #e5e7eb` / `AXIS #c3c2b7` / `MUTED #6b7280` / `sequentialBlue`）。

### 1. `WorkflowNodeFlowAnimation`（workflow-node-flow）
- **视觉**：横向节点链 `开始` → `LLM` → `代码` → `结束`，节点间连线，一个数据小球沿线从左流到右；节点上标输入/输出变量名（如 `query` / `result`）。
- **slider**：选中某个节点（0..节点数−1）。选中节点高亮，并显示其「输入 → 输出」变量。
- **自动播放**：小球从 `开始` 依次流经各节点到 `结束`，循环。
- **教学点**：节点即处理步骤；变量沿连线传递（前节点输出 = 后节点输入）。

### 2. `WorkflowVsChatflowAnimation`（workflow-vs-chatflow）
- **视觉**：左右两栏。左 = Workflow：`开始` → `处理` → `结束` 单次线性跑完即停。右 = Chatflow：`开始(聊天)` → `LLM` → `回答`，多轮循环箭头回到开始，带一块「会话/记忆」存储随轮次累积。
- **slider**：轮次（1..N）。Chatflow 侧高亮到第 N 轮、记忆块累积；Workflow 侧始终只跑一次。
- **自动播放**：左侧跑一次结束；右侧多轮循环、记忆累积，循环重播。
- **教学点**：Workflow = 一次性任务（审核/抽取/批量）；Chatflow = 多轮会话、记住上下文；选型呼应 2.3。

### 3. `ApiEmbedAnimation`（api-embed）
- **视觉**：左侧「第三方应用」（前端页面 / 自营后端）→ 中间两个 API 门（`/chat-messages`、`/workflows/run`）→ 右侧「Dify 服务器」执行节点 → 响应沿原路返回。
- **slider**：协议类型（1=`/chat-messages` 阻塞、2=`/chat-messages` 流式、3=`/workflows/run`）。
- **自动播放**：请求小球从左流到右，响应小球从右流回左，循环。
- **教学点**：第三方应用持 App API Key 调 Dify REST 接口；两种协议分工；结果回传给第三方应用自行处理（封装语义）。

### 4. `StreamingSseAnimation`（streaming-sse）
- **视觉**：上方 blocking：一个大 JSON 整块一次落下；下方 streaming：多个小 Message 块逐个到达，拼成一句话（如「你好，世界」）逐字点亮。
- **slider**：进度（0..块数）。streaming 侧显示到当前块；blocking 侧始终整块。
- **自动播放**：streaming 块逐块到达点亮，循环。
- **教学点**：blocking = 等全量、首字延迟高；streaming = 边生成边返回、首字快；SSE 每行 `data: {...}` 一个增量。

## ④ 课程大纲（26 章全量）

每章标注 `id / title / goal 一句话 / diagram 节点流向 / animation`。

### module-0 预备·Dify 心智模型（压缩基础）
| id | title | diagram 节点流向 |
|---|---|---|
| 0.1 | Dify 是什么：可视化 LLM 应用平台 | 可视化编排 → 搭 App（Chatbot/Agent/Workflow）；LLM 能力 → 编排层 → 多渠道接入 |
| 0.2 | 四大应用类型与两大编排模式 | 应用类型：Chatbot/文本生成/Agent/Workflow 分支；编排模式：Chatflow（对话流）∕ Workflow（工作流） |
| 0.3 | 两种使用方式：界面直连 vs API 嵌入 | Dify → ①界面内直接聊；Dify → ②App API Key → 嵌入第三方应用（主线） |
| 0.4 | 部署与第一个应用：拿到 App API Key | 部署/开通 → 建 Chatbot → 编排 → 发布 → 取 App API Key → 试调一次 |

### module-1 编排基础：节点与变量
| id | title | diagram 节点流向 |
|---|---|---|
| 1.1 | 节点体系：开始/LLM/条件/结束 | 开始 → LLM → 知识检索 → 条件 → 变量赋值 → 回答/结束 |
| 1.2 | 变量全景与作用域 | 输入变量 / 环境变量 / 会话变量 / 系统变量 四类 → 各自作用域 |
| 1.3 | 知识库与 RAG 节点 | 文档 → 切片 → 向量化 → 检索节点 → 拼进 LLM 上下文 → 回答 |
| 1.4 | 工具节点与 HTTP 请求节点 | 节点 → 调外部 API/工具 → 结果回传 → LLM 继续推理 |

### module-2 核心编排：Workflow 与 Chatflow
| id | title | diagram 节点流向 |
|---|---|---|
| 2.1 | Workflow 编排：节点串接与数据流 🔴 | 开始 → 输入 → LLM → 代码 → 结束；变量沿连线流动 → outputs | `workflow-node-flow` |
| 2.2 | Chatflow 编排：多轮对话与开始节点 | 开始(聊天型) → LLM → 回答；多轮 conversation_id → 上下文累积 |
| 2.3 | Workflow vs Chatflow：何时用哪个 🔴 | Workflow：输入→处理→输出一次跑完；Chatflow：多轮循环 + 记忆；选型决策 | `workflow-vs-chatflow` |
| 2.4 | 条件分支 / 问题分类 / 迭代 | 条件节点 → 分类路由；迭代节点 → 批量循环处理 → 结束 |
| 2.5 | 代码节点与 HTTP 请求节点进阶 | 输入 → 代码节点(Python 处理) → HTTP 请求(外部服务) → 合并 → 结束 |

### module-3 嵌入第三方应用：接口调用（核心）
| id | title | diagram 节点流向 |
|---|---|---|
| 3.1 | API 接入全貌：两种协议与 App API Key 🔴 | 第三方 App → [API Key] → /chat-messages 或 /workflows/run → Dify 执行 → 响应回传 | `api-embed` |
| 3.2 | 工作流接口 /workflows/run | POST /workflows/run → inputs → 同步返回 JSON outputs → 后端解析 |
| 3.3 | 对话流接口 /chat-messages | POST /chat-messages → query + conversation_id → 响应 → 多轮续接 |
| 3.4 | 流式响应：blocking vs streaming (SSE) 🔴 | response_mode=blocking → 一次性 JSON；=streaming → SSE 分块增量 | `streaming-sse` |
| 3.5 | 封装为接口：第三方后端包一层 | 前端 → 自营 FastAPI 接口 → [服务端 Key] → Dify API → 结果返回 |

### module-4 封装与生产化
| id | title | diagram 节点流向 |
|---|---|---|
| 4.1 | 认证与密钥管理 | App API Key 存服务端 → 环境变量注入 → 前端只调自营接口 → 不泄露 |
| 4.2 | 错误处理、超时与重试 | 请求 → 超时 → 指数退避重试 → 429/5xx 处理 → 降级兜底 |
| 4.3 | 会话管理与上下文 | conversation_id → 存储(内存/DB) → 多轮续接 → 上下文生命周期 |
| 4.4 | 观测与成本 | Dify 运行历史 → 复现/审计 → token 用量 → 成本管控 |

### module-5 实战：完整封装第三方应用
| id | title | diagram 节点流向 |
|---|---|---|
| 5.1 | 实战：文档问答 Chatflow 接进网站 | 知识库 → Chatflow → 封装后端接口 → 网站前端调用 |
| 5.2 | 实战：Workflow 封装同步接口 | Dify Workflow → FastAPI 路由 → 内部系统 POST 调用(审核/抽取) |
| 5.3 | 实战：SSE 流式前端接入 | 浏览器 fetch(stream) → 逐块读 SSE → 增量渲染打字效果 |
| 5.4 | 生产清单 | 密钥 → 超时 → 限流 → 成本 → 多模型 → 监控 逐项核对 |

## ⑤ 内容模板（每章字段写法）

- `goal`：一句话可验证的能力描述（"能……"），≤ 60 字。
- `concepts`：恰好 3 个 `{name, detail}`，detail 一句话（1–2 个分句）讲清一个点。
- `code`：Dify REST API 调用片段（requests / curl / FastAPI 封装），≤ 20 行，带 `# 注释` 说明端点与关键参数；无代码的章写 `""`。
- `exercise`：引导动手、不给答案的一句话实践题。
- `quiz_topics`：3 个关键词，用于出题。
- `diagram`：mermaid `flowchart TD` 或 `LR`，4–7 节点中文标签 + 英文术语，遵守既定 mermaid 铁律（括号走引号、标签禁 `{}`、边标禁括号、`\n` 转义、Unicode 符号可用）。

## ⑥ 验证（成功标准）

1. `frontend`：`npm run typecheck`、`npm run build` 均通过。
2. `node scripts/validate-diagrams.mjs`：dify 26 章全部有 diagram、4 章有 animation、`0 invalid / 0 missing`。
3. 后端 `python3 -c "from src.main import app"` 无异常。
4. Dify 课任一章进讲授页渲染流程图；`2.1/2.3/3.1/3.4` 四章渲染对应动画（自动播放 + slider 可调）；老课程照旧不受影响。
5. `courses.json` 与 `course_detail` 接口能列出第 6 门课。

## 已知风险

- 4 个动画组件为设计期定稿、未经运行验证；各组件 typecheck + 最终人眼冒烟兜底，SVG 布局若有重叠在对应组件内微调坐标即可。
- Dify API 存在版本差异（`/chat-messages`、`/workflows/run`、SSE 字段命名），`code` 字段按通用规范书写并在注释标注版本假设，不作为代码级正确性承诺。
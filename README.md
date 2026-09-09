# 多课程学习平台

一个前后端分离的交互式学习 Web 应用：**主页选课 → Tutor 讲授 → 测验批改 → 进度追踪 → 遗忘曲线复习**。
支持多门课程（加课 = 加一个 JSON 目录），每门课复用同一套 LLM 讲授/测验/复习机制。

技术栈：**React + Vite（SPA）+ FastAPI（JSON API）+ SQLite**。四角色（Tutor/Grader/Drill）
是同一个 LLM + 不同 system prompt，结构化数据通过「强制工具调用」获取。

## 快速开始

```bash
# 1. 后端依赖（建议用项目自带 .venv）
.venv/bin/pip install -r requirements.txt

# 2. 配置：复制模板并填入凭证（所有配置走 .env，不读系统环境变量）
cp .env.example .env

# 3. 前端依赖
cd frontend && npm install && cd ..

# ── 开发模式（两个终端）──────────────────────────
# 终端 1：后端 API（127.0.0.1:8000）
.venv/bin/python -m uvicorn src.main:app --reload --port 8000
# 终端 2：前端 dev server（localhost:5173，/api 自动代理到 8000）
cd frontend && npm run dev
# 浏览器打开 http://localhost:5173
# 注意：Vite 绑定在 IPv6 的 localhost 上，用 127.0.0.1:5173 访问会连不上。

# ── 单服务模式（FastAPI 直接托管前端构建产物）──────
cd frontend && npm run build && cd ..
.venv/bin/python -m uvicorn src.main:app --port 8000
# 浏览器打开 http://127.0.0.1:8000（API 与页面同源，无需前端进程）
```

## 配置（.env）

所有配置在项目根目录 `.env` 文件中（`config.py` 启动时用 python-dotenv 加载，
`.env` 优先于系统环境变量，且已被 `.gitignore` 忽略，不会进 git）。

**用 DeepSeek（OpenAI 兼容协议）**——在 [DeepSeek 开放平台](https://platform.deepseek.com)
创建 API Key，然后在 `.env` 填：

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-pro    # 2026-07 起 deepseek-chat 等旧名已下线
```

> ⚠️ `OPENAI_BASE_URL` 必须是 OpenAI 协议端点（`https://api.deepseek.com`）。
> 不要填 `https://api.deepseek.com/anthropic`——那是 Anthropic 协议端点，
> OpenAI SDK 会再拼一层 `/chat/completions`，得到不存在的路径 → 404。

**用火山方舟 Ark（Doubao 等，OpenAI 兼容协议）**——在[方舟控制台](https://console.volcengine.com/ark)
创建「推理接入点」拿到 `ep-xxx`、在「API Key 管理」创建密钥，然后在 `.env` 填：

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=<你的方舟 API Key>
OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
OPENAI_MODEL=ep-xxxxxxxx        # 推理接入点 ID（不是 ark-code-latest 之类）
```

**用 Claude（Anthropic）**——在 `.env` 填：

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-...
LEARNING_MODEL=claude-opus-5     # 想省钱跑测验可换 claude-haiku-4-5
```

> 说明：OpenAI 兼容服务和 Claude 的 Messages API 形状不同。代码在 `src/agents.py`
> 里按 `LLM_PROVIDER` 分发：`anthropic` → `_ask_anthropic` 走 `tool_use`，
> 其它任意值 → `_ask_openai_compatible` 走 `tool_calls`，两者都用「强制工具调用」拿
> 结构化数据，所以 Tutor/Grader/Drill 上层逻辑不变。
> 换模型后教学 prompt 的效果可能因模型能力不同而有差异，可按需调整 `src/agents.py` 里的系统提示词。

## 加一门新课

1. 新建目录 `curriculum/<课程id>/`，放入 `module-*.json`（模块结构参考 `curriculum/ai-agent/`）；
2. 在 `curriculum/courses.json` 里登记：`{"id", "title", "description", "dir"}`。

章节进度以全局键 `<course_id>:<chapter_id>`（如 `ai-agent:0.1`）存 SQLite，
多课程进度互不冲突。加课不需要改任何代码。

## API 与页面

| 前端页面 | 后端 API | 是否调 LLM |
|------|------|------|
| `/` 课程卡片 | `GET /api/courses`（目录 + 各课进度摘要） | 否 |
| `/course/:id` 章节列表 | `GET /api/courses/{id}` | 否 |
| `/course/:id/lesson/:ch` 讲授 | `POST /api/courses/{id}/chapters/{ch}/lesson` | **是** |
| `/course/:id/quiz/:ch` 测验 | `POST /api/courses/{id}/chapters/{ch}/quiz`（`?review=1` 为复习题） | **是** |
| ↳ 提交批改 | `POST /api/courses/{id}/chapters/{ch}/quiz/submit` | **是** |
| `/progress` 进度 | `GET /api/progress`（纯读库） | 否 |
| `/review` 到期复习 | `GET /api/review`（遗忘曲线 1/3/7/30 天） | 否 |

## 目录

```
config.py            # 配置：模型、路径、复习间隔
curriculum/
  courses.json       # 课程目录（主页数据源）
  ai-agent/          # 第一门课（module-0..5.json）
frontend/            # React + Vite SPA
  src/pages/         # Catalog / Detail / Lesson / Quiz / Progress / Review
  src/components/    # CourseCard / ChapterList / QuizView / ResultView ...
src/
  agents.py          # Tutor/Grader/Drill prompt + LLM 调用（强制工具调用）
  curriculum.py      # 多课程解析 + 章节全局键 full_chapter_id/split
  store.py           # SQLite 进度表 (user_id, chapter_id) 复合主键
  scheduler.py       # 遗忘曲线调度
  main.py            # FastAPI JSON 路由 + 托管 frontend/dist
src/templates/       # 旧版 SSR 模板（已弃用，仅作参考保留）
data/learning.db     # 运行时生成的 SQLite
```

## 学习方式

这是"边做边学"项目：课程里 `TODO(人工)` 标记处是留给你自己动手的协作点。
`src/` 本身也是模块 4（agentic loop）和模块 5（生产化）的可读范例。

## 已知取舍（后续可改进）

- quiz 生成接口会把正确答案随题目一起返回前端（无状态、简单）；要防"偷看答案"可改为服务端暂存 quiz。
- 讲授/出题为同步请求，前端只有 loading 态；可升级 SSE 流式输出。
- 单用户（`user_id='default'`）；进度表已预留 `user_id` 字段，接登录体系时无需迁移数据。
- `src/templates/`、`src/static/` 为旧 SSR 遗留，确认不再需要后可删除。

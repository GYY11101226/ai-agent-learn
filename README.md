# AI Agent 学习教程系统

一个基于 `ai-agent-course.md` 课程的交互式学习 Web 应用：
**Tutor 讲授 → 测验批改 → 进度追踪 → 遗忘曲线复习**。

技术栈：Python + FastAPI + Anthropic SDK + SQLite。四角色（Tutor/Grader/Drill）
是同一个 Claude API + 不同 system prompt，结构化数据通过「强制工具调用」获取。

## 快速开始

```bash
# 1. 安装依赖（建议用项目自带 .venv）
.venv/bin/python -m ensurepip --upgrade   # 若 .venv 里没有 pip
.venv/bin/pip install -r requirements.txt

# 2. 配置：复制模板并填入凭证（所有配置走 .env，不读系统环境变量）
cp .env.example .env
#    编辑 .env，填入 API Key 和模型/接入点

# 3. 启动
.venv/bin/python -m uvicorn src.main:app --reload --port 8000
# 浏览器打开 http://127.0.0.1:8000
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

## 功能

| 路由 | 功能 | 是否调 Claude |
|------|------|------|
| `/` | 课程大纲（6 模块 26 章节） | 否 |
| `/lesson/{章节号}` | Tutor 四段式讲授（结论/展开/类比/实践） | 是 |
| `/quiz/{章节号}` | Grader 出题 | 是 |
| `/quiz/{章节号}/submit` | 批改、算掌握度、写进度 | 是 |
| `/quiz/{章节号}?review=1` | Drill 针对薄弱点出复习题 | 是 |
| `/progress` | 总掌握度 + 各章节进度（纯读库） | **否** |
| `/review` | 到期复习（遗忘曲线 1/3/7/30 天） | 否 |

## 目录

```
config.py          # 配置：模型、路径、复习间隔
curriculum/*.json  # 结构化课程（6 个模块）
src/agents.py      # Tutor/Grader/Drill prompt + Claude 调用
src/curriculum.py  # 课程 JSON 解析
src/store.py       # SQLite 进度/掌握度
src/scheduler.py   # 遗忘曲线调度
src/main.py        # FastAPI 路由
src/templates/     # Jinja2 页面
data/learning.db   # 运行时生成的 SQLite
```

## 学习方式

这是"边做边学"项目：课程里 `TODO(人工)` 标记处是留给你自己动手的协作点。
`src/` 本身也是模块 4（agentic loop）和模块 5（生产化）的可读范例。

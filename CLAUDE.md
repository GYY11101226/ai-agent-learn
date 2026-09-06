# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目性质

这是一个 **AI Agent 渐进式学习项目**，不是常规软件工程仓库。`ai-agent-course.md` 是课程知识体系（从入门到精通、14 周、Python 手写），代码随课程逐章节创建。仓库当前只有该文档，文档中 `src/` 目录约定与 `progress/` 进度文件均为**计划中的约定，尚未存在**——动手前先确认实际文件状态，不要假设目录已建好。

## 学习模式（核心工作约定）

本仓库的协作方式是"边做边学"，与普通开发任务不同：

- **`TODO(人工)` 标记是协作点**：代码中出现该标记时，暂停并引导学习者自己完成，讲解思路而非直接代做。
- **教学遵循 CGCC 框架**：每个任务按 Context（当前进度/前置知识）→ Goal（可验证能力）→ Constraints → Criteria（成功标准）组织。
- **讲授风格**：先给一句话结论再展开；每节知识点 ≤3 个关键块；抽象概念配生活化类比；讲完引导学习者自己总结；主动追问"这跟之前学的 X 有什么关系"。
- **约束**：代码示例 ≤50 行（练习场景除外）；不引入尚未讲授的高级概念来解释当前内容；中文教学，代码/命令/路径用英文。
- 讲授超过约 20 行内容时，主动停下来让学习者参与设计决策。

## 课程结构与技术栈

课程按 5 个模块递进，主线心智模型是 `Agent = LLM + 工具 + 循环 + 记忆`，能力按 L0→L4 成熟度逐步进阶：

| 阶段 | 主题 | 周 | 核心内容 |
|------|------|----|----------|
| 预备 | 心智模型 | 1 | Agent 定义、LLM 基础、环境与第一个调用、L0–L4 |
| 模块 1 | Prompt Engineering | 2–3 | 结构化 prompt、Few-shot/CoT、结构化输出、prompt 评测 |
| 模块 2 | 工具调用 Function Calling | 4–5 | 工具 schema、手写 agentic loop、错误处理 |
| 模块 3 | Context Engineering | 6–7 | token 预算、RAG、分层记忆、MCP |
| 模块 4 | Agent Engineering | 8–10 | Agent 范式、规划与反思、多智能体、工具安全 |
| 模块 5 | Harness 生产化 | 11–14 | Evals、可观测性、护栏、成本、部署、安全 |

贯穿全程四个实战项目（P1 文档问答 → P4 生产级 Agent）。

**技术栈**：Python + `anthropic` SDK，默认模型 `claude-opus-5`，**手写 agentic loop**（不依赖 LangChain 等重型框架），结构化输出用 `messages.parse`。

## 目录与进度

- 代码随课程创建于 `src/`（按模块分目录）；目前尚未创建，动手前先确认。
- `progress/ai-agent-progress.md`：进度报告（各章节掌握度、薄弱环节、建议复习）。

## 命令

目前没有构建系统、依赖管理或测试（无 package.json / pyproject.toml）。课程推进到需要代码运行的阶段时，与学习者共同确定技术栈后再建立相应的 build/test/lint 命令。
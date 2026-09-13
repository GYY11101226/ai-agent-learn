# Docker 课程（配图 + 动画）设计

日期：2026-09-13

## 背景与目标

平台已有三门"从入门到精通"课程（ai-agent / fastapi / machine-learning），均配 mermaid 流程图，ML 课另有 4 个交互式 SVG 动画。上一轮（2026-09-09）刚建好整条配图管线：内容手写进课程 JSON（`diagram`/`animation` 可选字段），后端 `lesson` 接口多返回两字段，前端 `MermaidDiagram` + 动画组件渲染。

目标：新增第 4 门课 **Docker 从入门到精通**，27 章全覆盖 mermaid 流程图，Docker 最核心的 4 个概念配交互式动画，复用现有管线、不新增基础设施。

## 已定决策

- 大纲：6 模块（module-0..5）、27 章（下文 §④ 全量给出）。
- 每章配 mermaid 流程图（`diagram`），4 章额外配交互动画（`animation`）。
- 内容深浅：**对齐现有三门课**（每章 goal + 3 个 concept 各一句话 detail + code + exercise + quiz_topics）。
- `code` 字段写 **Dockerfile / `docker` 命令**（非 Python）。
- 动画 4 个：镜像分层、构建缓存、端口映射、数据卷。
- 交互模型沿用已有约定：**自动播放（setInterval + cleanup）+ 单 slider**，无暂停键，播到终点循环；配色复用 `colors.ts`。

## Non-goals

- 不改后端接口（`lesson` 已返回两字段）、不改 `types.ts`、不改 `src/curriculum.py`。
- 图不进 LLM 讲授 prompt（与现有三门课一致）。
- 不引入 Docker 之外的编排系统（Swarm/K8s）、不引入 D3/ECharts 重型图表。
- 不改测验/复习链路。
- 章节正文不写 `TODO(人工)` 协作标记（整课一次性生成，非逐步引导）。

---

## ① 数据层

### 课程注册（`curriculum/courses.json`）

新增一条：

```json
{
  "id": "docker",
  "title": "Docker 从入门到精通",
  "description": "从镜像、构建到网络、数据与 Compose，边做边学容器化",
  "dir": "docker"
}
```

### 章节字段（`curriculum/docker/module-0..5.json`）

与现有课完全一致，每章：

```json
{
  "id": "1.2",
  "title": "镜像分层与写时复制",
  "goal": "……",
  "diagram": "flowchart TD\n  ……",
  "animation": "image-layers",
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
| 1.2 镜像分层与写时复制 | `image-layers` | `ImageLayersAnimation` |
| 2.2 构建缓存与层复用 | `build-cache` | `BuildCacheAnimation` |
| 3.2 端口映射 | `port-mapping` | `PortMappingAnimation` |
| 4.2 volume：具名卷与持久化 | `volume` | `VolumeAnimation` |

## ② 后端 / 前端管线

- 后端 `src/main.py`：**零改动**。
- `frontend/src/types.ts`：零改动。
- `frontend/scripts/validate-diagrams.mjs`：`COURSES` 数组加 `'docker'`。
- `frontend/src/components/animations/index.tsx`：注册 4 新枚举 → 新组件。

## ③ 4 个动画组件规格

统一约束：React + SVG（无第三方）、`viewBox` 约 480×300（卷积/端口类可更宽）、自动播放 `setInterval`（每组件 400–950ms 步进）+ effect cleanup、单 slider。配色用 `colors.ts`（`BLUE #2a78d6` / `ORANGE #eb6834` / `RED #e34948` / `GRID #e5e7eb` / `AXIS #c3c2b7` / `MUTED #6b7280` / `sequentialBlue`）。

### 1. `ImageLayersAnimation`（image-layers）
- **视觉**：横向堆叠的层，从底到顶 `基础镜像(ubuntu)` → `RUN apt-get` → `COPY app` → `CMD`，最顶层是虚线描边的「容器可写层」，其余标 read-only。
- **slider**：选中"被改动哪一层"（0..层数−1）。选中层高亮 + 标注「该层及其上所有层要重建」；顶层可写层始终特殊显示。
- **自动播放**：层从底到顶逐条出现（模拟 build），播满后叠加可写层，循环。
- **教学点**：分层复用、写时复制（COW）——改底层代价大、改顶层代价小。

### 2. `BuildCacheAnimation`（build-cache）
- **视觉**：竖向 Dockerfile 步骤列表（`FROM node` → `COPY package.json` → `RUN npm install` → `COPY .` → `CMD`），每步右侧标 `cached ✓`（绿）或 `rebuild`（橙）。
- **slider**：`修改第 N 步`（1..5）。
- **自动播放**：两段循环——①首次构建全绿；②按 slider 指定的修改行，该行及以下变橙、以上保持绿。
- **教学点**：缓存按层命中；改得越靠前，失效越多；`package.json` 与源码分两步 COPY 的实践。

### 3. `PortMappingAnimation`（port-mapping）
- **视觉**：左侧「宿主机」`localhost:8080`、右侧「容器」`:80`，中间一个映射门；数据包小球从外部客户端 → `:8080` → 映射 → 容器 `:80`（app）→ 响应原路返回。
- **slider**：宿主端口（如 8080→9090），容器固定 `:80`。
- **自动播放**：包沿路径往返流动。
- **教学点**：`-p HOST:CONTAINER`、DNAT 语义、容器之间无需 `-p`、端口占用冲突。

### 4. `VolumeAnimation`（volume）
- **视觉**：一个容器（矩形，内含 `/data`）经「挂载」连线接到宿主机一个具名卷（外置矩形）；数据文件从容器写入卷。
- **slider**：生命周期阶段（1=写数据 / 2=容器删除 / 3=新容器挂同卷数据还在）。
- **自动播放**：缓慢推进 1→2→3 循环；阶段 2 容器淡出、阶段 3 新容器出现且 `/data` 数据高亮。
- **教学点**：容器无状态、数据存卷才持久；`docker run -v` 与 `volumes:` 的关系、bind mount 与 volume 的区别（呼应 4.1）。

## ④ 课程大纲（27 章全量）

每章标注 `id / title / goal 一句话 / diagram 节点流向 / animation`。

### module-0 预备·心智模型
| id | title | diagram 节点流向 |
|---|---|---|
| 0.1 | 容器 vs 虚拟机：共享内核 | VM：应用→Guest OS→Hypervisor→硬件；容器：各容器共享宿主内核，只隔离用户空间 |
| 0.2 | Docker 解决什么问题 | 同一镜像 → 开发/测试/生产三环境一致；"在我机器上能跑"的根因（环境漂移） |
| 0.3 | Docker 架构：client / daemon / registry | docker CLI → daemon（建/跑容器）；daemon ↔ registry（pull/push） |
| 0.4 | 安装与第一个容器 | 安装 Docker → `docker run hello-world` → daemon 拉镜像 → 运行输出 |

### module-1 镜像
| id | title | diagram 节点流向 |
|---|---|---|
| 1.1 | 镜像与容器：只读模板 + 运行实例 | 镜像（类）→ `docker run` → 容器（对象实例）；一镜像多容器各自独立 |
| 1.2 | 镜像分层与写时复制 🔴 | 只读层底→顶堆叠 + 可写容器层；写时复制 COW | `image-layers` |
| 1.3 | 镜像管理：pull / images / rmi / tag | registry → `pull` 拉取 → 本地 images 列表 → `tag` 改名 → `rmi` 删除 |
| 1.4 | 官方镜像与 tag 语义 | `repository:tag` 命名；`latest` 只是默认 tag 并非最新版本 |
| 1.5 | 容器生命周期管理 | created → running → paused → exited → removed 状态机；`ps/start/stop/rm/exec/logs` |

### module-2 Dockerfile 构建
| id | title | diagram 节点流向 |
|---|---|---|
| 2.1 | 第一个 Dockerfile | 源码 + Dockerfile → `docker build` → 镜像 → `run` 容器；FROM→COPY→CMD |
| 2.2 | 构建缓存与层复用 🔴 | 每指令一层；改动某指令 → 该层及以下全部 rebuild | `build-cache` |
| 2.3 | 核心指令分工 | FROM/RUN/COPY/ADD/CMD/ENTRYPOINT/ENV/WORKDIR 各司其职 |
| 2.4 | 构建上下文与 .dockerignore | 构建上下文打包上传 → daemon；`.dockerignore` 排除大文件/node_modules |
| 2.5 | 多阶段构建瘦身 | builder 阶段编译 → 复制产物 → runtime 精简镜像；两阶段只留运行时 |

### module-3 网络
| id | title | diagram 节点流向 |
|---|---|---|
| 3.1 | bridge 网络与容器间通信 | 默认 bridge（docker0）；容器间直接 IP 互通，无需 -p |
| 3.2 | 端口映射 🔴 | 外部客户端 → `localhost:8080` → DNAT → 容器 `:80` | `port-mapping` |
| 3.3 | 自定义网络与 DNS | 创建 network → 容器加入 → 容器名即 DNS 解析 → 服务发现 |
| 3.4 | 网络模式 | bridge / host / none / container 四模式分支；host 共享宿主网络栈 |

### module-4 数据管理
| id | title | diagram 节点流向 |
|---|---|---|
| 4.1 | bind mount：宿主机目录直挂 | 宿主机绝对路径 ↔ 容器路径，双向同步；适合开发热更 |
| 4.2 | volume：具名卷与持久化 🔴 | 容器 `/data` ↔ docker 托管卷；容器删数据不丢 | `volume` |
| 4.3 | 挂载的坑 | 路径写错/镜像内已有文件被挂载覆盖/权限（uid gid）三类坑 |
| 4.4 | 备份恢复与数据卷迁移 | 卷 → 打包备份 → 恢复到新环境；`tar` 或 `--volumes-from` |

### module-5 Compose 与生产化
| id | title | diagram 节点流向 |
|---|---|---|
| 5.1 | 多容器应用与 docker compose | 单机多容器编排；一个 YAML 声明 web+db+redis 多 service |
| 5.2 | compose 文件结构 | services / networks / volumes 三段；`docker compose up` 一键起 |
| 5.3 | 环境变量、depends_on 与 healthcheck | env 注入 → 启动顺序(depends_on) → 健康检查(healthcheck) → 就绪 |
| 5.4 | 资源限制与日志监控 | `--cpus/--memory` 限额；`docker logs/stats` 观测 CPU/内存 |
| 5.5 | 镜像安全与最佳实践清单 | 最小 base→非 root→镜像扫描→单进程→.dockerignore 清单逐项 |

## ⑤ 内容模板（每章字段写法）

- `goal`：一句话可验证的能力描述（"能……"），≤ 60 字。
- `concepts`：恰好 3 个 `{name, detail}`，detail 一句话（1–2 个分句）讲清一个点。
- `code`：Dockerfile 或 `docker` 命令片段，≤ 12 行，带 `# 注释` 说明；无代码的章写 `""`。
- `exercise`：引导动手、不给答案的一句话实践题。
- `quiz_topics`：3 个关键词，用于出题。
- `diagram`：mermaid `flowchart TD` 或 `LR`，4–7 节点中文标签 + 英文术语，遵守上次定下的 mermaid 铁律（括号走引号、标签禁 `{}`、边标禁括号、`\n` 转义、Unicode 符号可用）。

## ⑥ 验证（成功标准）

1. `frontend`：`npm run typecheck`、`npm run build` 均通过。
2. `node scripts/validate-diagrams.mjs`：`107 chapters / 107 diagrams / 8 animations / 0 invalid`，无 missing。
3. 后端 `python3 -c "from src.main import app"` 无异常。
4. Docker 课任一章进讲授页渲染流程图；`1.2/2.2/3.2/4.2` 四章渲染对应动画（自动播放 + slider 可调）；老课程照旧不受影响。
5. `courses.json` 与 `course_detail` 接口能列出第 4 门课。

## 已知风险

- 4 个动画组件为设计期定稿、未经运行验证；各组件 typecheck + 最终人眼冒烟兜底，SVG 布局若有重叠在对应组件内微调坐标即可。
- `validate-diagrams.mjs` 的 `COURSES` 数组需同步加 `docker`，否则校验覆盖不到新课程。
# Docker 课程（配图 + 动画）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增第 4 门「Docker 从入门到精通」课程：27 章全覆盖 mermaid 流程图，4 个核心概念章配交互式 SVG 动画，复用现有配图管线。

**Architecture:** 内容手写进 `curriculum/docker/module-0..5.json`（`diagram`/`animation` 可选字段，图不进 LLM prompt）；`courses.json` 注册课程；`validate-diagrams.mjs` 加 docker 覆盖；前端新增 4 个纯 React+SVG 动画组件并注册进 `animations/index.tsx`。后端 `src/main.py`、`types.ts`、`MermaidDiagram`、`LessonView` **零改动**。

**Tech Stack:** Mermaid v11（前端渲染 + Node/jsdom 校验）、React 18 + SVG、JSON 内容（手写）。

**Spec:** `docs/superpowers/specs/2026-09-13-docker-course-design.md`

---

## 执行须知（零上下文必读）

1. **本项目无测试框架**（无 pytest/vitest，前端仅有 `npm run typecheck` 与 `npm run build`）。各任务"验证"= json 合法 / typecheck / build / 语法校验脚本，不写单测。
2. **Git 规则（用户全局约定，优先级最高）：不自动 commit/push。** 所有任务做完后统一在 Task 13 提交一次，提交前向用户展示变更摘要。中途任何任务都不执行 `git commit`。
3. **Mermaid 语法铁律**（Node 实测结论，违反即 parse 失败）：
   - 只用 `flowchart TD` 或 `flowchart LR`。
   - 节点标签含 `(`、`)` 时必须用引号形式 `A["损失 J(w)"]`；标签内禁用 `{`、`}`。
   - 边标 `-->|文本|` 内禁用括号（引号救不了边标）。
   - Unicode 符号安全；菱形 `C{评估?}`、循环边 `D --> B` 可用。
   - JSON 里换行写成 `\n`（与现有 `code`/`diagram` 字段一致）。
4. **动画组件配色**（复用 `frontend/src/components/animations/colors.ts`）：category blue `#2a78d6` / orange `#eb6834` / red `#e34948`；顺序色 `sequentialBlue(t)`；`MUTED #6b7280`、`GRID #e5e7eb`、`AXIS #c3c2b7`。只用已 import 的符号，避免未用 import。
5. **动画统一交互模型**：自动播放（`setInterval` 步进 + effect cleanup）+ 单 slider 调参，无暂停键；播放到终点循环重置。
6. **JSON 格式**：新建文件与现有课一致——外层 indent=2，`concepts` 数组内对象用紧凑单行 `{"name": "...", "detail": "..."}`；键序 `id, title, goal, diagram, [animation], concepts, code, todo, exercise, quiz_topics`。

## File Structure

| 文件 | 操作 | 职责 |
|---|---|---|
| `curriculum/courses.json` | Modify | 注册 docker 课程 |
| `frontend/scripts/validate-diagrams.mjs` | Modify | `COURSES` 加 `'docker'` |
| `curriculum/docker/module-0.json` | Create | 模块 0（4 章） |
| `curriculum/docker/module-1.json` | Create | 模块 1（5 章，含 1.2 animation） |
| `curriculum/docker/module-2.json` | Create | 模块 2（5 章，含 2.2 animation） |
| `curriculum/docker/module-3.json` | Create | 模块 3（4 章，含 3.2 animation） |
| `curriculum/docker/module-4.json` | Create | 模块 4（4 章，含 4.2 animation） |
| `curriculum/docker/module-5.json` | Create | 模块 5（5 章） |
| `frontend/src/components/animations/ImageLayersAnimation.tsx` | Create | 镜像分层动画 |
| `frontend/src/components/animations/BuildCacheAnimation.tsx` | Create | 构建缓存动画 |
| `frontend/src/components/animations/PortMappingAnimation.tsx` | Create | 端口映射动画 |
| `frontend/src/components/animations/VolumeAnimation.tsx` | Create | 数据卷动画 |
| `frontend/src/components/animations/index.tsx` | Modify | 注册 4 动画枚举 |

依赖顺序：Task 1（注册）→ Task 2–7（内容，6 个模块）→ Task 8（diagram 语法校验）→ Task 9–10（4 个动画组件）→ Task 11（注册 + typecheck）→ Task 12（总验证）→ Task 13（提交）。

---

### Task 1: 注册课程 + 校验脚本加 docker

**Files:**
- Modify: `curriculum/courses.json`
- Modify: `frontend/scripts/validate-diagrams.mjs`

- [ ] **Step 1: 注册课程**

`curriculum/courses.json` 的数组末尾（最后一个 `}` 后、`]` 前）加一条。把：

```
  {
    "id": "machine-learning",
    "title": "机器学习 从入门到精通",
    "description": "从线性回归到 Transformer，numpy 手写核心 + sklearn/PyTorch 实战的渐进式课程",
    "dir": "machine-learning"
  }
]
```

改为（在 machine-learning 对象后加逗号与新条目）：

```
  {
    "id": "machine-learning",
    "title": "机器学习 从入门到精通",
    "description": "从线性回归到 Transformer，numpy 手写核心 + sklearn/PyTorch 实战的渐进式课程",
    "dir": "machine-learning"
  },
  {
    "id": "docker",
    "title": "Docker 从入门到精通",
    "description": "从镜像、构建到网络、数据与 Compose，边做边学容器化",
    "dir": "docker"
  }
]
```

- [ ] **Step 2: 校验脚本加 docker**

`frontend/scripts/validate-diagrams.mjs` 中：

```js
const COURSES = ['ai-agent', 'fastapi', 'machine-learning']
```

改为：

```js
const COURSES = ['ai-agent', 'fastapi', 'machine-learning', 'docker']
```

- [ ] **Step 3: 验证 courses.json 合法**

Run: `python3 -c "import json; d=json.load(open('curriculum/courses.json')); print([c['id'] for c in d])"`
Expected: `['ai-agent', 'fastapi', 'machine-learning', 'docker']`

### Task 2: 模块 0 内容（4 章）

**Files:**
- Create: `curriculum/docker/module-0.json`

- [ ] **Step 1: 写整个文件**

`curriculum/docker/module-0.json` 完整内容：

```json
{
  "id": "module-0",
  "title": "预备：容器心智模型",
  "weeks": "第1周",
  "prerequisites": "会基础 Linux 命令与 Python 即可",
  "chapters": [
    {
      "id": "0.1",
      "title": "容器 vs 虚拟机：共享内核",
      "goal": "能说清容器与虚拟机的本质区别（是否共享宿主内核）及各自资源开销",
      "diagram": "flowchart TD\n  A[\"虚拟机: 应用 + 完整 Guest OS\"] --> B[Hypervisor 虚拟层]\n  B --> C[宿主内核/硬件]\n  D[\"容器: 应用 + 依赖\"] --> E[共享宿主内核]\n  E --> C",
      "concepts": [
        {"name": "虚拟机", "detail": "Hypervisor 之上每个实例跑完整 Guest OS，隔离强但开销大。"},
        {"name": "容器", "detail": "所有容器共享宿主内核，只隔离用户空间（进程/文件/网络），轻量秒启。"},
        {"name": "隔离差异", "detail": "VM 强隔离适合多租户，容器共享内核适合高密度部署。"}
      ],
      "code": "",
      "todo": "",
      "exercise": "对比说明：同一台 4G 内存宿主机，能跑 5 个 Ubuntu 虚拟机却跑几十个容器的原因。",
      "quiz_topics": ["虚拟机与容器区别", "共享内核", "隔离与开销权衡"]
    },
    {
      "id": "0.2",
      "title": "Docker 解决什么问题",
      "goal": "能说出 Docker 解决「环境漂移」的核心价值与「一次构建处处运行」的含义",
      "diagram": "flowchart LR\n  A[\"代码 + 依赖 + 配置\"] --> B[\"打包成镜像\"]\n  B --> C[开发环境]\n  B --> D[测试环境]\n  B --> E[生产环境]\n  C --> F[行为一致]\n  D --> F\n  E --> F",
      "concepts": [
        {"name": "环境漂移", "detail": "代码在开发机能跑、服务器跑不了，根因是依赖与系统版本不一致。"},
        {"name": "一次构建处处运行", "detail": "镜像打包代码+依赖+配置，任何装有 Docker 的机器运行结果一致。"},
        {"name": "交付物变化", "detail": "从「代码+部署文档」变为「镜像」，部署变成拉镜像运行。"}
      ],
      "code": "",
      "todo": "",
      "exercise": "举例一个你遇到过（或听过）的「在我机器上能跑」问题，说明 Docker 如何规避。",
      "quiz_topics": ["环境漂移", "一次构建处处运行", "镜像交付"]
    },
    {
      "id": "0.3",
      "title": "Docker 架构：client / daemon / registry",
      "goal": "能画出 Docker 三大组件（CLI / daemon / registry）的协作关系",
      "diagram": "flowchart LR\n  A[\"docker CLI（client）\"] -->|REST API| B[\"dockerd（daemon）\"]\n  B --> C[\"构建/运行容器\"]\n  B <-->|pull / push| D[Registry 镜像仓库]\n  C --> E[镜像与容器]",
      "concepts": [
        {"name": "daemon", "detail": "后台常驻 dockerd，真正管理镜像、容器、网络、卷。"},
        {"name": "client", "detail": "docker 命令行，通过 REST API 把命令发给 daemon 执行。"},
        {"name": "registry", "detail": "镜像仓库（Docker Hub 最常用），负责 pull/push 镜像。"}
      ],
      "code": "docker info   # 查看 daemon 信息（版本、Storage Driver）",
      "todo": "",
      "exercise": "用 docker info 找到 Server Version 与 Storage Driver 两行，说明它们来自哪个组件。",
      "quiz_topics": ["docker daemon", "client/daemon 关系", "registry 作用"]
    },
    {
      "id": "0.4",
      "title": "安装与第一个容器",
      "goal": "独立完成安装 Docker 并跑通 hello-world，理解自动拉镜像的流程",
      "diagram": "flowchart TD\n  A[安装 Docker] --> B[\"docker run hello-world\"]\n  B --> C{本地有镜像?}\n  C -->|无| D[从 Hub 拉取]\n  C -->|有| E[直接运行]\n  D --> E\n  E --> F[输出 Hello from Docker]",
      "concepts": [
        {"name": "安装", "detail": "Docker Desktop（Mac/Win）或 docker-engine（Linux）；装完 docker --version 验证。"},
        {"name": "docker run", "detail": "本地无该镜像时 daemon 自动从 Hub 拉取再运行，无需手动 pull。"},
        {"name": "输出解读", "detail": "Hello from Docker! 说明 client→daemon→拉取→容器→标准输出全链路打通。"}
      ],
      "code": "docker --version\ndocker run hello-world",
      "todo": "",
      "exercise": "跑 docker run hello-world，观察镜像拉取与输出，再 docker ps -a 看这个已退出的容器。",
      "quiz_topics": ["Docker 安装", "hello-world 流程", "自动拉取镜像"]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 合法与章数**

Run: `python3 -c "import json; m=json.load(open('curriculum/docker/module-0.json')); print(m['id'], len(m['chapters']))"`
Expected: `module-0 4`

### Task 3: 模块 1 内容（5 章，含 1.2 动画）

**Files:**
- Create: `curriculum/docker/module-1.json`

- [ ] **Step 1: 写整个文件**

`curriculum/docker/module-1.json` 完整内容：

```json
{
  "id": "module-1",
  "title": "镜像",
  "weeks": "第2周",
  "prerequisites": "上完模块 0",
  "chapters": [
    {
      "id": "1.1",
      "title": "镜像与容器：只读模板 + 运行实例",
      "goal": "能区分「镜像」与「容器」两个概念及其类比关系",
      "diagram": "flowchart LR\n  A[\"镜像（只读模板）\"] -->|docker run| B[\"容器 1（运行实例）\"]\n  A -->|docker run| C[\"容器 2（运行实例）\"]\n  A -->|docker run| D[\"容器 3（运行实例）\"]",
      "concepts": [
        {"name": "镜像", "detail": "只读模板，含文件系统与启动配置；docker images 查看本地镜像。"},
        {"name": "容器", "detail": "镜像的运行实例，docker run 从镜像创建，可写、可启停。"},
        {"name": "类比", "detail": "镜像像类（class）或模具，容器像对象（instance）或浇铸件，一个镜像出多个容器。"}
      ],
      "code": "docker run nginx\ndocker run nginx   # 同一镜像再起一个，互不影响",
      "todo": "",
      "exercise": "从同一个 alpine 镜像起两个容器，各写一个不同文件，说明它们独立且不改镜像。",
      "quiz_topics": ["镜像 vs 容器", "只读模板", "一镜像多容器"]
    },
    {
      "id": "1.2",
      "title": "镜像分层与写时复制",
      "goal": "理解镜像分层结构与写时复制（COW），说清改底层与改顶层的代价差异",
      "diagram": "flowchart TD\n  A[\"只读层 基础镜像 ubuntu\"] --> B[\"只读层 RUN apt-get\"]\n  B --> C[\"只读层 COPY app\"]\n  C --> D[\"可写容器层 COW\"]\n  D -->|要改文件时| E[\"先复制到底层再改\"]",
      "animation": "image-layers",
      "concepts": [
        {"name": "分层", "detail": "每条构建指令生成一层，层以栈堆叠，底层只读共享。"},
        {"name": "写时复制 COW", "detail": "容器要改文件时，先从只读层复制到可写层再改，底层不变。"},
        {"name": "复用价值", "detail": "相同底层可被多个镜像与容器共享，磁盘省空间、拉取更快。"}
      ],
      "code": "docker image history nginx   # 查看镜像的分层历史",
      "todo": "",
      "exercise": "用 docker image history nginx 数出至少 5 层，标注每层大致对应的指令。",
      "quiz_topics": ["镜像分层", "写时复制 COW", "层复用与共享"]
    },
    {
      "id": "1.3",
      "title": "镜像管理：pull / images / rmi / tag",
      "goal": "熟练使用 pull / images / tag / rmi 管理本地镜像",
      "diagram": "flowchart LR\n  A[Registry] -->|docker pull| B[\"本地镜像 images\"]\n  B -->|docker tag| C[\"别名 myapp:v1\"]\n  B -->|docker rmi| D[删除镜像]\n  C --> B",
      "concepts": [
        {"name": "pull / images", "detail": "从 registry 拉镜像；docker images（或 image ls）列出本地镜像。"},
        {"name": "tag", "detail": "给镜像起别名（nginx:myapp），不改内容只加标签。"},
        {"name": "rmi", "detail": "删除本地镜像，有容器占用时需先删容器或加 -f。"}
      ],
      "code": "docker pull nginx:1.25\ndocker tag nginx:1.25 myapp:v1\ndocker rmi myapp:v1",
      "todo": "",
      "exercise": "pull 一个 alpine，打 alpine:mine 的 tag，再 rmi 掉这个别名并确认原镜像还在。",
      "quiz_topics": ["pull/tag/rmi", "镜像命名", "镜像占用删除"]
    },
    {
      "id": "1.4",
      "title": "官方镜像与 tag 语义",
      "goal": "理解 repository:tag 命名，识破 latest 不是「最新」",
      "diagram": "flowchart LR\n  A[\"镜像名 repository\"] --> B[\"加 :tag 指定版本\"]\n  B --> C[\"nginx:1.25.4 明确锁定\"]\n  B --> D[\"nginx:latest 默认标签\"]\n  D --> E[\"latest 不等于最新\"]",
      "concepts": [
        {"name": "命名格式", "detail": "[registry/]repository:tag，缺 tag 默认 latest。"},
        {"name": "latest 陷阱", "detail": "只是「未显式指定时的默认标签」，不代表最新版本，可能已滞后。"},
        {"name": "生产实践", "detail": "显式写具体 tag（nginx:1.25.4）锁定版本，避免意外升级。"}
      ],
      "code": "docker pull nginx          # 等于 nginx:latest，版本不明确\ndocker pull nginx:1.25.4   # 锁定具体版本",
      "todo": "",
      "exercise": "说明为什么生产环境写 nginx:latest 有风险，应该怎么写。",
      "quiz_topics": ["repository:tag", "latest 语义", "版本锁定"]
    },
    {
      "id": "1.5",
      "title": "容器生命周期管理",
      "goal": "掌握 ps / start / stop / rm / exec / logs 等容器生命周期命令",
      "diagram": "flowchart LR\n  A[created] -->|start| B[running]\n  B -->|pause| C[paused]\n  C -->|unpause| B\n  B -->|stop| D[exited]\n  D -->|start| B\n  D -->|rm| E[removed]",
      "concepts": [
        {"name": "状态机", "detail": "容器有 created/running/paused/exited/removed 等状态，命令在状态间迁移。"},
        {"name": "常用命令", "detail": "ps -a 看全部（含已退出）、start/stop/restart 启停、rm 删除。"},
        {"name": "exec 与 logs", "detail": "exec -it 进容器跑命令，logs -f 跟踪标准输出。"}
      ],
      "code": "docker run -d --name web nginx\ndocker ps\ndocker logs -f web\ndocker stop web && docker rm web",
      "todo": "",
      "exercise": "起一个后台 nginx，用 exec -it 进去看 /usr/share/nginx/html 下的首页文件，再 stop/rm。",
      "quiz_topics": ["容器状态机", "start/stop/rm", "exec 与 logs"]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 合法与章数**

Run: `python3 -c "import json; m=json.load(open('curriculum/docker/module-1.json')); print(m['id'], len(m['chapters']))"`
Expected: `module-1 5`

### Task 4: 模块 2 内容（5 章，含 2.2 动画）

**Files:**
- Create: `curriculum/docker/module-2.json`

- [ ] **Step 1: 写整个文件**

`curriculum/docker/module-2.json` 完整内容：

```json
{
  "id": "module-2",
  "title": "Dockerfile 构建",
  "weeks": "第3周",
  "prerequisites": "上完模块 1",
  "chapters": [
    {
      "id": "2.1",
      "title": "第一个 Dockerfile",
      "goal": "写出并构建运行第一个 Dockerfile",
      "diagram": "flowchart LR\n  A[\"源码 + Dockerfile\"] -->|docker build| B[\"镜像 image\"]\n  B -->|docker run| C[容器]\n  A --> D[FROM 基础镜像]\n  A --> E[COPY 复制文件]\n  A --> F[CMD 启动命令]",
      "concepts": [
        {"name": "Dockerfile", "detail": "描述构建步骤的文本，docker build -t 名字 . 生成镜像。"},
        {"name": "核心三指令", "detail": "FROM 基础镜像、COPY 复制文件、CMD 启动命令。"},
        {"name": "构建上下文", "detail": "docker build 末尾的点 . 表示以当前目录作为构建上下文。"}
      ],
      "code": "FROM alpine\nCOPY hello.txt /hello.txt\nCMD cat /hello.txt",
      "todo": "",
      "exercise": "写一个 alpine 镜像，COPY 一个文本文件进去，CMD 用 cat 打印它。",
      "quiz_topics": ["Dockerfile 结构", "FROM/COPY/CMD", "docker build"]
    },
    {
      "id": "2.2",
      "title": "构建缓存与层复用",
      "goal": "理解构建缓存机制，写出缓存友好的 Dockerfile",
      "diagram": "flowchart TD\n  A[\"每条指令 = 一层\"] --> B[\"构建时逐层缓存\"]\n  B --> C{这一层变了?}\n  C -->|否| D[\"命中缓存，跳过\"]\n  C -->|是| E[\"该层及以下全部重建\"]\n  E --> B",
      "animation": "build-cache",
      "concepts": [
        {"name": "一层一缓存", "detail": "每条指令一层，构建时按层缓存，命中直接复用。"},
        {"name": "失效传播", "detail": "某层内容变化，该层及以下所有层重建，以上仍命中缓存。"},
        {"name": "友好写法", "detail": "把不常变的依赖放前、常变的源码放后，最大化缓存命中。"}
      ],
      "code": "FROM node:18\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nCMD [\"npm\", \"start\"]",
      "todo": "",
      "exercise": "说明为什么 COPY package.json 与 RUN npm install 要放在 COPY . . 之前。",
      "quiz_topics": ["构建缓存", "层缓存失效", "缓存友好写法"]
    },
    {
      "id": "2.3",
      "title": "核心指令分工",
      "goal": "掌握常用 Dockerfile 指令的职责与用法",
      "diagram": "flowchart TD\n  A[FROM 基础镜像] --> B[\"RUN 构建时执行\"]\n  A --> C[\"COPY / ADD 复制文件\"]\n  A --> D[\"ENV 环境变量\"]\n  A --> E[\"CMD 默认启动命令\"]\n  A --> F[\"WORKDIR 工作目录\"]",
      "concepts": [
        {"name": "RUN vs CMD", "detail": "RUN 构建时执行（装依赖）；CMD 是容器默认启动命令（可被 run 覆盖）。"},
        {"name": "COPY vs ADD", "detail": "COPY 纯复制本地文件；ADD 额外支持 URL 与 tar 自动解包，优先用 COPY。"},
        {"name": "ENV/WORKDIR/ENTRYPOINT", "detail": "ENV 设环境变量、WORKDIR 设工作目录、ENTRYPOINT 定入口命令。"}
      ],
      "code": "FROM node:18\nWORKDIR /app\nCOPY . .\nRUN npm install\nENV NODE_ENV=production\nCMD [\"node\", \"app.js\"]",
      "todo": "",
      "exercise": "写一个含 ENV+WORKDIR+COPY+RUN+CMD 的 node 应用 Dockerfile，说明各指令执行时机。",
      "quiz_topics": ["RUN vs CMD", "COPY vs ADD", "ENV/WORKDIR/ENTRYPOINT"]
    },
    {
      "id": "2.4",
      "title": "构建上下文与 .dockerignore",
      "goal": "理解构建上下文，用 .dockerignore 避免误打包",
      "diagram": "flowchart LR\n  A[\"docker build .\"] --> B[打包当前目录为上下文]\n  B --> C[发送给 daemon]\n  C --> D[\"构建时 COPY 从上下文取文件\"]\n  E[.dockerignore] -->|排除| B\n  F[\"node_modules / .git\"] -->|被排除| B",
      "concepts": [
        {"name": "构建上下文", "detail": "docker build . 把 . 目录打包发给 daemon，daemon 在上下文内找 Dockerfile 与 COPY 源。"},
        {"name": "过大风险", "detail": "把 node_modules、.git、日志打进上下文，构建慢又可能泄漏敏感信息。"},
        {"name": ".dockerignore", "detail": "像 .gitignore 排除大目录与敏感文件，减少上下文。"}
      ],
      "code": "# .dockerignore\nnode_modules\n.git\n*.log\n.env",
      "todo": "",
      "exercise": "给一个项目写 .dockerignore，至少排除 node_modules、.git、.env。",
      "quiz_topics": ["构建上下文", ".dockerignore", "上下文瘦身"]
    },
    {
      "id": "2.5",
      "title": "多阶段构建瘦身",
      "goal": "用多阶段构建分离编译环境与运行环境，得到精简镜像",
      "diagram": "flowchart LR\n  A[\"阶段 1 builder：编译\"] --> B[\"生成产物\"]\n  B -->|COPY --from=builder| C[\"阶段 2 runtime：精简运行\"]\n  C --> D[\"最终镜像：小而安全\"]",
      "concepts": [
        {"name": "问题", "detail": "编译依赖（编译器、工具链）不该进最终镜像，否则体积臃肿。"},
        {"name": "多阶段", "detail": "一个 Dockerfile 多个 FROM，builder 阶段编译，runtime 阶段只 COPY 产物。"},
        {"name": "效果", "detail": "COPY --from=builder 把编译结果搬到精简运行时，体积可降一个量级。"}
      ],
      "code": "FROM node:18 AS builder\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html",
      "todo": "",
      "exercise": "把一个前端项目改成 node 构建阶段 + nginx 运行阶段的两段构建。",
      "quiz_topics": ["多阶段构建", "COPY --from", "镜像瘦身"]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 合法与章数**

Run: `python3 -c "import json; m=json.load(open('curriculum/docker/module-2.json')); print(m['id'], len(m['chapters']))"`
Expected: `module-2 5`

### Task 5: 模块 3 内容（4 章，含 3.2 动画）

**Files:**
- Create: `curriculum/docker/module-3.json`

- [ ] **Step 1: 写整个文件**

`curriculum/docker/module-3.json` 完整内容：

```json
{
  "id": "module-3",
  "title": "网络",
  "weeks": "第4周",
  "prerequisites": "上完模块 1",
  "chapters": [
    {
      "id": "3.1",
      "title": "bridge 网络与容器间通信",
      "goal": "理解默认 bridge 网络，容器如何互相通信",
      "diagram": "flowchart LR\n  A[\"容器 A\"] --> B[\"docker0 网桥\"]\n  C[\"容器 B\"] --> B\n  B --> D[\"各自私有 IP\"]\n  D --> E[\"同网桥可直连\"]",
      "concepts": [
        {"name": "默认 bridge", "detail": "docker0 虚拟网桥，容器默认接入，各自分配私有 IP。"},
        {"name": "容器互通", "detail": "同一 bridge 上容器可直连对方内网 IP，无需 -p。"},
        {"name": "隔离性", "detail": "bridge 内互通，跨 bridge 或与外界通信需端口映射。"}
      ],
      "code": "docker run -d --name db alpine\n# 另一容器内 ping db 的内网 IP",
      "todo": "",
      "exercise": "起两个容器，找出各自 IP，验证它们在同一网桥能互通。",
      "quiz_topics": ["bridge 网络", "docker0", "容器间直连"]
    },
    {
      "id": "3.2",
      "title": "端口映射",
      "goal": "理解 -p HOST:CONTAINER 端口映射的原理",
      "diagram": "flowchart LR\n  A[\"外部客户端\"] --> B[\"宿主机 localhost:8080\"]\n  B -->|DNAT 转发| C[\"容器 :80\"]\n  C --> D[容器内应用]\n  D --> B",
      "animation": "port-mapping",
      "concepts": [
        {"name": "映射目的", "detail": "容器端口默认仅在内部，-p 把宿主端口转发到容器端口。"},
        {"name": "DNAT", "detail": "宿主机做目的地址转换，流量 host:port 转发到 container:port。"},
        {"name": "冲突与多实例", "detail": "宿主端口唯一，可多个容器映射到不同宿主端口。"}
      ],
      "code": "docker run -d -p 8080:80 nginx\n# 访问 http://localhost:8080",
      "todo": "",
      "exercise": "起 nginx 映射 8080:80 用浏览器访问；再试 9090:80 并观察端口占用。",
      "quiz_topics": ["-p 端口映射", "DNAT", "宿主端口冲突"]
    },
    {
      "id": "3.3",
      "title": "自定义网络与 DNS",
      "goal": "用自定义网络让容器通过容器名互相发现",
      "diagram": "flowchart LR\n  A[\"docker network create app\"] --> B[\"容器加入自定义网络\"]\n  B --> C[\"内嵌 DNS 服务\"]\n  C --> D[\"容器名到 IP 自动解析\"]\n  D --> E[\"直接 ping 名字\"]",
      "concepts": [
        {"name": "自定义 network", "detail": "docker network create 建独立网络，容器显式加入。"},
        {"name": "内嵌 DNS", "detail": "同一自定义网络的容器可用容器名互相解析，不必记 IP。"},
        {"name": "对比默认 bridge", "detail": "默认 bridge 无内置 DNS，只能靠 IP 或 --link。"}
      ],
      "code": "docker network create app\ndocker run -d --network app --name db alpine\n# 另一容器加入同一网络后可直接 ping db",
      "todo": "",
      "exercise": "建一个自定义网络，起两个容器并加入，用容器名互相 ping 通。",
      "quiz_topics": ["自定义网络", "内嵌 DNS", "服务发现"]
    },
    {
      "id": "3.4",
      "title": "网络模式",
      "goal": "区分 bridge / host / none 等网络模式及适用场景",
      "diagram": "flowchart TD\n  A{选哪种网络模式?} -->|默认| B[\"bridge 虚拟网桥 + NAT\"]\n  A -->|性能优先| C[\"host 共享宿主网络栈\"]\n  A -->|完全隔离| D[\"none 无网络\"]",
      "concepts": [
        {"name": "bridge（默认）", "detail": "虚拟网桥 + NAT，隔离且通用。"},
        {"name": "host", "detail": "直接共享宿主网络栈，无隔离、性能最好（Linux）。"},
        {"name": "none", "detail": "无任何网络，仅回环，用于完全隔离。"}
      ],
      "code": "docker run --network host nginx\n# 直接占用宿主机 80 端口",
      "todo": "",
      "exercise": "说明 host 模式与默认 bridge 在端口访问上的差异。",
      "quiz_topics": ["host 模式", "none 模式", "网络模式选择"]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 合法与章数**

Run: `python3 -c "import json; m=json.load(open('curriculum/docker/module-3.json')); print(m['id'], len(m['chapters']))"`
Expected: `module-3 4`

### Task 6: 模块 4 内容（4 章，含 4.2 动画）

**Files:**
- Create: `curriculum/docker/module-4.json`

- [ ] **Step 1: 写整个文件**

`curriculum/docker/module-4.json` 完整内容：

```json
{
  "id": "module-4",
  "title": "数据管理",
  "weeks": "第5周",
  "prerequisites": "上完模块 3",
  "chapters": [
    {
      "id": "4.1",
      "title": "bind mount：宿主机目录直挂",
      "goal": "用 bind mount 把宿主机目录挂进容器实现双向同步",
      "diagram": "flowchart LR\n  A[\"宿主机目录 /home/user/app\"] <-->|双向同步| B[\"容器路径 /app\"]\n  B --> C[\"开发期改代码即生效\"]",
      "concepts": [
        {"name": "bind mount", "detail": "把宿主绝对路径挂到容器指定路径，两侧实时同步。"},
        {"name": "适用场景", "detail": "开发期热更（改代码容器即生效）、共享配置文件。"},
        {"name": "语法", "detail": "-v /host/path:/container/path，宿主路径必须是绝对路径。"}
      ],
      "code": "docker run -v $(pwd):/app -p 8080:80 nginx\n# 本地改静态文件，容器立即可见",
      "todo": "",
      "exercise": "bind mount 挂一个本地目录进 nginx，改文件验证双向同步。",
      "quiz_topics": ["bind mount", "-v 语法", "开发热更"]
    },
    {
      "id": "4.2",
      "title": "volume：具名卷与持久化",
      "goal": "理解具名卷的持久化语义及与 bind mount 的区别",
      "diagram": "flowchart TD\n  A[\"具名卷 mydata\"] <--> B[\"容器 /data\"]\n  B --> C[\"容器写数据进卷\"]\n  C --> D[\"容器被删\"]\n  D --> E[\"卷仍在，数据不丢\"]\n  E --> F[\"新容器挂同卷\"]",
      "animation": "volume",
      "concepts": [
        {"name": "volume", "detail": "docker 托管的存储，独立于容器生命周期，删容器数据还在。"},
        {"name": "具名卷", "detail": "-v myvol:/data，由 docker 管理路径，可跨容器共享、复用。"},
        {"name": "对比 bind mount", "detail": "volume 可移植、由 docker 管理，是持久化的推荐方式。"}
      ],
      "code": "docker volume create mydata\ndocker run -v mydata:/data alpine\n# 删容器后 volume 与数据仍在",
      "todo": "",
      "exercise": "建具名卷、写入数据、删容器、新容器挂同卷验证数据仍在。",
      "quiz_topics": ["volume 持久化", "具名卷", "volume vs bind mount"]
    },
    {
      "id": "4.3",
      "title": "挂载的坑",
      "goal": "识别挂载常见三类坑并规避",
      "diagram": "flowchart TD\n  A{挂载场景} -->|路径写错| B[\"默默新建空 volume\"]\n  A -->|挂到已有路径| C[\"遮蔽镜像原内容\"]\n  A -->|权限不匹配| D[\"uid/gid 读写失败\"]",
      "concepts": [
        {"name": "路径写错", "detail": "-v 写相对路径或宿主路径不存在，会被当作 volume 名默默新建，不报错。"},
        {"name": "覆盖坑", "detail": "挂载到镜像内已有文件/目录的路径，会遮蔽镜像原内容。"},
        {"name": "权限坑", "detail": "容器内 uid 与宿主文件权限不匹配，导致读写失败。"}
      ],
      "code": "# 常见错误：相对路径被当成 volume 名\ndocker run -v ./data:/app/data alpine",
      "todo": "",
      "exercise": "复现「挂空卷遮蔽镜像内 nginx 默认首页」并说明为何。",
      "quiz_topics": ["挂载路径坑", "覆盖遮蔽", "权限 uid/gid"]
    },
    {
      "id": "4.4",
      "title": "备份恢复与数据卷迁移",
      "goal": "掌握卷数据备份、恢复与迁移的方法",
      "diagram": "flowchart LR\n  A[\"卷 mydata\"] --> B[\"临时容器 tar 打包\"]\n  B --> C[\"备份文件 mydata.tgz\"]\n  C --> D[新环境恢复]\n  D --> E[\"解包回新卷\"]",
      "concepts": [
        {"name": "备份", "detail": "用一个临时容器挂卷，把数据 tar 打包到宿主机。"},
        {"name": "恢复", "detail": "把 tar 解包回新卷。"},
        {"name": "迁移", "detail": "数据卷可跨主机迁移，备份归档后拷到新机恢复。"}
      ],
      "code": "docker run --rm -v mydata:/data -v $(pwd):/backup alpine tar czf /backup/mydata.tgz -C /data .",
      "todo": "",
      "exercise": "用 tar 备份一个卷，删卷后从 tar 恢复并验证数据。",
      "quiz_topics": ["卷备份", "卷恢复", "跨主机迁移"]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 合法与章数**

Run: `python3 -c "import json; m=json.load(open('curriculum/docker/module-4.json')); print(m['id'], len(m['chapters']))"`
Expected: `module-4 4`

### Task 7: 模块 5 内容（5 章）

**Files:**
- Create: `curriculum/docker/module-5.json`

- [ ] **Step 1: 写整个文件**

`curriculum/docker/module-5.json` 完整内容：

```json
{
  "id": "module-5",
  "title": "Compose 与生产化",
  "weeks": "第6周",
  "prerequisites": "上完模块 2-4",
  "chapters": [
    {
      "id": "5.1",
      "title": "多容器应用与 docker compose",
      "goal": "理解 compose 解决单机多容器编排的问题",
      "diagram": "flowchart LR\n  A[\"web + db + redis 多容器\"] --> B[\"一个 compose.yml 声明\"]\n  B -->|docker compose up| C[\"一键起全部\"]\n  C --> D[\"可复现、进版本控制\"]",
      "concepts": [
        {"name": "痛点", "detail": "多容器应用要用一堆 docker run 加网络手工串联，易错难复现。"},
        {"name": "compose", "detail": "一个 compose.yml 声明所有服务、网络、卷，docker compose up 一键起。"},
        {"name": "声明式", "detail": "环境可复现，团队共享同一配置，天然进版本控制。"}
      ],
      "code": "services:\n  web:\n    image: nginx\n  db:\n    image: postgres:16",
      "todo": "",
      "exercise": "列举手工 run 起 web+db 要做的步骤，对比 compose 一行 up 的差别。",
      "quiz_topics": ["compose 定位", "多容器编排", "声明式配置"]
    },
    {
      "id": "5.2",
      "title": "compose 文件结构",
      "goal": "读懂并编写 services / networks / volumes 三段式 compose 文件",
      "diagram": "flowchart TD\n  A[compose.yml] --> B[services 服务定义]\n  A --> C[networks 网络]\n  A --> D[volumes 数据卷]\n  B --> E[\"up -d 后台启动\"]",
      "concepts": [
        {"name": "services", "detail": "定义各容器（镜像、构建、端口、环境、卷）。"},
        {"name": "networks / volumes", "detail": "顶层声明网络与卷，供服务引用。"},
        {"name": "常用命令", "detail": "up -d 后台起、down 停并清理、ps 看状态。"}
      ],
      "code": "services:\n  web:\n    image: nginx\n    ports: [\"8080:80\"]\n    networks: [app]\n  db:\n    image: postgres:16\n    volumes: [dbdata:/var/lib/postgresql/data]\nnetworks:\n  app:\nvolumes:\n  dbdata:",
      "todo": "",
      "exercise": "写一个 web+db 的 compose 文件并 up -d 验证。",
      "quiz_topics": ["services 段", "networks/volumes 段", "up/down"]
    },
    {
      "id": "5.3",
      "title": "环境变量、depends_on 与 healthcheck",
      "goal": "用环境变量、启动顺序与健康检查让 compose 编排更可靠",
      "diagram": "flowchart LR\n  A[\"environment 注入配置\"] --> B[\"depends_on 控制顺序\"]\n  B --> C[\"healthcheck 健康检查\"]\n  C --> D[\"condition: service_healthy\"]\n  D --> E[\"真正等就绪后再启动\"]",
      "concepts": [
        {"name": "environment / env_file", "detail": "注入配置，避免硬编码密码。"},
        {"name": "depends_on", "detail": "控制启动顺序，但只等「启动」不等「就绪」。"},
        {"name": "healthcheck", "detail": "定义健康检查，配合 condition: service_healthy 真正等就绪。"}
      ],
      "code": "services:\n  db:\n    image: postgres:16\n    healthcheck:\n      test: [\"CMD\", \"pg_isready\"]\n  web:\n    depends_on:\n      db:\n        condition: service_healthy",
      "todo": "",
      "exercise": "给 db 加 healthcheck，让 web 用 condition 等 db 就绪再启动。",
      "quiz_topics": ["环境变量注入", "depends_on", "healthcheck"]
    },
    {
      "id": "5.4",
      "title": "资源限制与日志监控",
      "goal": "用资源限额与 logs / stats 做基础运维观测",
      "diagram": "flowchart LR\n  A[\"--cpus / --memory 限额\"] --> B[\"防单容器拖垮宿主\"]\n  C[\"docker logs 看输出\"] --> D[\"docker stats 看资源\"]\n  B --> D",
      "concepts": [
        {"name": "资源限制", "detail": "--cpus、--memory 限制容器 CPU/内存，防单容器拖垮宿主。"},
        {"name": "logs", "detail": "看容器标准输出/错误，-f 实时跟踪、--tail 看尾部。"},
        {"name": "stats", "detail": "实时看各容器 CPU/内存/网络/IO 占用。"}
      ],
      "code": "docker run --cpus=0.5 --memory=512m nginx\ndocker stats",
      "todo": "",
      "exercise": "给容器设 256m 内存上限，用 stats 观察，再试超过上限的行为。",
      "quiz_topics": ["--cpus/--memory", "docker logs", "docker stats"]
    },
    {
      "id": "5.5",
      "title": "镜像安全与最佳实践清单",
      "goal": "按清单做镜像瘦身与安全加固",
      "diagram": "flowchart LR\n  A[\"最小基础镜像 alpine\"] --> B[\"以非 root 运行 USER\"]\n  B --> C[\"镜像扫描漏洞\"]\n  C --> D[\"单进程 / .dockerignore\"]\n  D --> E[\"生产级镜像\"]",
      "concepts": [
        {"name": "最小基线", "detail": "用 alpine、scratch 等最小基础镜像减少攻击面。"},
        {"name": "非 root 运行", "detail": "USER 指令降权，防容器逃逸风险。"},
        {"name": "扫描与单进程", "detail": "用扫描工具查漏洞，一个容器一个进程。"}
      ],
      "code": "FROM alpine\nRUN adduser -D appuser\nUSER appuser\nCMD [\"app\"]",
      "todo": "",
      "exercise": "列出一份不少于 5 条的镜像最佳实践清单并说明每条动机。",
      "quiz_topics": ["最小基础镜像", "非 root 运行", "镜像扫描"]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 合法与章数**

Run: `python3 -c "import json; m=json.load(open('curriculum/docker/module-5.json')); print(m['id'], len(m['chapters']))"`
Expected: `module-5 5`

### Task 8: 全部 diagram 语法校验（内容完成后立即做，早发现 mermaid 错误）

- [ ] **Step 1: 跑校验脚本**

Run:
```bash
cd frontend && node scripts/validate-diagrams.mjs
```
Expected: `107 chapters / 107 diagrams / 8 animations / 0 invalid`，无 missing。（docker 27 章 diagram + 4 章 animation 已计入；107 = 现有 80 + docker 27，8 = 4 ML + 4 docker。）

- [ ] **Step 2: 若有 invalid，逐条看报错**

按报错里的 `course/module-file chapter-id title` 定位，按本计划「执行须知 3」的 mermaid 铁律修正对应 `diagram` 字符串后重跑，直到 0 invalid。

### Task 9: ImageLayersAnimation + BuildCacheAnimation

**Files:**
- Create: `frontend/src/components/animations/ImageLayersAnimation.tsx`
- Create: `frontend/src/components/animations/BuildCacheAnimation.tsx`

- [ ] **Step 1: 新建 ImageLayersAnimation.tsx**

`frontend/src/components/animations/ImageLayersAnimation.tsx`：

```tsx
import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED } from './colors'

// 只读层自底向上；改的层越靠下，需要重建的层越多。
const READONLY = ['ubuntu:22.04（基础镜像）', 'RUN apt-get install curl', 'COPY app /app', 'CMD ["node","app.js"]']

const WIDTH = 480
const HEIGHT = 320
const BAR_X = 96
const BAR_W = WIDTH - BAR_X - 16
const BAR_H = 40
const GAP = 8
const TOP = 40
const barY = (topIdx: number) => TOP + topIdx * (BAR_H + GAP)

export default function ImageLayersAnimation() {
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSelected(s => (s + 1) % READONLY.length), 1600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="镜像分层动画">
        {/* 容器可写层（顶层，虚线） */}
        <rect x={BAR_X} y={barY(0)} width={BAR_W} height={BAR_H} rx="6" fill="#fff" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={BAR_X + 12} y={barY(0) + BAR_H / 2 + 4} fontSize="12" fill="#1f2328">容器可写层（read-write）</text>
        <text x={BAR_X - 10} y={barY(0) + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill={MUTED}>可写</text>
        {/* 只读层：READONLY[i] 底→顶索引即 i，渲染在 topIdx = len - i */}
        {READONLY.map((name, i) => {
          const rebuilt = i >= selected
          const y = barY(READONLY.length - i)
          return (
            <g key={name}>
              <rect x={BAR_X} y={y} width={BAR_W} height={BAR_H} rx="6"
                fill={rebuilt ? '#fbe0d6' : '#dcebfb'} stroke={rebuilt ? ORANGE : BLUE} strokeWidth="1.5" />
              <text x={BAR_X + 12} y={y + BAR_H / 2 + 4} fontSize="12" fill="#1f2328">{name}</text>
              <text x={BAR_X + BAR_W - 10} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill={rebuilt ? ORANGE : BLUE}>
                {rebuilt ? '重建' : '缓存'}
              </text>
              <text x={BAR_X - 10} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill={MUTED}>只读</text>
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label>改动落在第 {selected} 层（自底向上）</label>
        <input type="range" min="0" max={READONLY.length - 1} step="1" value={selected} onChange={e => setSelected(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        改「{READONLY[selected]}」→ 该层及其上 {READONLY.length - selected} 层全部重建：改得越靠底层代价越大（COW）
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 新建 BuildCacheAnimation.tsx**

`frontend/src/components/animations/BuildCacheAnimation.tsx`：

```tsx
import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED } from './colors'

const STEPS = ['FROM node:18', 'COPY package*.json ./', 'RUN npm install', 'COPY . .', 'CMD ["npm","start"]']

const WIDTH = 480
const HEIGHT = 300
const ROW_X = 56
const ROW_W = WIDTH - ROW_X - 100
const ROW_H = 38
const GAP = 12
const TOP = 34

export default function BuildCacheAnimation() {
  const [changed, setChanged] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setChanged(c => (c + 1) % STEPS.length), 1800)
    return () => clearInterval(timer)
  }, [])

  const rebuilt = (i: number) => i >= changed

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="构建缓存动画">
        {STEPS.map((cmd, i) => {
          const y = TOP + i * (ROW_H + GAP)
          const on = rebuilt(i)
          return (
            <g key={cmd}>
              <rect x={ROW_X} y={y} width={ROW_W} height={ROW_H} rx="6"
                fill={on ? '#fbe0d6' : '#dcebfb'} stroke={on ? ORANGE : BLUE} strokeWidth="1.5" />
              <text x={ROW_X + 12} y={y + ROW_H / 2 + 4} fontSize="12" fill="#1f2328" fontFamily="monospace">{cmd}</text>
              <text x={ROW_X + ROW_W + 14} y={y + ROW_H / 2 + 4} fontSize="12" fill={on ? ORANGE : BLUE}>
                {on ? '✕ 重建' : '✓ 缓存'}
              </text>
              <text x={ROW_X - 10} y={y + ROW_H / 2 + 4} textAnchor="end" fontSize="11" fill={MUTED}>{i + 1}</text>
            </g>
          )
        })}
      </svg>
      <div className="anim-controls">
        <label>修改第 {changed + 1} 步</label>
        <input type="range" min="0" max={STEPS.length - 1} step="1" value={changed} onChange={e => setChanged(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        改动「{STEPS[changed]}」→ 该步及之后全部重建，之前的命中缓存；把不常变的依赖放前面
      </p>
    </div>
  )
}
```

### Task 10: PortMappingAnimation + VolumeAnimation

**Files:**
- Create: `frontend/src/components/animations/PortMappingAnimation.tsx`
- Create: `frontend/src/components/animations/VolumeAnimation.tsx`

- [ ] **Step 1: 新建 PortMappingAnimation.tsx**

`frontend/src/components/animations/PortMappingAnimation.tsx`：

```tsx
import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 220
const HOST_X = 24
const HOST_W = 130
const CONT_X = WIDTH - 24 - 130
const CONT_W = 130
const BOX_Y = 70
const BOX_H = 70

export default function PortMappingAnimation() {
  const [port, setPort] = useState(8080)
  const [pkt, setPkt] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setPkt(v => (v + 7) % WIDTH), 40)
    return () => clearInterval(timer)
  }, [])

  const inHost = pkt >= HOST_X && pkt <= HOST_X + HOST_W
  const inCont = pkt >= CONT_X && pkt <= CONT_X + CONT_W
  const y = BOX_Y + BOX_H / 2

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="端口映射动画">
        <text x={30} y={30} fontSize="11" fill={MUTED}>外部客户端</text>
        <rect x={HOST_X} y={BOX_Y} width={HOST_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={HOST_X + HOST_W / 2} y={BOX_Y - 10} textAnchor="middle" fontSize="12" fill={MUTED}>宿主机</text>
        <text x={HOST_X + HOST_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328" fontFamily="monospace">:{port}</text>
        <rect x={WIDTH / 2 - 26} y={BOX_Y + 14} width={52} height={42} rx="6" fill="#fff" stroke={ORANGE} strokeWidth="2" />
        <text x={WIDTH / 2} y={BOX_Y + 38} textAnchor="middle" fontSize="11" fill={ORANGE}>-p</text>
        <text x={WIDTH / 2} y={BOX_Y + 52} textAnchor="middle" fontSize="10" fill={MUTED}>DNAT</text>
        <rect x={CONT_X} y={BOX_Y} width={CONT_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={CONT_X + CONT_W / 2} y={BOX_Y - 10} textAnchor="middle" fontSize="12" fill={MUTED}>容器</text>
        <text x={CONT_X + CONT_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="13" fill="#1f2328" fontFamily="monospace">:80</text>
        <line x1={4} y1={y} x2={HOST_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={HOST_X + HOST_W} y1={y} x2={WIDTH / 2 - 26} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={WIDTH / 2 + 26} y1={y} x2={CONT_X} y2={y} stroke={GRID} strokeWidth="2" />
        <line x1={CONT_X + CONT_W} y1={y} x2={WIDTH - 4} y2={y} stroke={GRID} strokeWidth="2" />
        <circle cx={pkt} cy={y} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="anim-controls">
        <label>宿主机端口 = {port}</label>
        <input type="range" min="8000" max="9000" step="10" value={port} onChange={e => setPort(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        外部请求命中 localhost:{port} → DNAT 转发到容器 :80{inHost ? ' → 数据包进入宿主机' : inCont ? ' → 到达容器内应用' : ''}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 新建 VolumeAnimation.tsx**

`frontend/src/components/animations/VolumeAnimation.tsx`：

```tsx
import { useEffect, useState } from 'react'
import { BLUE, ORANGE, MUTED, GRID } from './colors'

const WIDTH = 480
const HEIGHT = 240
const VOL_X = 24
const VOL_W = 150
const CONT_X = WIDTH - 24 - 150
const CONT_W = 150
const BOX_Y = 60
const BOX_H = 100

const FILES = [
  { dx: 30, dy: 40 }, { dx: 70, dy: 40 }, { dx: 110, dy: 40 }, { dx: 50, dy: 70 },
]

const PHASE_NOTE: Record<number, string> = {
  1: '① 容器把数据写进 /data（落到卷）',
  2: '② docker rm 删除容器 → 容器消失',
  3: '③ 新容器挂同一卷 → 数据还在',
}

export default function VolumeAnimation() {
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => setPhase(p => (p >= 3 ? 1 : p + 1)), 1500)
    return () => clearInterval(timer)
  }, [])

  const containerAlive = phase !== 2

  return (
    <div className="animation-box">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="数据卷动画">
        <rect x={VOL_X} y={BOX_Y} width={VOL_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={BLUE} strokeWidth="1.5" />
        <text x={VOL_X + VOL_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="12" fill={MUTED}>宿主机卷 mydata</text>
        {FILES.map((f, i) => (
          <rect key={i} x={VOL_X + f.dx} y={BOX_Y + f.dy} width="14" height="14" rx="3" fill={ORANGE} stroke="#fff" />
        ))}
        <line x1={VOL_X + VOL_W} y1={BOX_Y + BOX_H / 2} x2={CONT_X} y2={BOX_Y + BOX_H / 2} stroke={GRID} strokeWidth="2" strokeDasharray="5 4" />
        <text x={(VOL_X + VOL_W + CONT_X) / 2} y={BOX_Y + BOX_H / 2 - 8} textAnchor="middle" fontSize="11" fill={MUTED}>挂载</text>
        <g opacity={containerAlive ? 1 : 0.25}>
          <rect x={CONT_X} y={BOX_Y} width={CONT_W} height={BOX_H} rx="8" fill="#dcebfb" stroke={containerAlive ? BLUE : '#9aa0a6'} strokeWidth="1.5" />
          <text x={CONT_X + CONT_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="12" fill={MUTED}>
            {containerAlive ? '容器 /data' : '容器（已删除）'}
          </text>
          {containerAlive && FILES.map((f, i) => (
            <rect key={i} x={CONT_X + f.dx} y={BOX_Y + f.dy} width="14" height="14" rx="3" fill={ORANGE} stroke="#fff" />
          ))}
        </g>
        {!containerAlive && (
          <text x={CONT_X + CONT_W / 2} y={BOX_Y + BOX_H / 2 + 4} textAnchor="middle" fontSize="24" fill="#9aa0a6">✕</text>
        )}
      </svg>
      <div className="anim-controls">
        <label>阶段 {phase} / 3</label>
        <input type="range" min="1" max="3" step="1" value={phase} onChange={e => setPhase(Number(e.target.value))} />
      </div>
      <p className="anim-caption">
        {PHASE_NOTE[phase]}｜数据存卷里，容器删了卷还在
      </p>
    </div>
  )
}
```

### Task 11: 注册 4 动画 + typecheck / build

**Files:**
- Modify: `frontend/src/components/animations/index.tsx`

- [ ] **Step 1: 替换 index.tsx 为完整新内容**

`frontend/src/components/animations/index.tsx` 整体替换为：

```tsx
import type { ComponentType } from 'react'
import BackpropAnimation from './BackpropAnimation'
import BuildCacheAnimation from './BuildCacheAnimation'
import ConvolutionAnimation from './ConvolutionAnimation'
import DecisionTreeAnimation from './DecisionTreeAnimation'
import GradientDescentAnimation from './GradientDescentAnimation'
import ImageLayersAnimation from './ImageLayersAnimation'
import PortMappingAnimation from './PortMappingAnimation'
import VolumeAnimation from './VolumeAnimation'

// chapter.animation 枚举 → 动画组件。未注册的值静默不渲染（向后兼容）。
const ANIMATIONS: Record<string, ComponentType> = {
  'gradient-descent': GradientDescentAnimation,
  backprop: BackpropAnimation,
  convolution: ConvolutionAnimation,
  'decision-tree': DecisionTreeAnimation,
  'image-layers': ImageLayersAnimation,
  'build-cache': BuildCacheAnimation,
  'port-mapping': PortMappingAnimation,
  volume: VolumeAnimation,
}

export default function AnimationHost({ kind }: { kind: string }) {
  const Cmp = ANIMATIONS[kind]
  if (!Cmp) return null
  return <Cmp />
}

export function hasAnimation(kind: string): boolean {
  return kind in ANIMATIONS
}
```

- [ ] **Step 2: 验证**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: 两者均无报错退出（build 有 chunk>500kB 提示属正常，忽略）。

### Task 12: 总验证（对应 spec §⑥ 成功标准）

- [ ] **Step 1: 全部静态检查**

```bash
cd frontend && npm run typecheck && npm run build && node scripts/validate-diagrams.mjs
```
Expected: 全部通过；`107 chapters / 107 diagrams / 8 animations / 0 invalid`。

- [ ] **Step 2: 后端 import 冒烟**

```bash
cd /Users/geyuanyuan/Project/ai-agent-learn && python3 -c "from src.main import app; print('backend ok')"
```
Expected: `backend ok`

- [ ] **Step 3: 课程列表含 docker**

```bash
python3 -c "import json; d=json.load(open('curriculum/courses.json')); print([c['id'] for c in d])"
```
Expected: 末端是 `docker`。

- [ ] **Step 4: 前端渲染冒烟（人眼）**

```bash
cd frontend && npm run build
# 起后端后打开：http://localhost:8000/#/course/docker/lesson/1.2
```
人眼检查：Docker 课流程图 SVG 渲染、4 个动画章（1.2 / 2.2 / 3.2 / 4.2）自动播放 + slider 可调、老课程照旧不受影响。

### Task 13: 统一提交（需用户确认）

- [ ] **Step 1: 展示变更摘要给用户**

```bash
git status --short && git diff --stat
```
向用户列出：新增 `curriculum/docker/` 6 个 JSON、`courses.json` 改动、4 个动画组件、`index.tsx` 改动、`validate-diagrams.mjs` 改动、spec 与 plan 文档。确认后继续。

- [ ] **Step 2: 提交（用户确认后执行）**

```bash
git add -A
git commit -m "Add Docker course with mermaid diagrams and 4 interactive SVG animations"
```

---

## Self-Review 记录

- **Spec 覆盖**：§① 课程注册（Task 1）+ 27 章字段与 4 动画映射（Task 2–7）✓；§② 管线零改动 + validate 加 docker（Task 1）✓；§③ 4 动画组件 + 注册（Task 9–11）✓；§④ 27 章全量内容与 diagram（Task 2–7）✓；§⑤ 内容模板逐字段写全（各章 code/concepts/exercise/quiz_topics 均落地）✓；成功标准 1–5 由 Task 8、11、12 覆盖 ✓；Non-goals 未改后端/types/curriculum.py、图不进 prompt（Task 1–7 只写 JSON，不动 src）✓。
- **占位符扫描**：无 TBD/TODO；24 个（27−3）章节的 `code` 字段为空串是「概念/命令章无代码」的合法值，非占位（3 个概念章 0.1/0.2 与部分网络章以文字描述为主，code 留空符合现有课惯例）。
- **类型一致性**：动画枚举串 `image-layers`/`build-cache`/`port-mapping`/`volume` 在 Task 2–7 的 JSON `animation` 值与 Task 11 的 `ANIMATIONS` 键完全一致；`AnimationHost` 未注册值静默不渲染，与 LessonView 调用一致；4 组件 import 的 colors 符号均在 colors.ts 存在且全部用到。
- **已知风险**：4 个动画组件为计划期定稿、未经运行验证——Task 11/12 的 typecheck 与 Task 12 Step 4 人眼冒烟兜底；若 SVG 布局有重叠（如 port-mapping 的通道线和数据包 y 对齐），在对应组件内微调坐标即可，不影响结构。
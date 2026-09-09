# 机器学习「从入门到精通」课程 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增第三门课「机器学习 从入门到精通」（6 模块 27 章 JSON），并把角色提示词课程无关化。

**Architecture:** 纯数据扩展 + 一处代码修正。课程内容全部落在 `curriculum/machine-learning/module-*.json` 与 `courses.json` 登记；后端讲授/测验逻辑不变，只把 `agents.py` 三套角色提示词里写死的「AI Agent 课程」改为课程无关，并在 `teach/make_quiz/make_review` 注入当前课程标题/简介。前端零改动。

**Tech Stack:** Python（numpy/scikit-learn/PyTorch 为课程内容，非本任务依赖）、JSON 数据、现有 FastAPI/React 不改。

**设计文档:** `docs/superpowers/specs/2026-09-08-machine-learning-course-design.md`（章节大纲与 concepts 要点的权威来源，下称「spec」）。

**测试约定:** 本项目无 pytest（见 CLAUDE.md），不引入测试框架。验证用内联 `.venv/bin/python` 断言 + 启动后端 `curl`。若 `.venv` 不存在，先 `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`。

---

## 文件结构

- **修改** `src/agents.py` — 三套角色提示词课程无关化 + 新增 `course_brief()`；`teach/make_quiz/make_review` 增 `course` 参数。
- **修改** `src/main.py` — 三处 LLM 调用点传入 `curriculum.get_course(course_id)`。
- **创建** `curriculum/machine-learning/module-0.json … module-5.json` — 6 个课程文件。
- **修改** `curriculum/courses.json` — 追加 `machine-learning` 登记。

---

## 内容写作规范（黄金标尺）

本平台讲授 = LLM 读 `concepts/code` 再组织语言。ML 课含大量公式与代码，**每条 `concepts[].detail` 都要「讲透一个关键块」**：给生活化类比/直觉 + 公式（Unicode，如 `J=(1/n)Σ(ŷ−y)²`）+ 一句工程判断。`code` 字段放**完整可运行**的 Python；`todo` 放协作点（引导思路、不给答案）；`exercise` 放一句练习；`quiz_topics` 放 2–3 个主题。两个黄金示例：

**概念章示例（module-0 · 0.1）**

```json
{
  "id": "0.1",
  "title": "什么是机器学习",
  "goal": "能说清「规则系统 vs 从数据学习」的本质区别，以及机器学习的三个要素（数据、模型、算法）",
  "concepts": [
    {"name": "机器学习定义", "detail": "机器学习 = 不手写 if-else 规则，而是让程序从数据里自动学出一个函数 y=f(x)。规则是你告诉它每一步怎么做；学习是你给它「输入 x 和期望输出 y」的例子，让它自己找出规律。"},
    {"name": "模型 = 带参数的函数", "detail": "预测就是把输入算成输出；学习就是不断调参数，让预测尽可能接近真实。线性模型 ŷ = w·x + b 里，w 和 b 就是参数——学习 = 找一组最好的 w,b。"},
    {"name": "三要素与 ML 和 Agent 的关系", "detail": "数据、模型、算法三件套。机器学习（从数据拟合函数）和 AI Agent（会调工具的 LLM 循环）是两件事，正交可组合：Agent 里可以嵌一个 ML 模型来打分或分类。"}
  ],
  "code": "",
  "todo": "",
  "exercise": "用一句话向不写代码的同事解释：为什么垃圾邮件分类要机器学习，而不是写一堆「含『免费』就判垃圾」的规则？",
  "quiz_topics": ["规则 vs 学习", "模型三要素", "ML 与 Agent 的关系"]
}
```

**手写代码章示例（module-1 · 1.2 梯度下降，TODO 协作点）**

```json
{
  "id": "1.2",
  "title": "梯度下降",
  "goal": "手写 numpy 梯度下降拟合出一条直线，理解学习率与收敛",
  "concepts": [
    {"name": "梯度下降直觉", "detail": "像蒙眼下山：不知道谷底在哪，但只要每步都朝「最陡下降方向」走，总会到谷底。梯度 ∇J 指向损失上升最快的方向，参数更新朝反方向走。"},
    {"name": "更新规则", "detail": "w := w − α·∂J/∂w，α 是学习率。对 MSE 损失 J=(1/n)Σ(ŷ−y)²，偏导 ∂J/∂w = (2/n)Σ(ŷ−y)·x。每次用全部样本算梯度再更新，就是批量梯度下降 BGD。"},
    {"name": "学习率的二难", "detail": "α 太大：一步跨过头、震荡甚至发散；α 太小：收敛极慢。工程上从小学习率起步，配合迭代次数观察损失下降曲线判断。"},
    {"name": "三个变体", "detail": "BGD 每次用全量（稳但慢）；SGD 每次随机用 1 个样本（快但抖）；mini-batch 每次一小批（折中），是深度学习最常用的。"}
  ],
  "code": "import numpy as np\n# 造数据：y = 2x + 1 加一点噪声\nX = np.linspace(0, 10, 50)\ny = 2 * X + 1 + np.random.normal(0, 0.5, X.shape)\nw, b = 0.0, 0.0       # 初始化参数\nlr = 0.01             # 学习率\nfor epoch in range(200):\n    yhat = w * X + b\n    dw = (2 / len(X)) * np.sum((yhat - y) * X)   # ∂J/∂w\n    db = (2 / len(X)) * np.sum(yhat - y)          # ∂J/∂b\n    w -= lr * dw\n    b -= lr * db\nprint(f'w={w:.3f}, b={b:.3f}  (真实 w=2, b=1)')",
  "todo": "补全成你自己的版本，先拟合 y = 2x + 1（无噪声），观察 w、b 收敛到多少；再把学习率改成 0.5 和 0.0001 各跑一次，描述损失曲线分别变成什么样，想清楚为什么。",
  "exercise": "把数据换成 y = 3x − 2，看代码能否收敛到 w≈3、b≈−2。",
  "quiz_topics": ["更新规则", "学习率", "BGD 与 SGD"]
}
```

所有章节的 `goal`、`concepts` 的 name+detail 要点、`code/todo/exercise/quiz_topics` 内容来源见 spec §①。detail 扩写时严格套用上述密度：类比 + 公式 + 一句工程判断。

---

## Task 1: 提示词课程无关化

**Files:**
- Modify: `src/agents.py`（提示词 66–96 行、`teach/make_quiz/make_review` 224–246 行）
- Modify: `src/main.py:145-175`

- [ ] **Step 1: 改两处角色提示词**（`DRILL_SYSTEM` 已课程无关，无需改）

`src/agents.py` 第 67 行 `TUTOR_SYSTEM` 首行：

```python
TUTOR_SYSTEM = """你是一个在线学习平台的讲师（Tutor），面向零基础初学者，用中文讲授。
```

第 78 行 `GRADER_SYSTEM` 首行：

```python
GRADER_SYSTEM = """你是一个评分员（Grader），负责为课程章节出测验题并批改。
```

（其余保留原样；`DRILL_SYSTEM` 不改。）

- [ ] **Step 2: 新增 `course_brief` 函数**（放在「三套角色提示词」小节与 `_ask` 之间）

```python
def course_brief(course: dict | None) -> str:
    """把课程标题/简介拼进提示上下文，让角色与被讲课程对齐。"""
    if not course:
        return ""
    parts = [f"当前课程：{course.get('title', '')}"]
    if course.get("description"):
        parts.append(course["description"])
    return "，".join(parts)
```

- [ ] **Step 3: 改 `teach/make_quiz/make_review` 注入 course**

```python
def teach(chapter: dict, course: dict | None = None) -> Lesson:
    from .curriculum import chapter_text
    brief = course_brief(course)
    header = f"{brief}\n\n" if brief else ""
    user = f"{header}请讲授以下章节，严格按要求的四段结构输出：\n\n{chapter_text(chapter)}"
    return _ask(TUTOR_SYSTEM, user, output_model=Lesson, max_tokens=16000)


def make_quiz(chapter: dict, count: int = 20, course: dict | None = None) -> Quiz:
    from .curriculum import chapter_text
    brief = course_brief(course)
    header = f"{brief}\n\n" if brief else ""
    user = (
        f"{header}请针对以下章节出 {count} 道四选一单选题，覆盖核心概念与关键代码，难度由浅入深：\n\n"
        f"{chapter_text(chapter)}"
    )
    return _ask(GRADER_SYSTEM, user, output_model=Quiz, max_tokens=16000)


def make_review(chapter: dict, weak_points: list[str] | None = None, count: int = 10, course: dict | None = None) -> Quiz:
    from .curriculum import chapter_text
    brief = course_brief(course)
    header = f"{brief}\n\n" if brief else ""
    weak = "、".join(weak_points) if weak_points else "无（按核心概念全面复习）"
    user = (
        f"{header}请为一章生成 {count} 道四选一单选复习题，重点针对薄弱环节：{weak}\n\n"
        f"{chapter_text(chapter)}"
    )
    return _ask(DRILL_SYSTEM, user, output_model=Quiz, max_tokens=16000)
```

- [ ] **Step 4: `main.py` 三处调用点传 `course`**

`lesson`（145–155 行）内：

```python
    ch = _get_chapter_or_404(course_id, chapter_id)
    course = curriculum.get_course(course_id)
    try:
        result = agents.teach(ch, course)
```

`quiz`（158–175 行）内：

```python
    ch = _get_chapter_or_404(course_id, chapter_id)
    course = curriculum.get_course(course_id)
    try:
        if review:
            weak = store.get_chapter(curriculum.full_chapter_id(course_id, chapter_id))
            result = agents.make_review(
                ch, weak["weak_points"] if weak else None, count=max(1, count), course=course
            )
        else:
            result = agents.make_quiz(ch, count=max(1, count), course=course)
```

- [ ] **Step 5: 验证**

Run:
```bash
.venv/bin/python -c "from src.agents import course_brief, TUTOR_SYSTEM, GRADER_SYSTEM, DRILL_SYSTEM; assert 'AI Agent' not in TUTOR_SYSTEM and 'AI Agent' not in GRADER_SYSTEM; b=course_brief({'title':'机器学习','description':'测试简介'}); assert '机器学习' in b and '测试简介' in b; print('OK')"
```
Expected: 输出 `OK`

- [ ] **Step 6: Commit**

```bash
git add src/agents.py src/main.py
git commit -m "Make role prompts course-agnostic"
```
（提交前先展示 `git diff` 摘要给用户确认，遵守全局「不自动提交」规则。）

---

## Task 2: course 登记 + module-0

**Files:**
- Modify: `curriculum/courses.json`
- Create: `curriculum/machine-learning/module-0.json`

- [ ] **Step 1: `courses.json` 追加登记**（在数组末尾 `fastapi` 对象后加逗号）

```json
  {
    "id": "machine-learning",
    "title": "机器学习 从入门到精通",
    "description": "从线性回归到 Transformer，numpy 手写核心 + sklearn/PyTorch 实战的渐进式课程",
    "dir": "machine-learning"
  }
```

- [ ] **Step 2: 写 `module-0.json`**

顶层：`"id": "module-0"`, `"title": "预备：机器学习心智模型"`, `"weeks": "第1周"`, `"prerequisites": "懂基础 Python 即可；数学只需高中数学，线性代数/概率课内补"`。

4 章：`0.1 什么是机器学习`（用黄金示例成品）、`0.2 三大范式与任务类型`、`0.3 线性代数与概率速通`、`0.4 环境搭建与第一个模型`。每章 `goal`/`concepts` 要点按 spec §①；`0.3` 的 `code` 写 numpy 基础示例（`np.dot / np.mean / reshape`），`0.4` 的 `code` 写 `load_iris` + 分类器 `fit/predict`，`0.4` 的 `todo`: 「把数据换成自己构造的随机点，观察预测变化」。

- [ ] **Step 3: 验证可加载**

```bash
.venv/bin/python -c "import json; json.load(open('curriculum/machine-learning/module-0.json')); from src.curriculum import course_chapters; chs=course_chapters('machine-learning'); assert len(chs)==4, len(chs); print('module-0 OK,', len(chs), 'chapters')"
```
Expected: `module-0 OK, 4 chapters`

- [ ] **Step 4: Commit**（先展示摘要）

```bash
git add curriculum/courses.json curriculum/machine-learning/module-0.json
git commit -m "Add machine-learning course: module 0"
```

---

## Task 3: module-1（监督学习·回归）

**Files:** Create `curriculum/machine-learning/module-1.json`

顶层：`"id": "module-1"`, `"title": "监督学习·回归"`, `"weeks": "第2-3周"`, `"prerequisites": "预备：心智模型"`。

4 章：`1.1 线性回归与损失函数`、`1.2 梯度下降`（用黄金示例成品，TODO 协作点）、`1.3 过拟合、欠拟合与偏差方差`、`1.4 正则化`。`1.2` 的 `code`（黄金示例）与 `todo` 原样用；`1.1` 的 `code` 写最小二乘/闭式解一行或 numpy 拟合。

验证：`course_chapters('machine-learning')` 应为 8 章。

Commit：`git commit -m "Add machine-learning course: module 1"`

---

## Task 4: module-2（监督学习·分类）

**Files:** Create `curriculum/machine-learning/module-2.json`

顶层：`"id": "module-2"`, `"title": "监督学习·分类"`, `"weeks": "第4-5周"`, `"prerequisites": "模块 1：监督学习·回归"`。

5 章：`2.1 逻辑回归与决策边界`、`2.2 决策树与集成`、`2.3 SVM 与核技巧`、`2.4 模型评估`、`2.5 kNN 与朴素贝叶斯`。公式密集章（2.1 交叉熵、2.4 的 P/R/F1）detail 按黄金标尺写全公式；`2.4` 的 `code` 用 sklearn 打印混淆矩阵/classification_report。

验证：共 13 章。Commit：`module 2`。

---

## Task 5: module-3（无监督 + 工程）

**Files:** Create `curriculum/machine-learning/module-3.json`

顶层：`"id": "module-3"`, `"title": "无监督学习与工程"`, `"weeks": "第6-7周"`, `"prerequisites": "模块 2：监督学习·分类"`。

4 章：`3.1 KMeans 聚类`（TODO 协作点，`code` 写 numpy 手写 KMeans 骨架）、`3.2 PCA 降维`、`3.3 特征工程`、`3.4 交叉验证与超参调优`。`3.1` 的 `todo` 引导手写 KMeans；`3.4` 的 `code` 写 sklearn `cross_val_score` + `GridSearchCV`。

验证：共 17 章。Commit：`module 3`。

---

## Task 6: module-4（神经网络基础）

**Files:** Create `curriculum/machine-learning/module-4.json`

顶层：`"id": "module-4"`, `"title": "神经网络基础"`, `"weeks": "第8-10周"`, `"prerequisites": "模块 3：无监督 + 工程"`。

5 章：`4.1 从感知机到 MLP`、`4.2 前向传播与损失`、`4.3 反向传播`（TODO 协作点）、`4.4 优化器与训练技巧`、`4.5 手写数字识别（MNIST 项目）`。`4.3` 的 `todo` 引导手写反向传播训练两层 MLP 解决 XOR；`4.5` 的 `code` 写完整 numpy MLP 跑 MNIST（≤50 行，压成紧凑版，章内可放宽说明）。

验证：共 22 章。Commit：`module 4`。

---

## Task 7: module-5（深度学习进阶）

**Files:** Create `curriculum/machine-learning/module-5.json`

顶层：`"id": "module-5"`, `"title": "深度学习进阶"`, `"weeks": "第11-14周"`, `"prerequisites": "模块 4：神经网络基础"`。

5 章：`5.1 PyTorch 入门`、`5.2 CNN 卷积神经网络`、`5.3 RNN/LSTM 与序列建模`、`5.4 Transformer 与注意力`、`5.5 训练调优与部署`。`5.1` 的 `code` 写 PyTorch 训练循环模板；`5.2` 的 `code` 写 `nn.Conv2d`/`MaxPool2d` 小网络；`5.4` 的 `todo` 可留空，`quiz_topics` 覆盖注意力/QKV。

验证：共 27 章。Commit：`module 5`。

---

## Task 8: 端到端验证

- [ ] **Step 1: 静态验证全部 JSON + 课程目录**

```bash
.venv/bin/python -c "
from src.curriculum import load_catalog, course_chapters
assert any(c['id']=='machine-learning' for c in load_catalog())
chs = course_chapters('machine-learning')
assert len(chs) == 27, len(chs)
# 必填字段齐全
for ch in chs:
    for k in ('id','title','goal','concepts'):
        assert ch.get(k), (ch['id'], k)
    assert len(ch['concepts']) >= 2, ch['id']
print('OK: 3 courses, machine-learning has 27 chapters')
"
```
Expected: `OK: 3 courses, machine-learning has 27 chapters`

- [ ] **Step 2: 启动后端，验证纯读接口（不耗 token）**

```bash
.venv/bin/python -m uvicorn src.main:app --port 8000
```
另开终端：
```bash
curl -s http://127.0.0.1:8000/api/courses | python -m json.tool   # 应含 machine-learning 卡片
curl -s http://127.0.0.1:8000/api/courses/machine-learning | python -m json.tool  # 6 模块 27 章
```
Expected: 两接口 200，`/api/courses` 返回 3 门课，`/api/courses/machine-learning` 的 `modules` 长度为 6、章节数合计 27。

- [ ] **Step 3（可选，需配置 .env 的 LLM 凭证）: 抽验一次讲授**

```bash
curl -s -X POST http://127.0.0.1:8000/api/courses/machine-learning/chapters/1.2/lesson | python -m json.tool
```
Expected: 返回 `lesson` 四段结构，内容围绕「梯度下降」而非「AI Agent 课程」口吻。

- [ ] **Step 4: 收尾汇报**，列出改动文件清单，请用户确认是否还有其他章要调。

---

## Self-Review 结论

- 覆盖 spec 全部：①课程骨架（Task 2–7）、②数据/JSON（Task 2–7 + 规范）、③代码修正（Task 1）、成功标准 1–6（Task 8 静态/接口验证 + Task 1 验证）。
- 无占位符：每章 content 来源已锚定 spec §① 具体要点 + 两个黄金示例密度；公式/代码的写法有明确标尺。
- 类型/签名一致：`course_brief(course: dict | None) -> str`、`teach(chapter, course=None)`、`make_quiz(chapter, count=20, course=None)`、`make_review(chapter, weak_points=None, count=10, course=None)` 在 Task 1 三处与 `main.py` 调用点一致。
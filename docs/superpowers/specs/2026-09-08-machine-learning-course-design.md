# 机器学习「从入门到精通」课程设计

日期:2026-09-08

## 背景与目标

本仓库是「多课程学习平台」：React + Vite 前端 + FastAPI 后端 + SQLite，加课 = 加一个 JSON 目录 + 在 `courses.json` 登记，无需改前端或大部分后端。已有 `ai-agent`、`fastapi` 两门课。

新增第三门课「机器学习 从入门到精通」，并顺带修正一个影响所有课的既有问题——角色提示词写死「AI Agent 课程」。

目标：产出 6 个 `module-*.json` 的机器学习课程内容 + 一处代码修正（提示词课程无关化），让三门课在讲授/测验/复习时都有正确的课程语境。

## 已定决策

- 路线：**全景**（传统 ML + 深度学习），numpy 手写核心建立直觉 → sklearn/PyTorch 实战。
- 数学前置：**高中基础 + 课程内边讲边补**（线性代数/概率入模块 0 速通）。
- 提示词：**一并修**，课程无关化。
- 规模：**6 模块 ~14 周**，与另外两门课一致。
- 课程标识：`id: "machine-learning"`，`dir: "machine-learning"`，标题「机器学习 从入门到精通」。

## 明确的 Non-goals

- 强化学习、推荐系统不进主线（6 模块装不下），留作课程外扩展方向。
- 不新增依赖、不改前端、不改数据库 schema、不改 `courses.json` 之外的任何路由。
- 不引入尚未讲授的概念——传统 ML 阶段不用 PyTorch，只会 numpy/sklearn。

---

## ① 课程内容骨架

共 6 模块、27 章。每章字段完全复用现有约定：`id / title / goal / concepts[] / code / todo / exercise / quiz_topics[]`，`concepts[].{name, detail}`。章节 `id` 沿用 `模块号.序号`（如 `0.1`、`4.3`）。

> 质量原则：本平台讲授 = LLM 读 JSON 的 `concepts`/`code` 再组织语言。ML 课含大量公式与代码，**concepts[].detail 必须把公式、关键代码片段、手写实现思路直接写进去**（如梯度下降更新规则 `w := w - α·∂J/∂w` 写进 detail，而非只写「更新参数」）。否则 LLM 讲不出深度。

### module-0 预备·机器学习心智模型（第 1 周）

`prerequisites`: "懂基础 Python 即可；数学只需高中数学，线性代数/概率课内补"

- **0.1 什么是机器学习** — goal: 说清「规则系统 vs 从数据学习」的本质区别，以及 ML 三要素（数据/模型/算法）。
  - concepts: 机器学习定义（从数据自动学函数 y=f(x)，而非人肉写 if-else）· 模型=带参数的函数（预测=算输出，学习=调参数）· 与 AI Agent 的关系（Agent=会调工具的 LLM 循环，ML=从数据拟合函数，正交可组合）。
  - exercise: 用一句话向同事解释「为什么垃圾邮件分类要用机器学习而不是写规则」。
  - quiz_topics: 规则 vs 学习 / 模型三要素 / ML 与 Agent 关系。

- **0.2 三大范式与任务类型** — goal: 分清监督/无监督/强化，以及分类/回归/聚类各属哪种。
  - concepts: 监督学习（有标签学 x→y；回归预测连续值，分类预测类别）· 无监督学习（无标签发现结构：聚类/降维）· 强化学习（奖惩试错学策略；本课不深入）。
  - quiz_topics: 三大范式 / 回归 vs 分类 / 聚类归属。

- **0.3 线性代数与概率速通** — goal: 用向量/矩阵表示数据集，理解梯度=最陡上升方向，会用 numpy 做矩阵运算。
  - concepts: 向量与矩阵（样本=行、特征=列；点积；矩阵乘法=批量线性变换）· 导数与梯度（导数=斜率，∇J=最陡上升方向）· 概率（概率/条件概率 P(A|B)/期望 E[X]/独立；贝叶斯一句话）。
  - code: numpy 基础（np.dot / np.mean / reshape）示例。
  - quiz_topics: 矩阵表示 / 梯度方向 / 条件概率。

- **0.4 环境搭建与第一个模型** — goal: 装好 numpy/scikit-learn，跑通 fit/predict，理解「训练一步」发生了什么。
  - concepts: 科学计算栈（numpy ndarray / scikit-learn estimator API / matplotlib，PyTorch 后置）· estimator 三步（实例化→fit(X,y)→predict(X)，全 sklearn 统一）· 用 iris 跑通分类并打印准确率。
  - code: `load_iris` + 分类器 fit/predict。
  - todo: 把数据换成自己构造的随机点，观察预测变化。
  - quiz_topics: estimator API / 训练一步 / 数据形状。

### module-1 监督学习·回归（第 2–3 周）

`prerequisites`: "完成模块 0，会 numpy 基本运算"

- **1.1 线性回归与损失函数** — goal: 写出线性模型 ŷ=w·x+b 与 MSE，理解为何用平方误差。
  - concepts: 假设函数（ŷ=w·x+b，多维 ŷ=Xw+b）· MSE 损失（J=(1/n)Σ(ŷ-y)²，平方让正负误差不抵消、放大异常）· 训练目标（找使 J 最小的 w,b，凸函数有唯一极小值）。
  - quiz_topics: 线性假设 / MSE / 凸性。

- **1.2 梯度下降（TODO 协作点）** — goal: 手写 numpy 梯度下降拟合直线，理解学习率与收敛。
  - concepts: 梯度下降直觉（沿 ∇J 反方向每步迈 α）· 更新规则（w := w - α·∂J/∂w，∂J/∂w=(2/n)Σ(ŷ-y)x）· 学习率（太大震荡发散、太小收敛慢）· 三变体（BGD 全量 / SGD 单样本 / mini-batch 折中）。
  - code: numpy 手写梯度下降循环。
  - todo: 手写梯度下降拟合 y=2x+1（核心协作点，引导思路不给答案）。
  - quiz_topics: 更新规则 / 学习率 / BGD vs SGD。

- **1.3 过拟合、欠拟合与偏差方差** — goal: 判断欠/过拟合，理解偏差-方差权衡，知道留出法。
  - concepts: 欠拟合=太简单（高偏差），过拟合=太复杂学噪声（高方差）· 多项式次数与拟合能力（越高越容易过拟合）· 偏差-方差权衡（总误差=偏差²+方差+噪声，此消彼长）· 留出法（训/测切分估泛化）。
  - quiz_topics: 欠拟合 vs 过拟合 / 偏差方差 / 数据切分。

- **1.4 正则化** — goal: 理解 L1/L2 压制过拟合，以及 Ridge/Lasso 差异。
  - concepts: 正则思想（加惩罚项约束参数别太大）· L2/Ridge（λΣw²，权值整体变小不归零）· L1/Lasso（λΣ|w|，部分权值精确归零=自带特征选择）· 强度 λ（越大模型越简单）。
  - quiz_topics: 正则动机 / L1 vs L2 / λ 的作用。

### module-2 监督学习·分类（第 4–5 周）

`prerequisites`: "完成模块 1"

- **2.1 逻辑回归与决策边界** — goal: 理解 sigmoid 把回归变概率，交叉熵损失与决策边界。
  - concepts: 从回归到分类（σ(z)=1/(1+e⁻ᶻ) 压到 [0,1]）· 交叉熵（-[y·log p+(1-y)·log(1-p)]，分类标准损失）· 决策边界（P=0.5 处，w·x+b=0）。
  - quiz_topics: sigmoid / 交叉熵 / 决策边界。

- **2.2 决策树与集成** — goal: 理解按特征分裂原理，以及随机森林/GBDT 为何更强。
  - concepts: 决策树（反复选最优特征+阈值切纯；熵/基尼衡量纯度）· 过拟合与剪枝（太深死记数据）· 集成（Bagging/随机森林=多树投票降方差；Boosting/GBDT=串行纠错降偏差；XGBoost=工程化 GBDT）。
  - quiz_topics: 分裂准则 / 剪枝 / Bagging vs Boosting。

- **2.3 SVM 与核技巧** — goal: 理解最大间隔与核函数把非线性变线性。
  - concepts: 最大间隔（离两类都最远的超平面泛化好）· 软间隔（允许少量误分，惩罚 C）· 核技巧（Φ(x) 高维映射，核 K(x,x') 免显式映射，如 RBF）。
  - quiz_topics: 最大间隔 / 软间隔 / 核函数。

- **2.4 模型评估** — goal: 会读混淆矩阵，算 P/R/F1，理解 ROC/AUC 与类别不平衡。
  - concepts: 混淆矩阵（TP/FP/FN/TN，准确率在类别不平衡时会骗人）· 精确率/召回/F1（P=TP/(TP+FP)，R=TP/(TP+FN)，F1=2PR/(P+R)）· ROC/AUC（TPR-FPR 轨迹；AUC=随机正例得分高于负例的概率）。
  - quiz_topics: 混淆矩阵 / P/R/F1 / AUC 含义。

- **2.5 kNN 与朴素贝叶斯** — goal: 掌握两个无需训练的算法，理解判别式 vs 生成式。
  - concepts: kNN（近 k 邻居投票，无训练，k 与距离是超参）· 朴素贝叶斯（贝叶斯+特征独立假设，P(y|x)∝P(y)ΠP(xᵢ|y)，文本分类典型）· 判别式 vs 生成式（前者直接学边界，后者学分布）。
  - quiz_topics: kNN 原理 / 朴素贝叶斯假设 / 判别 vs 生成。

### module-3 无监督 + 工程（第 6–7 周）

`prerequisites`: "完成模块 2"

- **3.1 KMeans 聚类（TODO 协作点）** — goal: 手写 KMeans，理解质心与收敛。
  - concepts: KMeans 流程（随机 k 质心→分派最近→重算质心→迭代到稳）· 选 k（肘部法看 SSE 拐点）· 局限（对初始值敏感、假设球状簇、需指定 k）。
  - todo: 手写 KMeans。
  - quiz_topics: KMeans 流程 / 选 k / 局限。

- **3.2 PCA 降维** — goal: 理解主成分=方差最大方向，PCA 用于可视化与去噪。
  - concepts: 主成分（方差最大的新坐标轴，特征向量方向，投影保最多信息）· 降维意义（降噪/可视化/加速）· 与聚类区别（PCA 找方向降维，KMeans 找分组聚类，正交可组合）。
  - quiz_topics: 主成分 / 降维意义 / PCA vs 聚类。

- **3.3 特征工程** — goal: 掌握标准化/归一化、one-hot，理解特征缩放与泄漏。
  - concepts: 标准化 vs 归一化（(x-μ)/σ vs (x-min)/(max-min)，对梯度/距离/正则影响大）· one-hot（类别变 0/1 向量，避免假序）· 特征泄漏（测试集信息混进训练，要 fit 训练集再 transform）。
  - quiz_topics: 标准化 vs 归一化 / one-hot / 泄漏。

- **3.4 交叉验证与超参调优** — goal: 会用 k-fold 与 grid search 选超参，理解正确数据切分。
  - concepts: k-fold（分 k 折轮换验证取平均，比单次留出稳）· 超参 vs 参数（超参靠验证集调，参数靠训练集学）· Grid/Random Search（穷举 vs 随机采样）。
  - quiz_topics: k-fold / 超参 vs 参数 / 调参方法。

### module-4 神经网络基础（第 8–10 周）

`prerequisites`: "完成模块 3，熟悉 numpy"

- **4.1 从感知机到 MLP** — goal: 理解神经元、激活函数，以及非线性是表达力来源。
  - concepts: 感知机（加权求和+激活；单层只能线性分类，异或都分不了）· 激活函数（sigmoid/tanh/ReLU；ReLU=max(0,z) 缓解梯度消失）· 多层堆叠（隐藏层+非线性→可拟合任意复杂函数）。
  - quiz_topics: 感知机局限 / 激活函数 / 非线性作用。

- **4.2 前向传播与损失** — goal: 矩阵化写出一层前向，理解常用损失。
  - concepts: 前向传播（z=Wx+b，a=σ(z)，逐层到输出）· 损失（MSE/二分类交叉熵/多分类 softmax+交叉熵）· softmax（logits 转成和=1 的概率）。
  - quiz_topics: 前向传播 / 各损失适用 / softmax。

- **4.3 反向传播（TODO 协作点）** — goal: 手写 numpy 反向传播训练 MLP，理解链式法则。
  - concepts: 链式法则（∂L/∂w=∂L/∂a·∂a/∂z·∂z/∂w，误差逐层回传）· 梯度回传直觉（每层把输出误差乘本层导数传给上层）· 反向传播=高效算全参数梯度的对称算法。
  - todo: 手写反向传播训练两层 MLP 解决 XOR。
  - quiz_topics: 链式法则 / 梯度回传 / 反向传播本质。

- **4.4 优化器与训练技巧** — goal: 理解 SGD 到 Adam，会处理学习率、初始化、早停。
  - concepts: 动量/Adam（自适应每参数学习率，一阶矩+二阶矩，更稳）· 权重初始化（太小梯度消失、太大会爆炸；He/Xavier 平衡方差）· 早停与 batch（验证集不降就停；mini-batch 大小权衡）。
  - quiz_topics: Adam / 初始化 / 早停。

- **4.5 手写数字识别（MNIST 小项目）** — goal: numpy 手写 MLP 跑通 MNIST，串起前四章。
  - concepts: MNIST（28×28 压 784 维，softmax 输出 10 类）· 端到端流程（加载→归一化→前向→损失→反向→更新→测准确率）· 手写 vs 框架（手写只建直觉，工程用 PyTorch）。
  - code: 完整 numpy MLP。
  - quiz_topics: MNIST 流程 / 端到端训练 / 手写 vs 框架。

### module-5 深度学习进阶（第 11–14 周）

`prerequisites`: "完成模块 4"

- **5.1 PyTorch 入门** — goal: 会用 Tensor、autograd、Dataset/DataLoader 写训练循环。
  - concepts: Tensor 与 autograd（requires_grad 建计算图，loss.backward() 一次求全梯度）· Dataset/DataLoader（批处理、shuffle，告别手写 mini-batch）· 训练循环模板（model→optimizer→loss→forward→backward→step）。
  - quiz_topics: autograd / DataLoader / 训练循环。

- **5.2 CNN 卷积神经网络** — goal: 理解卷积/池化如何提取空间特征与共享权重。
  - concepts: 卷积（滑动滤波器加权和，检测边缘/纹理；权重共享减参）· 池化（max-pool 下采样，增平移不变、降计算）· 经典结构（若干 conv→pool 层叠 + 全连接头；感受野随层增大）。
  - quiz_topics: 卷积 / 池化 / 权重共享。

- **5.3 RNN/LSTM 与序列建模** — goal: 理解序列建模与梯度消失，以及 LSTM 门控如何缓解。
  - concepts: RNN（隐藏状态循环传递，每步吃当前输入+上一状态）· 梯度消失/爆炸（BPTT 连乘致梯度趋零）· LSTM（输入/遗忘/输出三门+细胞状态，选择性记忆）。
  - quiz_topics: RNN 结构 / 梯度消失 / LSTM 门控。

- **5.4 Transformer 与注意力** — goal: 理解自注意力、多头，以及为何取代 RNN。
  - concepts: 注意力（Q·Kᵀ 求相似度→softmax 加权 V，任意位置直接交互）· 自注意力+多头（序列内互相 attend，多头并行学不同关系）· 为何取代 RNN（并行、长程依赖直接可达；LLM 即超大 Transformer）。
  - quiz_topics: 注意力机制 / 多头 / vs RNN。

- **5.5 训练调优与部署** — goal: 掌握 dropout/BN/迁移学习，知道模型怎么上线。
  - concepts: 正则化（dropout 随机丢神经元；BatchNorm 归一层输出稳定训练）· 迁移学习（预训练特征冻结底层微调顶层，小数据也能训）· 部署（保存/加载、ONNX、batch 与吞吐权衡、离线 vs 在线推理）。
  - quiz_topics: dropout / BN / 迁移学习 / 部署。

---

## ② 数据文件与 JSON 结构

- 新建目录 `curriculum/machine-learning/`，内含 `module-0.json` … `module-5.json`（共 6 个文件，逐模块就是上面的大纲展开）。
- `curriculum/courses.json` 追加一条：

```json
{
  "id": "machine-learning",
  "title": "机器学习 从入门到精通",
  "description": "从线性回归到 Transformer，numpy 手写核心 + sklearn/PyTorch 实战的渐进式课程",
  "dir": "machine-learning"
}
```

- 每个 module JSON 顶层字段对齐现有约定：`id / title / weeks / prerequisites / chapters[]`；chapter 字段对齐 `id / title / goal / concepts[] / code / todo / exercise / quiz_topics[]`。
- 进度键自动为 `machine-learning:<chapter_id>`，与其它课互不冲突；前端零改动。

## ③ 代码修正（提示词课程无关化）

- `src/agents.py`：
  - `TUTOR_SYSTEM`、`GRADER_SYSTEM`、`DRILL_SYSTEM` 三套提示词中删除「AI Agent 课程」字样，改为课程无关表述（如「你是本学习平台某门课程的讲师」）。
  - `teach(chapter, course)`、`make_quiz(chapter, count, course)`、`make_review(chapter, weak_points, count, course)` 新增 `course` 参数，将课程的 `title` 与 `description` 注入 user 消息顶部（如「当前课程：<title>。<description>」）。
- `src/main.py`：三处调用点传入 `get_course(course_id)`。
- 不新增依赖、不改前端、不改数据库 schema。

---

## 成功标准（Criteria）

1. 主页出现第三张课程卡片「机器学习 从入门到精通」，点击可看到 6 模块、27 章。
2. 任选一章能生成讲授（LLM 按模块语境讲 ML 内容，而非「AI Agent 课程」口吻）。
3. 任选一章能出 20 道四选一题并批改；复习题（遗忘曲线）正常。
4. 手写协作点（梯度下降 / 反向传播 / KMeans）三处的 `todo` 字段生效，讲授时引导学习者自己动手。
5. 三门课（ai-agent / fastapi / machine-learning）的讲授/测验均不再出现「AI Agent 课程」固定称呼。
6. 后端不新增异常：`GET /api/courses`、`GET /api/courses/machine-learning` 正常返回。
"""Agent 层：Tutor / Grader / Drill 三套系统提示词 + LLM API 调用封装。

实现要点（对应课程模块 4「多智能体」）：三个角色并不是三个独立进程，
而是同一个 LLM API + 三套不同的 system prompt。角色切换 = 换 prompt。

按 config.LLM_PROVIDER 分发：anthropic → Claude Messages 协议；
其它任意值 → OpenAI 兼容协议（DeepSeek / 火山方舟 / 本地 vLLM ...）。
"""

from __future__ import annotations

from typing import List

from pydantic import BaseModel

from config import MODEL

_client = None


def _anthropic_client():
    """惰性建连：用 OpenAI 兼容端点时不需要 anthropic SDK，也不需要它的密钥。"""
    global _client
    if _client is None:
        try:
            import anthropic
        except ImportError:
            raise RuntimeError("使用 Anthropic 协议需先安装：pip install anthropic")
        _client = anthropic.Anthropic()
    return _client


# ---------- 结构化输出模型 ----------

class Lesson(BaseModel):
    conclusion: str    # 一句话核心结论
    explanation: str   # 详细展开（场景→原理→应用）
    analogy: str       # 生活化类比
    practice: str      # 动手实践（引导，不给答案）


class Question(BaseModel):
    type: str              # 固定为 choice（四选一单选）
    stem: str              # 题干
    options: List[str] = []  # 恰好 4 项，纯选项文本（不带 "A." 前缀）
    answer: str            # 正确选项字母："A"/"B"/"C"/"D"
    explanation: str       # 解析


class Quiz(BaseModel):
    questions: List[Question]


class AnswerGrade(BaseModel):
    score: int             # 0-100
    correct: bool
    feedback: str          # 点评
    weak_point: str = ""   # 暴露的薄弱点


class QuizGrade(BaseModel):
    results: List[AnswerGrade]


# ---------- 三套角色提示词 ----------

TUTOR_SYSTEM = """你是一个在线学习平台的讲师（Tutor），面向零基础初学者，用中文讲授。

讲授要求：
1. 先给一句话核心结论，再展开。
2. 每个知识点的关键块不超过 3 个。
3. 每个抽象概念配一个生活化类比。
4. 用通俗语言，不用学术黑话，不引入学习者还没学过的概念。
5. 代码、命令、术语用英文，讲解用中文。
6. 章节若有 TODO(人工) 协作点，引导学习者自己动手，讲思路而非直接给答案。
7. 不要照抄讲义的原文，要用自己的话把概念讲透。"""

GRADER_SYSTEM = """你是一个评分员（Grader），负责为课程章节出测验题并批改。

出题要求（只出四选一单选题）：
1. 每题恰好 4 个选项：options 数组 4 项，纯选项文本，不带 "A." 之类前缀。
2. type 固定填 "choice"；answer 填正确选项的字母（"A"/"B"/"C"/"D" 之一）。
3. 干扰项要有迷惑性，考察对概念的真实理解，不出文字游戏题。
4. 题目覆盖章节核心概念与关键代码，难度由浅入深，面向初学者。
5. 用中文出题，代码/术语用英文；解析讲清「为什么」。

批改要求：
1. 学员作答为选项字母（空字符串表示未作答），对照标准答案判分。
2. 给出 0-100 分和点评，明确指出暴露的薄弱点。"""

DRILL_SYSTEM = """你是一个训练师（Drill），按遗忘曲线为已学章节生成复习题。

要求（只出四选一单选题）：
1. 每题恰好 4 个选项：options 数组 4 项，纯选项文本，不带字母前缀；answer 填正确选项字母（"A"/"B"/"C"/"D"）。
2. 题目重点放在学习者薄弱环节和易遗忘的核心概念上。
3. 用中文出题，代码/术语用英文；答案准确，解析讲清「为什么」。"""


def course_brief(course: dict | None) -> str:
    """把课程标题/简介拼进提示上下文，让角色与被讲课程对齐。"""
    if not course:
        return ""
    parts = [f"当前课程：{course.get('title', '')}"]
    if course.get("description"):
        parts.append(course["description"])
    return "，".join(parts)


# ---------- 调用封装 ----------

def _ask(
    system: str,
    user: str,
    *,
    output_model: type[BaseModel] | None = None,
    max_tokens: int = 16000,
    model: str | None = None,
):
    """统一调用，按 config.LLM_PROVIDER 分发。

    anthropic → Claude Messages 协议；其它任意值 → OpenAI 兼容协议
    （DeepSeek / 火山方舟 / 本地 vLLM 等任何 /chat/completions 兼容服务）。

    需要结构化输出时，两边都用「强制工具调用」拿数据：定义一个 schema 即目标结构的
    工具，强制模型调用它，再从工具入参解析。这比让模型直接吐 JSON 更可靠
    （Claude 在开 thinking 时可能返回自然语言；各家 JSON 模式支持参差不齐）。
    """
    from config import LLM_PROVIDER

    if LLM_PROVIDER != "anthropic":
        return _ask_openai_compatible(system, user, output_model, max_tokens)
    return _ask_anthropic(system, user, output_model, max_tokens, model)


def _ask_anthropic(system, user, output_model, max_tokens, model):
    model = model or MODEL
    if output_model is not None:
        tool = {
            "name": "submit",
            "description": "按要求的字段结构提交结果。",
            "strict": True,
            "input_schema": output_model.model_json_schema(),
        }
        resp = _anthropic_client().messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            tools=[tool],
            tool_choice={"type": "tool", "name": "submit"},
        )
        tool_use = next((b for b in resp.content if b.type == "tool_use"), None)
        if tool_use is None:
            raise RuntimeError(f"模型未按结构化要求返回：{resp.stop_reason}")
        # thinking 模型在 max_tokens 不足时，工具入参会被截断成 {'raw_arguments': ''}
        if not tool_use.input or "raw_arguments" in tool_use.input:
            raise RuntimeError(
                f"结构化输出被截断（stop_reason={resp.stop_reason}），请调大 max_tokens"
            )
        return output_model(**tool_use.input)

    resp = _anthropic_client().messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return next(b.text for b in resp.content if b.type == "text")


def _ask_openai_compatible(system, user, output_model, max_tokens):
    """任意 OpenAI 兼容端点（DeepSeek / 火山方舟 / 本地 vLLM ...）：openai SDK + function calling。

    与 _ask_anthropic 同构：强制调用 submit 工具 → 解析 tool_calls.arguments。
    openai 为可选依赖（仅 LLM_PROVIDER 非 anthropic 时才需要），故惰性导入。
    注意 base_url 必须是 OpenAI 协议端点（如 https://api.deepseek.com），
    不要填 Anthropic 协议端点（如 https://api.deepseek.com/anthropic），否则 404。
    """
    import json
    from config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL

    if not OPENAI_API_KEY or not OPENAI_MODEL:
        raise RuntimeError("使用 OpenAI 兼容端点需在 .env 设置 OPENAI_API_KEY 和 OPENAI_MODEL")
    try:
        from openai import OpenAI
    except ImportError:
        raise RuntimeError("使用 OpenAI 兼容端点需先安装：pip install openai")

    client = OpenAI(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL or None,  # 留空则用官方 https://api.openai.com/v1
    )
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]

    if output_model is not None:
        tools = [{
            "type": "function",
            "function": {
                "name": "submit",
                "description": "按要求的字段结构提交结果（必须通过此工具返回，不要直接回复文字）。",
                "parameters": output_model.model_json_schema(),
            },
        }]
        common = dict(model=OPENAI_MODEL, max_tokens=max_tokens, messages=messages, tools=tools)
        try:
            resp = client.chat.completions.create(
                **common, tool_choice={"type": "function", "function": {"name": "submit"}}
            )
        except Exception as e:
            # 思考型模型（如 deepseek-v4-pro）不支持强制 tool_choice，降级为 auto
            if "tool_choice" not in str(e):
                raise
            resp = client.chat.completions.create(**common, tool_choice="auto")
        msg = resp.choices[0].message
        if msg.tool_calls:
            args = json.loads(msg.tool_calls[0].function.arguments)
            return output_model(**args)
        # 兜底：个别模型不执行 tool_choice 时，尝试把正文当 JSON 解析
        if msg.content:
            return output_model(**json.loads(msg.content))
        raise RuntimeError(f"模型未按结构化要求返回：finish_reason={resp.choices[0].finish_reason}")

    resp = client.chat.completions.create(
        model=OPENAI_MODEL, max_tokens=max_tokens, messages=messages
    )
    return resp.choices[0].message.content


# ---------- 四个功能 ----------

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


def grade_quiz(questions: List[Question], answers: List[str]) -> QuizGrade:
    """一次调用批改整份作答（省 API 往返）。"""
    lines = []
    for i, (q, a) in enumerate(zip(questions, answers), 1):
        lines.append(
            f"【第{i}题】{q.stem}\n"
            f"标准答案：{q.answer}\n"
            f"学员作答：{a}\n"
        )
    user = "请逐题批改以下作答，每题给出 0-100 分、正确与否、点评与薄弱点：\n\n" + "\n".join(lines)
    return _ask(GRADER_SYSTEM, user, output_model=QuizGrade, max_tokens=16000)
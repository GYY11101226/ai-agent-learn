"""课程解析：加载课程目录与各课程的模块/章节。

数据布局：
  curriculum/courses.json               课程目录（主页「各类课程」的数据源）
  curriculum/<course.dir>/module-*.json 某门课的模块文件

章节全局唯一键（供进度表主键用）= f"{course_id}:{chapter_id}"，如 'ai-agent:0.1'。
它只在 store 层与 API 之间出现；JSON 原内容不改写，URL 用 course_id / chapter_id 两段分开传。
"""

from __future__ import annotations

import json

from config import COURSES_FILE, CURRICULUM_DIR


def full_chapter_id(course_id: str, chapter_id: str) -> str:
    """拼接全局唯一键，作为进度表 chapter_id 主键。"""
    return f"{course_id}:{chapter_id}"


def split_chapter_id(ref: str) -> tuple[str, str]:
    """全局键 'ai-agent:0.1' 拆回 (course_id, chapter_id)。"""
    course_id, _, chapter_id = ref.partition(":")
    return course_id, chapter_id


def load_catalog() -> list[dict]:
    """课程目录（courses.json），主页课程卡片的数据源。"""
    if not COURSES_FILE.exists():
        return []
    return json.loads(COURSES_FILE.read_text(encoding="utf-8"))


def get_course(course_id: str) -> dict | None:
    for c in load_catalog():
        if c["id"] == course_id:
            return c
    return None


def load_course_modules(course_id: str) -> list[dict]:
    """按文件名顺序加载某门课的所有模块。"""
    course = get_course(course_id)
    if course is None:
        return []
    module_dir = CURRICULUM_DIR / course["dir"]
    if not module_dir.is_dir():
        return []
    modules = []
    for path in sorted(module_dir.glob("*.json")):
        modules.append(json.loads(path.read_text(encoding="utf-8")))
    return modules


def course_chapters(course_id: str) -> list[dict]:
    """扁平化某门课的所有章节，附上模块信息与全局唯一键 ref。"""
    out = []
    for m in load_course_modules(course_id):
        for ch in m["chapters"]:
            out.append(
                {
                    **ch,
                    "module_id": m["id"],
                    "module_title": m["title"],
                    "ref": full_chapter_id(course_id, ch["id"]),
                }
            )
    return out


def get_chapter(course_id: str, chapter_id: str) -> dict | None:
    for ch in course_chapters(course_id):
        if ch["id"] == chapter_id:
            return ch
    return None


def chapter_text(ch: dict) -> str:
    """把章节内容序列化为文本，供 Agent 讲授/出题时作为背景。"""
    concepts = "\n".join(
        f"- {c['name']}：{c['detail']}" for c in ch.get("concepts", [])
    )
    return "\n".join(
        filter(
            None,
            [
                f"标题：{ch['title']}",
                f"目标：{ch.get('goal', '')}",
                f"核心概念：\n{concepts}",
                f"关键代码：\n{ch['code']}" if ch.get("code") else "",
                f"协作点 TODO：{ch['todo']}" if ch.get("todo") else "",
                f"练习：{ch['exercise']}" if ch.get("exercise") else "",
            ],
        )
    )
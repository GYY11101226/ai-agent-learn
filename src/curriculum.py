"""课程解析：加载 curriculum/*.json，提供章节查询。"""

from __future__ import annotations

import json

from config import CURRICULUM_DIR


def load_modules() -> list[dict]:
    """按文件名顺序加载所有模块。"""
    modules = []
    for path in sorted(CURRICULUM_DIR.glob("*.json")):
        modules.append(json.loads(path.read_text(encoding="utf-8")))
    return modules


def get_module(module_id: str) -> dict | None:
    for m in load_modules():
        if m["id"] == module_id:
            return m
    return None


def all_chapters() -> list[dict]:
    """扁平化所有章节，附上所属模块信息。"""
    out = []
    for m in load_modules():
        for ch in m["chapters"]:
            out.append({**ch, "module_id": m["id"], "module_title": m["title"]})
    return out


def get_chapter(chapter_id: str) -> dict | None:
    for ch in all_chapters():
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
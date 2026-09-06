"""SQLite 存储：进度、掌握度、复习调度。

表 progress 字段：
  chapter_id   章节 ID（主键，如 '2.3'）
  mastery      掌握度 0-100
  weak_points  薄弱环节，JSON 数组字符串
  last_studied 最近学习时间（ISO）
  next_review  下次复习日期（ISO）
  review_stage 遗忘曲线档位（0 起）
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import date, datetime

from config import DB_PATH
from . import scheduler


def _db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with closing(_db()) as conn, conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS progress (
                chapter_id   TEXT PRIMARY KEY,
                mastery      INTEGER DEFAULT 0,
                weak_points  TEXT DEFAULT '[]',
                last_studied TEXT,
                next_review  TEXT,
                review_stage INTEGER DEFAULT 0
            )
            """
        )


def record_study(
    chapter_id: str,
    mastery: int,
    weak_points: list[str] | None = None,
    reviewed: bool = False,
) -> None:
    """记录一次学习（或复习）。

    - 首次学习：review_stage=0，1 天后复习
    - 复习（reviewed=True）：stage+1，间隔按遗忘曲线递增
    """
    init_db()
    row = get_chapter(chapter_id)
    old_stage = row["review_stage"] if row else 0
    stage = old_stage + 1 if reviewed else 0

    next_review = scheduler.next_review_date(stage).isoformat()
    with closing(_db()) as conn, conn:
        conn.execute(
            """
            INSERT INTO progress
                (chapter_id, mastery, weak_points, last_studied, next_review, review_stage)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(chapter_id) DO UPDATE SET
                mastery = excluded.mastery,
                weak_points = excluded.weak_points,
                last_studied = excluded.last_studied,
                next_review = excluded.next_review,
                review_stage = excluded.review_stage
            """,
            (
                chapter_id,
                mastery,
                json.dumps(weak_points or [], ensure_ascii=False),
                datetime.now().isoformat(timespec="seconds"),
                next_review,
                stage,
            ),
        )


def get_chapter(chapter_id: str) -> sqlite3.Row | None:
    init_db()
    with closing(_db()) as conn:
        return conn.execute(
            "SELECT * FROM progress WHERE chapter_id = ?", (chapter_id,)
        ).fetchone()


def get_all_progress() -> list[dict]:
    init_db()
    with closing(_db()) as conn:
        rows = conn.execute("SELECT * FROM progress").fetchall()
    result = []
    for r in rows:
        result.append(
            {
                "chapter_id": r["chapter_id"],
                "mastery": r["mastery"],
                "weak_points": json.loads(r["weak_points"] or "[]"),
                "last_studied": r["last_studied"],
                "next_review": r["next_review"],
                "review_stage": r["review_stage"],
            }
        )
    return result


def due_reviews(today: date | None = None) -> list[dict]:
    """返回今天到期的复习章节（掌握度 < 100 且 next_review <= 今天）。"""
    today = today or date.today()
    return [
        p for p in get_all_progress()
        if p["mastery"] < 100
        and p["next_review"]
        and scheduler.is_due(date.fromisoformat(p["next_review"]), today)
    ]
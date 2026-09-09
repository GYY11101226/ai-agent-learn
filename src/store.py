"""SQLite 存储：进度、掌握度、复习调度。

表 progress 字段（多课程版）：
  user_id      用户 ID（预留多用户，当前固定 DEFAULT_USER_ID）
  chapter_id   章节全局唯一键（如 'ai-agent:0.1'，见 curriculum.full_chapter_id）
  mastery      掌握度 0-100
  weak_points  薄弱环节，JSON 数组字符串
  last_studied 最近学习时间（ISO）
  next_review  下次复习日期（ISO）
  review_stage 遗忘曲线档位（0 起）

主键是 (user_id, chapter_id) 联合主键，故多课程、多用户下进度互不冲突。
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import date, datetime

from config import DB_PATH
from . import scheduler

# 单用户阶段固定用一个默认用户；日后接登录时，把这里改成从会话取 user_id 即可。
DEFAULT_USER_ID = "default"


def _db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _migrate_legacy(conn: sqlite3.Connection) -> None:
    """非破坏式迁移旧版（单课程、无 user_id）进度表到多课程表。

    旧表：chapter_id 单列主键，存原生章节号（如 '0.1'），无 user_id。
    新表：联合主键 (user_id, chapter_id)，chapter_id 存全局唯一键（如 'ai-agent:0.1'）。

    三步（都不丢数据）：
    1. 无 user_id 列才迁移（幂等，避免重复执行）。
    2. ALTER 加 user_id 列，并把旧 chapter_id 加 'ai-agent:' 前缀（迁移时唯一已知课程）。
    3. SQLite 不能直接删主键，故新建表→拷贝数据→替换旧表。
    """
    cols = {row["name"] for row in conn.execute("PRAGMA table_info(progress)")}
    if "user_id" in cols:
        return  # 已是新表，跳过

    # 1) 加 user_id 列
    conn.execute("ALTER TABLE progress ADD COLUMN user_id TEXT DEFAULT 'default'")

    # 2) 旧 chapter_id 加课程前缀（旧数据只有 ai-agent 一门课）
    conn.execute(
        "UPDATE progress SET chapter_id = 'ai-agent:' || chapter_id "
        "WHERE chapter_id NOT LIKE '%:%'"
    )

    # 3) 重建表以把主键改成 (user_id, chapter_id)
    conn.execute(
        """
        CREATE TABLE progress_new (
            user_id      TEXT DEFAULT 'default',
            chapter_id   TEXT,
            mastery      INTEGER DEFAULT 0,
            weak_points  TEXT DEFAULT '[]',
            last_studied TEXT,
            next_review  TEXT,
            review_stage INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, chapter_id)
        )
        """
    )
    conn.execute(
        "INSERT INTO progress_new "
        "(user_id, chapter_id, mastery, weak_points, last_studied, next_review, review_stage) "
        "SELECT user_id, chapter_id, mastery, weak_points, last_studied, next_review, review_stage "
        "FROM progress"
    )
    conn.execute("DROP TABLE progress")
    conn.execute("ALTER TABLE progress_new RENAME TO progress")


def init_db() -> None:
    with closing(_db()) as conn, conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS progress (
                user_id      TEXT DEFAULT 'default',
                chapter_id   TEXT,
                mastery      INTEGER DEFAULT 0,
                weak_points  TEXT DEFAULT '[]',
                last_studied TEXT,
                next_review  TEXT,
                review_stage INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, chapter_id)
            )
            """
        )
        _migrate_legacy(conn)


def record_study(
    chapter_id: str,
    mastery: int,
    weak_points: list[str] | None = None,
    reviewed: bool = False,
    user_id: str = DEFAULT_USER_ID,
) -> None:
    """记录一次学习（或复习）。chapter_id 传全局唯一键。

    - 首次学习：review_stage=0，1 天后复习
    - 复习（reviewed=True）：stage+1，间隔按遗忘曲线递增
    """
    init_db()
    row = get_chapter(chapter_id, user_id)
    old_stage = row["review_stage"] if row else 0
    stage = old_stage + 1 if reviewed else 0

    next_review = scheduler.next_review_date(stage).isoformat()
    with closing(_db()) as conn, conn:
        conn.execute(
            """
            INSERT INTO progress
                (user_id, chapter_id, mastery, weak_points, last_studied, next_review, review_stage)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, chapter_id) DO UPDATE SET
                mastery = excluded.mastery,
                weak_points = excluded.weak_points,
                last_studied = excluded.last_studied,
                next_review = excluded.next_review,
                review_stage = excluded.review_stage
            """,
            (
                user_id,
                chapter_id,
                mastery,
                json.dumps(weak_points or [], ensure_ascii=False),
                datetime.now().isoformat(timespec="seconds"),
                next_review,
                stage,
            ),
        )


def get_chapter(chapter_id: str, user_id: str = DEFAULT_USER_ID) -> sqlite3.Row | None:
    init_db()
    with closing(_db()) as conn:
        return conn.execute(
            "SELECT * FROM progress WHERE user_id = ? AND chapter_id = ?",
            (user_id, chapter_id),
        ).fetchone()


def get_all_progress(user_id: str = DEFAULT_USER_ID) -> list[dict]:
    init_db()
    with closing(_db()) as conn:
        rows = conn.execute(
            "SELECT * FROM progress WHERE user_id = ?", (user_id,)
        ).fetchall()
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


def due_reviews(
    today: date | None = None, user_id: str = DEFAULT_USER_ID
) -> list[dict]:
    """返回今天到期的复习章节（掌握度 < 100 且 next_review <= 今天）。"""
    today = today or date.today()
    return [
        p
        for p in get_all_progress(user_id)
        if p["mastery"] < 100
        and p["next_review"]
        and scheduler.is_due(date.fromisoformat(p["next_review"]), today)
    ]
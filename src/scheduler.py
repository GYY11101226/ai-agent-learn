"""遗忘曲线调度：根据复习档位计算下次复习日期。

复习间隔来自 config.REVIEW_INTERVALS = [1, 3, 7, 30]（天）。
stage 表示当前处于第几档：首次学习 stage=0（1 天后复习），
每复习一次 stage+1，档位到头后停在最后一档（30 天）。
"""

from __future__ import annotations

from datetime import date, timedelta

from config import REVIEW_INTERVALS


def interval_days(stage: int) -> int:
    """当前档位对应的复习间隔（天），越界则取最后一档。"""
    return REVIEW_INTERVALS[min(stage, len(REVIEW_INTERVALS) - 1)]


def next_review_date(stage: int, from_date: date | None = None) -> date:
    """给定档位，返回下次复习日期。"""
    from_date = from_date or date.today()
    return from_date + timedelta(days=interval_days(stage))


def is_due(next_review: date | None, today: date | None = None) -> bool:
    """是否已到复习时间。"""
    if next_review is None:
        return False
    today = today or date.today()
    return next_review <= today
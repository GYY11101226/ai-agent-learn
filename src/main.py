"""FastAPI 入口：多课程 JSON API（前后端分离）。

设计原则（对应课程模块 5「Harness 生产化」）：
- /api/courses /api/progress /api/review 纯读 JSON / 纯读 SQLite，不花 token
- /api/.../lesson /quiz(/submit) 调 Claude（Tutor/Grader/Drill）
- 生产环境同时托管前端构建产物 frontend/dist（存在才启用），开发走 Vite dev server + proxy

说明：为简单起见，quiz 生成接口会把题目连同正确答案一起返回给前端，提交时再回传，
由 Grader 统一批改。对单用户自测工具够用；要隐藏答案可后续改成服务端暂存 quiz。
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse

from config import FRONTEND_DIST
from . import agents, curriculum, store

app = FastAPI(title="AI Agent 学习平台")


# ---------- 纯读 / 纯库接口 ----------

def _progress_index() -> dict[str, dict]:
    """章节全局键 -> 进度记录，供课程详情/进度页查用。"""
    return {p["chapter_id"]: p for p in store.get_all_progress()}


def _chapter_view(ch: dict, course_id: str, progress: dict[str, dict]) -> dict:
    """把章节序列化为前端需要的精简视图（不含 concepts/code 等教学细节）。"""
    p = progress.get(curriculum.full_chapter_id(course_id, ch["id"]), {})
    mastery = p.get("mastery", 0)
    return {
        "id": ch["id"],
        "title": ch["title"],
        "goal": ch.get("goal", ""),
        "mastery": mastery,
        "done": mastery >= 80,
    }


@app.get("/api/courses")
def list_courses():
    progress = _progress_index()
    courses = []
    for c in curriculum.load_catalog():
        chapters = curriculum.course_chapters(c["id"])
        masters = [progress.get(ch["ref"], {}).get("mastery", 0) for ch in chapters]
        courses.append(
            {
                "id": c["id"],
                "title": c["title"],
                "description": c.get("description", ""),
                "total_chapters": len(chapters),
                "completed": sum(1 for m in masters if m >= 80),
                "avg_mastery": round(sum(masters) / len(masters)) if masters else 0,
            }
        )
    return {"courses": courses}


@app.get("/api/courses/{course_id}")
def course_detail(course_id: str):
    course = curriculum.get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="课程不存在")
    progress = _progress_index()
    modules = [
        {
            "id": m["id"],
            "title": m["title"],
            "weeks": m.get("weeks", ""),
            "chapters": [_chapter_view(ch, course_id, progress) for ch in m["chapters"]],
        }
        for m in curriculum.load_course_modules(course_id)
    ]
    return {
        "course": {
            "id": course_id,
            "title": course["title"],
            "description": course.get("description", ""),
        },
        "modules": modules,
    }


@app.get("/api/progress")
def progress():
    store_progress = _progress_index()
    courses = []
    all_masters = []
    for c in curriculum.load_catalog():
        chapters = []
        for ch in curriculum.course_chapters(c["id"]):
            p = store_progress.get(ch["ref"], {})
            mastery = p.get("mastery", 0)
            all_masters.append(mastery)
            chapters.append(
                {
                    "id": ch["id"],
                    "title": ch["title"],
                    "mastery": mastery,
                    "next_review": p.get("next_review"),
                    "done": mastery >= 80,
                }
            )
        courses.append({"id": c["id"], "title": c["title"], "chapters": chapters})
    overall = round(sum(all_masters) / len(all_masters)) if all_masters else 0
    return {"overall": overall, "courses": courses}


@app.get("/api/review")
def review():
    due = store.due_reviews()
    chapters = []
    for d in due:
        course_id, chapter_id = curriculum.split_chapter_id(d["chapter_id"])
        ch = curriculum.get_chapter(course_id, chapter_id)
        if ch is None:
            continue
        course = curriculum.get_course(course_id)
        chapters.append(
            {
                "course_id": course_id,
                "course_title": course["title"] if course else course_id,
                "id": ch["id"],
                "title": ch["title"],
                "mastery": d["mastery"],
                "next_review": d["next_review"],
            }
        )
    return {"chapters": chapters}


# ---------- 调 LLM 的接口 ----------

def _get_chapter_or_404(course_id: str, chapter_id: str) -> dict:
    ch = curriculum.get_chapter(course_id, chapter_id)
    if ch is None:
        raise HTTPException(status_code=404, detail="章节不存在")
    return ch


@app.post("/api/courses/{course_id}/chapters/{chapter_id}/lesson")
def lesson(course_id: str, chapter_id: str):
    ch = _get_chapter_or_404(course_id, chapter_id)
    course = curriculum.get_course(course_id)
    try:
        result = agents.teach(ch, course)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"调用 LLM 失败：{e}")
    return {
        "chapter": {
            "id": ch["id"],
            "title": ch["title"],
            "goal": ch.get("goal", ""),
            "diagram": ch.get("diagram", ""),
            "animation": ch.get("animation", ""),
        },
        "lesson": result.model_dump(),
    }


@app.post("/api/courses/{course_id}/chapters/{chapter_id}/quiz")
def quiz(course_id: str, chapter_id: str, count: int = 20, review: int = 0):
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"调用 LLM 失败：{e}")
    return {
        "chapter": {"id": ch["id"], "title": ch["title"], "goal": ch.get("goal", "")},
        "review": bool(review),
        "questions": [q.model_dump() for q in result.questions],
    }


@app.post("/api/courses/{course_id}/chapters/{chapter_id}/quiz/submit")
async def submit_quiz(request: Request, course_id: str, chapter_id: str):
    _get_chapter_or_404(course_id, chapter_id)
    body = await request.json()
    questions = [agents.Question(**q) for q in body.get("questions", [])]
    answers = body.get("answers", [])
    review = bool(body.get("review", False))
    if not questions:
        raise HTTPException(status_code=400, detail="题目为空")
    try:
        graded = agents.grade_quiz(questions, answers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"调用 LLM 失败：{e}")

    avg = round(sum(g.score for g in graded.results) / max(len(graded.results), 1))
    weak_points = [g.weak_point for g in graded.results if g.weak_point]
    store.record_study(
        curriculum.full_chapter_id(course_id, chapter_id),
        mastery=avg,
        weak_points=weak_points,
        reviewed=review,
    )

    return {
        "avg": avg,
        "results": [
            {"question": q.model_dump(), "grade": g.model_dump(), "student_answer": a}
            for q, g, a in zip(questions, graded.results, answers)
        ],
    }


@app.post("/api/courses/{course_id}/chapters/{chapter_id}/done")
def chapter_done(course_id: str, chapter_id: str):
    _get_chapter_or_404(course_id, chapter_id)
    ref = curriculum.full_chapter_id(course_id, chapter_id)
    # 已学过就保留已有掌握度，避免重学把成绩清零
    if store.get_chapter(ref) is None:
        store.record_study(ref, mastery=0, reviewed=False)
    return {"ok": True}


# ---------- 生产：托管前端构建产物（存在才启用，开发走 Vite proxy） ----------

if (FRONTEND_DIST / "index.html").is_file():
    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (FRONTEND_DIST / full_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(FRONTEND_DIST.resolve()):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
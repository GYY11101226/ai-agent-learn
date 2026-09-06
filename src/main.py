"""FastAPI 入口：路由 + 服务端渲染。

设计原则（对应课程模块 5）：
- /lesson /quiz /review 调 Claude（Tutor/Grader/Drill）
- /progress 纯读 SQLite，不花 token
"""

import json

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from config import BASE_DIR
from . import curriculum, store, agents

app = FastAPI(title="AI Agent 学习教程")
app.mount("/static", StaticFiles(directory=BASE_DIR / "src" / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "src" / "templates")


def _render_error(request: Request, message: str) -> HTMLResponse:
    return templates.TemplateResponse(request, "error.html", {"message": message}, status_code=500)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    modules = curriculum.load_modules()
    progress = {p["chapter_id"]: p for p in store.get_all_progress()}
    return templates.TemplateResponse(
        request, "home.html", {"modules": modules, "progress": progress}
    )


@app.get("/lesson/{chapter_id}", response_class=HTMLResponse)
def lesson(request: Request, chapter_id: str):
    ch = curriculum.get_chapter(chapter_id)
    if ch is None:
        return HTMLResponse("章节不存在", status_code=404)
    try:
        lesson = agents.teach(ch)
    except Exception as e:
        return _render_error(request, f"调用 LLM 失败：{e}")
    return templates.TemplateResponse(
        request, "lesson.html", {"chapter": ch, "lesson": lesson}
    )


@app.post("/lesson/{chapter_id}/done")
def lesson_done(chapter_id: str):
    """标记本节已学，登记到遗忘曲线（1 天后首次复习）。"""
    store.record_study(chapter_id, mastery=0, reviewed=False)
    return RedirectResponse(f"/quiz/{chapter_id}", status_code=303)


@app.get("/quiz/{chapter_id}", response_class=HTMLResponse)
def quiz(request: Request, chapter_id: str, review: int = 0):
    ch = curriculum.get_chapter(chapter_id)
    if ch is None:
        return HTMLResponse("章节不存在", status_code=404)
    try:
        if review:
            weak = store.get_chapter(chapter_id)
            quiz = agents.make_review(ch, weak["weak_points"] if weak else None)
        else:
            quiz = agents.make_quiz(ch)
    except Exception as e:
        return _render_error(request, f"调用 LLM 失败：{e}")
    questions_json = json.dumps([q.model_dump() for q in quiz.questions])
    return templates.TemplateResponse(
        request,
        "quiz.html",
        {
            "chapter": ch,
            "questions": quiz.questions,
            "questions_json": questions_json,
            "review": review,
        },
    )


@app.post("/quiz/{chapter_id}/submit", response_class=HTMLResponse)
async def submit_quiz(request: Request, chapter_id: str):
    form = await request.form()
    review = int(form.get("review", "0"))
    questions = [
        agents.Question(**q)
        for q in json.loads(form.get("questions_json", "[]"))
    ]
    # 每题一个独立字段 answer_0 / answer_1 ...，避免选择题未勾选导致顺序错位
    answers = [form.get(f"answer_{i}", "") for i in range(len(questions))]
    try:
        graded = agents.grade_quiz(questions, answers)
    except Exception as e:
        return _render_error(request, f"调用 LLM 失败：{e}")

    avg = round(sum(g.score for g in graded.results) / max(len(graded.results), 1))
    weak_points = [g.weak_point for g in graded.results if g.weak_point]
    store.record_study(chapter_id, mastery=avg, weak_points=weak_points, reviewed=bool(review))

    return templates.TemplateResponse(
        request,
        "result.html",
        {
            "chapter_id": chapter_id,
            "avg": avg,
            "results": list(zip(questions, graded.results, answers)),
        },
    )


@app.get("/progress", response_class=HTMLResponse)
def progress(request: Request):
    chapters = curriculum.all_chapters()
    stored = {p["chapter_id"]: p for p in store.get_all_progress()}
    # 合并：已学的带掌握度，未学的默认 0
    for ch in chapters:
        ch["mastery"] = stored.get(ch["id"], {}).get("mastery", 0)
        ch["next_review"] = stored.get(ch["id"], {}).get("next_review")
    overall = round(
        sum(c["mastery"] for c in chapters) / len(chapters)
    ) if chapters else 0
    return templates.TemplateResponse(
        request,
        "progress.html",
        {"chapters": chapters, "overall": overall},
    )


@app.get("/review", response_class=HTMLResponse)
def review(request: Request):
    due = store.due_reviews()
    chapters = []
    for d in due:
        ch = curriculum.get_chapter(d["chapter_id"])
        if ch:
            chapters.append({**ch, "mastery": d["mastery"], "next_review": d["next_review"]})
    return templates.TemplateResponse(
        request, "review.html", {"chapters": chapters}
    )
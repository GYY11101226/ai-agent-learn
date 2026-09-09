import { Link } from 'react-router-dom'
import type { SubmitResponse } from '../types'

interface Props {
  response: SubmitResponse
  courseId: string
  chapterId: string
  review: boolean
}

export default function ResultView({ response, courseId, chapterId, review }: Props) {
  const { avg, results } = response
  const correct = results.filter((r) => r.grade.correct).length
  return (
    <div className="result">
      <div className="score">
        得分 <strong>{avg}</strong> · 答对 {correct}/{results.length}
      </div>
      {results.map((r, i) => (
        <div key={i} className={`q-result ${r.grade.correct ? 'correct' : 'wrong'}`}>
          <p className="stem">
            {i + 1}. {r.question.stem}{' '}
            <span className="muted">
              （你的答案 {r.student_answer || '—'}，正确 {r.question.answer}）
            </span>
          </p>
          {r.grade.feedback && <p className="feedback">{r.grade.feedback}</p>}
          {r.question.explanation && (
            <p className="explanation muted">解析：{r.question.explanation}</p>
          )}
        </div>
      ))}
      <p className="actions">
        <Link to={`/course/${courseId}/lesson/${chapterId}`}>返回章节</Link>
        <span className="sep">·</span>
        <Link to={`/course/${courseId}`}>返回课程</Link>
        {review && (
          <>
            <span className="sep">·</span>
            <Link to="/review">回复习列表</Link>
          </>
        )}
      </p>
    </div>
  )
}
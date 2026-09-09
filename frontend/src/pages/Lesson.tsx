import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { post } from '../api/client'
import ErrorView from '../components/ErrorView'
import LessonView from '../components/LessonView'
import { useAsync } from '../hooks'
import type { LessonResponse } from '../types'

export default function Lesson() {
  const { courseId, chapterId } = useParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsync(
    () => post<LessonResponse>(`/courses/${courseId}/chapters/${chapterId}/lesson`),
    [courseId, chapterId],
  )
  const [marking, setMarking] = useState(false)

  const goQuiz = async () => {
    setMarking(true)
    try {
      await post(`/courses/${courseId}/chapters/${chapterId}/done`)
      navigate(`/course/${courseId}/quiz/${chapterId}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setMarking(false)
    }
  }

  if (loading) return <div className="state">讲师正在备课…</div>
  if (error) return <ErrorView message={error} onRetry={reload} />
  return (
    <>
      <h1>{data!.chapter.title}</h1>
      <p className="muted">{data!.chapter.goal}</p>
      <LessonView content={data!.lesson} />
      <p className="actions">
        <button onClick={goQuiz} disabled={marking}>
          {marking ? '登记中…' : '学完了，去测验 →'}
        </button>
      </p>
    </>
  )
}
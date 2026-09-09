import { useParams } from 'react-router-dom'
import { get } from '../api/client'
import ChapterList from '../components/ChapterList'
import ErrorView from '../components/ErrorView'
import { useAsync } from '../hooks'
import type { CourseDetailResponse } from '../types'

export default function CourseDetail() {
  const { courseId } = useParams()
  const { data, error, loading, reload } = useAsync(
    () => get<CourseDetailResponse>(`/courses/${courseId}`),
    [courseId],
  )
  if (loading) return <div className="state">加载中…</div>
  if (error) return <ErrorView message={error} onRetry={reload} />
  const { course, modules } = data!
  return (
    <>
      <h1>{course.title}</h1>
      <p className="muted">{course.description}</p>
      {modules.map((m) => (
        <ChapterList key={m.id} module={m} courseId={courseId!} />
      ))}
    </>
  )
}
import { get } from '../api/client'
import CourseCard from '../components/CourseCard'
import ErrorView from '../components/ErrorView'
import { useAsync } from '../hooks'
import type { Course } from '../types'

export default function CourseCatalog() {
  const { data, error, loading, reload } = useAsync(
    () => get<{ courses: Course[] }>('/courses'),
  )
  if (loading) return <div className="state">加载中…</div>
  if (error) return <ErrorView message={error} onRetry={reload} />
  const courses = data!.courses
  if (courses.length === 0) return <div className="state">还没有课程</div>
  return (
    <>
      <h1>课程</h1>
      <div className="course-grid">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </>
  )
}
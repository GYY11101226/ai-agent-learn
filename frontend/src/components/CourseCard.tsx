import { Link } from 'react-router-dom'
import type { Course } from '../types'

export default function CourseCard({ course }: { course: Course }) {
  const pct = course.total_chapters
    ? Math.round((course.completed / course.total_chapters) * 100)
    : 0
  return (
    <Link className="course-card" to={`/course/${course.id}`}>
      <h2>{course.title}</h2>
      <p className="muted">{course.description}</p>
      <div className="course-meta">
        <span className="muted">
          已掌握 {course.completed}/{course.total_chapters} 章节
        </span>
        <span className="progress-bar">
          <span className="fill" style={{ width: `${pct}%` }} />
        </span>
      </div>
    </Link>
  )
}
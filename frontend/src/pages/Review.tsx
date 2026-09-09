import { Link } from 'react-router-dom'
import { get } from '../api/client'
import ErrorView from '../components/ErrorView'
import { useAsync } from '../hooks'
import type { ReviewChapter } from '../types'

export default function Review() {
  const { data, error, loading, reload } = useAsync(
    () => get<{ chapters: ReviewChapter[] }>('/review'),
  )
  if (loading) return <div className="state">加载中…</div>
  if (error) return <ErrorView message={error} onRetry={reload} />
  const chapters = data!.chapters
  if (chapters.length === 0) return <div className="state">今天没有到期的复习 🎉</div>
  return (
    <>
      <h1>到期复习</h1>
      <ul className="chapter-list">
        {chapters.map((ch) => (
          <li key={`${ch.course_id}:${ch.id}`} className="chapter">
            <Link to={`/course/${ch.course_id}/quiz/${ch.id}?review=1`}>
              {ch.course_title} · {ch.title}
            </Link>
            <span className="badge mid">{ch.mastery}%</span>
          </li>
        ))}
      </ul>
    </>
  )
}
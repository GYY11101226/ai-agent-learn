import { Link } from 'react-router-dom'
import { get } from '../api/client'
import ErrorView from '../components/ErrorView'
import { useAsync } from '../hooks'
import type { ProgressResponse } from '../types'

export default function Progress() {
  const { data, error, loading, reload } = useAsync(
    () => get<ProgressResponse>('/progress'),
  )
  if (loading) return <div className="state">加载中…</div>
  if (error) return <ErrorView message={error} onRetry={reload} />
  return (
    <>
      <h1>学习进度 · 总掌握度 {data!.overall}%</h1>
      {data!.courses.map((c) => (
        <section className="module" key={c.id}>
          <h2>{c.title}</h2>
          <ul className="chapter-list">
            {c.chapters.map((ch) => (
              <li key={ch.id} className="chapter">
                <Link to={`/course/${c.id}/lesson/${ch.id}`}>{ch.title}</Link>
                <span
                  className={ch.done ? 'badge done' : ch.mastery > 0 ? 'badge mid' : 'badge'}
                >
                  {ch.mastery}%{ch.next_review ? ` · 复习 ${ch.next_review}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
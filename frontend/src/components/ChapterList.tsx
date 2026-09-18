import { Link } from 'react-router-dom'
import type { Module } from '../types'

export default function ChapterList({
  module,
  courseId,
}: {
  module: Module
  courseId: string
}) {
  return (
    <section className="module">
      <h2>
        {module.title} <span className="muted">· {module.weeks}</span>
      </h2>
      <ul className="chapter-list">
        {module.chapters.map((ch) => (
          <li key={ch.id} className="chapter">
            <Link to={`/course/${courseId}/lesson/${ch.id}`}>
              <span className="chapter-id">{ch.id}</span>
              <span className="chapter-title">{ch.title}</span>
            </Link>
            <span
              className={ch.done ? 'badge done' : ch.mastery > 0 ? 'badge mid' : 'badge'}
            >
              {ch.done ? `已掌握 ${ch.mastery}%` : ch.mastery > 0 ? `${ch.mastery}%` : '未开始'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
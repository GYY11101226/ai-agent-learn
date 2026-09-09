import type { LessonContent } from '../types'

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="lesson-section">
      <h3>{title}</h3>
      <p className="text-block">{body}</p>
    </div>
  )
}

export default function LessonView({ content }: { content: LessonContent }) {
  return (
    <div className="lesson">
      <div className="callout">{content.conclusion}</div>
      <Section title="展开" body={content.explanation} />
      <Section title="类比" body={content.analogy} />
      <Section title="实践" body={content.practice} />
    </div>
  )
}
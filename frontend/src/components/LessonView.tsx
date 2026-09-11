import type { LessonContent } from '../types'
import AnimationHost, { hasAnimation } from './animations'
import MermaidDiagram from './MermaidDiagram'

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="lesson-section">
      <h3>{title}</h3>
      <p className="text-block">{body}</p>
    </div>
  )
}

export default function LessonView({
  content,
  diagram = '',
  animation = '',
}: {
  content: LessonContent
  diagram?: string
  animation?: string
}) {
  return (
    <div className="lesson">
      <div className="callout">{content.conclusion}</div>
      <Section title="展开" body={content.explanation} />
      {diagram ? (
        <div className="lesson-section">
          <h3>本章流程图</h3>
          <MermaidDiagram code={diagram} />
        </div>
      ) : null}
      {animation && hasAnimation(animation) ? (
        <div className="lesson-section">
          <h3>动态演示</h3>
          <AnimationHost kind={animation} />
        </div>
      ) : null}
      <Section title="类比" body={content.analogy} />
      <Section title="实践" body={content.practice} />
    </div>
  )
}

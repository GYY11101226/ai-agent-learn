import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  suppressErrorRendering: true,
  theme: 'neutral',
})

export default function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    let cancelled = false
    const id = `mmd-${Math.random().toString(36).slice(2)}`
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg
      })
      .catch(e => {
        if (!cancelled)
          setError(e instanceof Error ? e.message || (e as { str?: string }).str || String(e) : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [code])

  if (error) return <p className="muted">流程图渲染失败：{error}</p>
  return <div ref={containerRef} className="mermaid-box" />
}

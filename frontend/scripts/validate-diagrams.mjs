// 校验 curriculum/**/*.json 里所有 chapter.diagram 的 mermaid 语法。
// mermaid v11 在 Node 下 import 需要 DOM，先注入 jsdom 全局再动态 import。
// 用法：cd frontend && node scripts/validate-diagrams.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const curriculumDir = join(root, 'curriculum')
const COURSES = readdirSync(curriculumDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort()
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
})
const { default: mermaid } = await import('mermaid')
mermaid.initialize({ startOnLoad: false })

let chapters = 0
let diagrams = 0
let animations = 0
let failed = 0
const missing = []

for (const course of COURSES) {
  const dir = join(curriculumDir, course)
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const mod = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    for (const ch of mod.chapters) {
      chapters++
      if (ch.animation) animations++
      if (!ch.diagram) {
        missing.push(`${course}/${f} ${ch.id} ${ch.title}`)
        continue
      }
      diagrams++
      try {
        await mermaid.parse(ch.diagram)
      } catch (e) {
        failed++
        const lines = String(e).split('\n').map(s => s.trim()).filter(Boolean)
        console.error(`✗ ${course}/${f} ${ch.id} ${ch.title}\n  ${lines[0]}\n  ${lines[lines.length - 1]}`)
      }
    }
  }
}

console.log(`\n${chapters} chapters / ${diagrams} diagrams / ${animations} animations / ${failed} invalid`)
if (missing.length) console.log(`missing diagram (${missing.length}):\n  ${missing.join('\n  ')}`)
process.exit(failed ? 1 : 0)

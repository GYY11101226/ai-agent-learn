import { useState } from 'react'
import type { Question } from '../types'

interface Props {
  questions: Question[]
  submitting: boolean
  onSubmit: (answers: string[]) => void
}

export default function QuizView({ questions, submitting, onSubmit }: Props) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const canSubmit = answers.every((a) => a !== '')

  const setAnswer = (i: number, letter: string) =>
    setAnswers((prev) => {
      const next = [...prev]
      next[i] = letter
      return next
    })

  return (
    <form
      className="quiz"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit(answers)
      }}
    >
      {questions.map((q, i) => (
        <fieldset key={i} className="question">
          <legend>
            {i + 1}. {q.stem}
          </legend>
          {q.options.map((opt, j) => {
            const letter = String.fromCharCode(65 + j)
            return (
              <label key={j} className="option">
                <input
                  type="radio"
                  name={`q${i}`}
                  value={letter}
                  checked={answers[i] === letter}
                  onChange={() => setAnswer(i, letter)}
                />
                <span>
                  {letter}. {opt}
                </span>
              </label>
            )
          })}
        </fieldset>
      ))}
      <button type="submit" disabled={submitting || !canSubmit}>
        {submitting ? '批改中…' : '提交批改'}
      </button>
    </form>
  )
}
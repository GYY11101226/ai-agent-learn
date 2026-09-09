import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { post } from '../api/client'
import ErrorView from '../components/ErrorView'
import QuizView from '../components/QuizView'
import ResultView from '../components/ResultView'
import { useAsync } from '../hooks'
import type { QuizResponse, SubmitResponse } from '../types'

export default function Quiz() {
  const { courseId, chapterId } = useParams()
  const [searchParams] = useSearchParams()
  const review = searchParams.get('review') === '1'
  const quizPath = review
    ? `/courses/${courseId}/chapters/${chapterId}/quiz?review=1&count=10`
    : `/courses/${courseId}/chapters/${chapterId}/quiz`

  const { data, error, loading, reload } = useAsync(
    () => post<QuizResponse>(quizPath),
    [quizPath],
  )

  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (answers: string[]) => {
    if (!data) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await post<SubmitResponse>(
        `/courses/${courseId}/chapters/${chapterId}/quiz/submit`,
        { questions: data.questions, answers, review },
      )
      setResult(res)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="state">正在出题…</div>
  if (error) return <ErrorView message={error} onRetry={reload} />
  if (result)
    return (
      <ResultView
        response={result}
        courseId={courseId!}
        chapterId={chapterId!}
        review={review}
      />
    )

  return (
    <>
      <h1>
        {data!.chapter.title} · 测验{review ? '（复习）' : ''}
      </h1>
      <QuizView questions={data!.questions} submitting={submitting} onSubmit={handleSubmit} />
      {submitError && <div className="state error">{submitError}</div>}
    </>
  )
}
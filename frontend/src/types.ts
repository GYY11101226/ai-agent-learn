// 镜像后端 Pydantic 模型 / 响应结构。

export interface Course {
  id: string
  title: string
  description: string
  total_chapters: number
  completed: number
  avg_mastery: number
}

export interface Chapter {
  id: string
  title: string
  goal: string
  mastery: number
  done: boolean
}

export interface Module {
  id: string
  title: string
  weeks: string
  chapters: Chapter[]
}

export interface CourseDetailResponse {
  course: { id: string; title: string; description: string }
  modules: Module[]
}

export interface LessonContent {
  conclusion: string
  explanation: string
  analogy: string
  practice: string
}

export interface LessonResponse {
  chapter: {
    id: string
    title: string
    goal: string
    diagram: string
    animation: string
  }
  lesson: LessonContent
}

export interface Question {
  type: string
  stem: string
  options: string[]
  answer: string
  explanation: string
}

export interface QuizResponse {
  chapter: { id: string; title: string; goal: string }
  review: boolean
  questions: Question[]
}

export interface AnswerGrade {
  score: number
  correct: boolean
  feedback: string
  weak_point: string
}

export interface QuizResult {
  question: Question
  grade: AnswerGrade
  student_answer: string
}

export interface SubmitResponse {
  avg: number
  results: QuizResult[]
}

export interface ProgressChapter {
  id: string
  title: string
  mastery: number
  next_review: string | null
  done: boolean
}

export interface ProgressCourse {
  id: string
  title: string
  chapters: ProgressChapter[]
}

export interface ProgressResponse {
  overall: number
  courses: ProgressCourse[]
}

export interface ReviewChapter {
  course_id: string
  course_title: string
  id: string
  title: string
  mastery: number
  next_review: string
}
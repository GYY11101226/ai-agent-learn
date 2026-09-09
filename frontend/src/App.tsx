import { Link, Route, Routes } from 'react-router-dom'
import CourseCatalog from './pages/CourseCatalog'
import CourseDetail from './pages/CourseDetail'
import Lesson from './pages/Lesson'
import Quiz from './pages/Quiz'
import Progress from './pages/Progress'
import Review from './pages/Review'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">🎓 AI Agent 学习平台</Link>
        <nav>
          <Link to="/progress">进度</Link>
          <Link to="/review">复习</Link>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<CourseCatalog />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/course/:courseId/lesson/:chapterId" element={<Lesson />} />
          <Route path="/course/:courseId/quiz/:chapterId" element={<Quiz />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/review" element={<Review />} />
        </Routes>
      </main>
    </div>
  )
}
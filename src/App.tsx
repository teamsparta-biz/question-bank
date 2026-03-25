import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import PasswordGate from './components/auth/PasswordGate'
import AppShell from './components/layout/AppShell'
import QuestionsPage from './pages/QuestionsPage'
import QuestionNewPage from './pages/QuestionNewPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import PoolsPage from './pages/PoolsPage'
import PoolDetailPage from './pages/PoolDetailPage'
import PoolPrintPage from './pages/PoolPrintPage'
import FeedbackPage from './pages/FeedbackPage'
import FeedbackDashboard from './pages/FeedbackDashboard'

export default function App() {
  const { isAuthenticated, login } = useAuth()

  if (!isAuthenticated) {
    return <PasswordGate onLogin={login} />
  }

  return (
    <Routes>
      {/* PDF 인쇄 페이지 — AppShell 없이 전체화면 */}
      <Route path="/pools/:id/print" element={<PoolPrintPage />} />

      {/* 일반 페이지 — AppShell 포함 */}
      <Route path="*" element={
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/questions" replace />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/questions/new" element={<QuestionNewPage />} />
            <Route path="/questions/:id" element={<QuestionDetailPage />} />
            <Route path="/pools" element={<PoolsPage />} />
            <Route path="/pools/:id" element={<PoolDetailPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/feedback/dashboard" element={<FeedbackDashboard />} />
          </Routes>
        </AppShell>
      } />
    </Routes>
  )
}

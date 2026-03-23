import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import PasswordGate from './components/auth/PasswordGate'
import AppShell from './components/layout/AppShell'
import QuestionsPage from './pages/QuestionsPage'
import QuestionNewPage from './pages/QuestionNewPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import PoolsPage from './pages/PoolsPage'
import PoolDetailPage from './pages/PoolDetailPage'

export default function App() {
  const { isAuthenticated, login } = useAuth()

  if (!isAuthenticated) {
    return <PasswordGate onLogin={login} />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/questions" replace />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/questions/new" element={<QuestionNewPage />} />
        <Route path="/questions/:id" element={<QuestionDetailPage />} />
        <Route path="/pools" element={<PoolsPage />} />
        <Route path="/pools/:id" element={<PoolDetailPage />} />
      </Routes>
    </AppShell>
  )
}

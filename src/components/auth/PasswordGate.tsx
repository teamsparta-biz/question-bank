import { useState } from 'react'

interface Props {
  onLogin: (password: string) => Promise<boolean>
}

export default function PasswordGate({ onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const ok = await onLogin(password)
    if (!ok) {
      setError(true)
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-sm"
      >
        <h1 className="text-xl font-bold text-slate-900 mb-1">문항 데이터베이스</h1>
        <p className="text-sm text-slate-500 mb-6">접속 비밀번호를 입력하세요</p>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />

        {error && (
          <p className="text-red-500 text-sm mt-2">비밀번호가 올바르지 않습니다</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '확인 중...' : '접속'}
        </button>
      </form>
    </div>
  )
}

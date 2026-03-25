import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeedbackDashboard } from '../hooks/useFeedback'
import { CATEGORIES } from '../lib/constants'
import Badge from '../components/common/Badge'

const CAT_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }

export default function FeedbackDashboard() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const { questionStats, reviewerStats, totalQuestions, loading } = useFeedbackDashboard(category || undefined)

  if (loading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>

  const totalFeedbacks = questionStats.reduce((s, q) => s + q.total, 0)
  const reviewedCount = questionStats.filter(q => q.total > 0).length
  const reviewerCount = reviewerStats.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">피드백 현황</h2>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">전체 영역</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{k} {v}</option>
          ))}
        </select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{totalFeedbacks}</div>
          <div className="text-xs text-slate-500 mt-1">총 피드백</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">
            {reviewedCount} / {totalQuestions}
          </div>
          <div className="text-xs text-slate-500 mt-1">피드백 완료 문항</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{reviewerCount}</div>
          <div className="text-xs text-slate-500 mt-1">참여 작업자</div>
        </div>
      </div>

      {/* 문항별 집계 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">문항별 피드백</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 w-16">영역</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">제목</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-green-600 w-16">추천</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-red-600 w-16">비추</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-slate-400 w-16">패스</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 w-16">합계</th>
            </tr>
          </thead>
          <tbody>
            {questionStats.map(q => (
              <tr
                key={q.question_id}
                onClick={() => navigate(`/questions/${q.question_id}`)}
                className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2">
                  {q.category && <Badge color={CAT_COLORS[q.category] ?? 'slate'} label={q.category} />}
                </td>
                <td className="px-4 py-2 text-slate-700 truncate max-w-xs">
                  {q.title}
                  {q.comments.length > 0 && (
                    <span className="ml-2 text-xs text-red-400" title={q.comments.join('\n')}>
                      ({q.comments.length}건 코멘트)
                    </span>
                  )}
                </td>
                <td className="text-center px-3 py-2 font-medium text-green-600">{q.up || '-'}</td>
                <td className="text-center px-3 py-2 font-medium text-red-600">{q.down || '-'}</td>
                <td className="text-center px-3 py-2 text-slate-400">{q.skip || '-'}</td>
                <td className="text-center px-3 py-2 font-medium text-slate-700">{q.total || '-'}</td>
              </tr>
            ))}
            {questionStats.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">피드백 데이터가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 작업자별 진행률 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">작업자별 진행률</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {reviewerStats.map(r => {
            const pct = totalQuestions > 0 ? Math.round((r.done / totalQuestions) * 100) : 0
            return (
              <div key={r.reviewer} className="px-4 py-3 flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700 w-24 truncate">{r.reviewer}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-20 text-right">{r.done} / {totalQuestions} ({pct}%)</span>
              </div>
            )
          })}
          {reviewerStats.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">아직 참여한 작업자가 없습니다</div>
          )}
        </div>
      </div>
    </div>
  )
}

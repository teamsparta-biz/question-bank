import { useState } from 'react'
import { useFeedbackDashboard } from '../hooks/useFeedback'
import { CATEGORIES } from '../lib/constants'
import Badge from '../components/common/Badge'

const CAT_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }
const VOTE_LABEL: Record<string, string> = { up: '추천', down: '비추천', skip: '패스' }
const VOTE_COLOR: Record<string, string> = { up: 'text-green-600', down: 'text-red-500', skip: 'text-slate-400' }

export default function FeedbackDashboard() {
  const [category, setCategory] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { questionStats, reviewerStats, totalQuestions, loading } = useFeedbackDashboard(category || undefined)

  if (loading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>

  const totalFeedbacks = questionStats.reduce((s, q) => s + q.total, 0)
  const reviewedCount = questionStats.filter(q => q.up + q.down > 0).length
  const reviewerCount = reviewerStats.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">피드백 현황</h2>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
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
          <div className="text-2xl font-bold text-primary-600">{reviewedCount} / {totalQuestions}</div>
          <div className="text-xs text-slate-500 mt-1">피드백 완료 문항 (패스 제외)</div>
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
        <div>
          {questionStats.map(q => (
            <div key={q.question_id}>
              <div
                onClick={() => setExpandedId(expandedId === q.question_id ? null : q.question_id)}
                className="flex items-center border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors text-sm"
              >
                <div className="px-4 py-2 w-16">
                  {q.category && <Badge color={CAT_COLORS[q.category] ?? 'slate'} label={q.category} />}
                </div>
                <div className="px-4 py-2 flex-1 text-slate-700 truncate">
                  {q.title}
                  {q.feedbacks.some(f => f.comment) && (
                    <span className="ml-2 text-xs text-amber-500">
                      ({q.feedbacks.filter(f => f.comment).length}건 코멘트)
                    </span>
                  )}
                </div>
                <div className="text-center px-3 py-2 w-16 font-medium text-green-600">{q.up || '-'}</div>
                <div className="text-center px-3 py-2 w-16 font-medium text-red-600">{q.down || '-'}</div>
                <div className="text-center px-3 py-2 w-16 text-slate-400">{q.skip || '-'}</div>
                <div className="text-center px-3 py-2 w-16 font-medium text-slate-700">{q.total || '-'}</div>
                <div className="px-3 py-2 w-8 text-slate-400 text-xs">
                  {expandedId === q.question_id ? '\u25B2' : '\u25BC'}
                </div>
              </div>

              {/* 코멘트 아코디언 */}
              {expandedId === q.question_id && (
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
                  {q.feedbacks.length > 0 ? (
                    <div className="space-y-2">
                      {q.feedbacks.map((fb, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <span className="font-medium text-slate-600 w-20 flex-shrink-0">{fb.reviewer}</span>
                          <span className={`font-medium w-12 flex-shrink-0 ${VOTE_COLOR[fb.vote]}`}>
                            {VOTE_LABEL[fb.vote]}
                          </span>
                          <span className="text-slate-500 flex-1">
                            {fb.comment || <span className="text-slate-300">코멘트 없음</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">아직 피드백이 없습니다</div>
                  )}
                </div>
              )}
            </div>
          ))}
          {questionStats.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400">피드백 데이터가 없습니다</div>
          )}
        </div>
        {/* 테이블 헤더 (상단 고정 느낌) */}
        {questionStats.length > 0 && (
          <div className="flex items-center bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-500 sticky top-0">
            <div className="px-4 py-1.5 w-16">영역</div>
            <div className="px-4 py-1.5 flex-1">제목</div>
            <div className="text-center px-3 py-1.5 w-16 text-green-600">추천</div>
            <div className="text-center px-3 py-1.5 w-16 text-red-600">비추</div>
            <div className="text-center px-3 py-1.5 w-16 text-slate-400">패스</div>
            <div className="text-center px-3 py-1.5 w-16">합계</div>
            <div className="px-3 py-1.5 w-8"></div>
          </div>
        )}
      </div>

      {/* 작업자별 진행률 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">작업자별 진행률 (패스 제외)</h3>
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

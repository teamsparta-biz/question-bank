import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNextQuestion, submitFeedback } from '../hooks/useFeedback'
import Badge from '../components/common/Badge'

const CAT_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }
const CAT_LABELS: Record<string, string> = { P: '프롬프트', E: '윤리/보안', D: '데이터', W: '워크플로우' }

function ReviewerGate({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState('')

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl border border-slate-200 p-8 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2">피드백 시작</h2>
        <p className="text-sm text-slate-500 mb-4">닉네임을 입력하면 미피드백 문항부터 순서대로 표시됩니다.</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onEnter(name.trim())}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="닉네임"
          autoFocus
        />
        <button
          onClick={() => name.trim() && onEnter(name.trim())}
          disabled={!name.trim()}
          className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          시작
        </button>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const navigate = useNavigate()
  const [reviewer, setReviewer] = useState(() => sessionStorage.getItem('qb_reviewer') ?? '')
  const { question, progress, loading, refetch } = useNextQuestion(reviewer)
  const [submitting, setSubmitting] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')

  const handleEnter = (name: string) => {
    sessionStorage.setItem('qb_reviewer', name)
    setReviewer(name)
  }

  if (!reviewer) {
    return <ReviewerGate onEnter={handleEnter} />
  }

  const handleVote = async (vote: 'up' | 'down' | 'skip', withComment?: string) => {
    if (!question || submitting) return
    setSubmitting(true)
    try {
      await submitFeedback({
        question_id: question.id,
        reviewer,
        vote,
        comment: withComment,
      })
      setShowComment(false)
      setComment('')
      await refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류 발생')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>

  // 완료 상태
  if (!question && progress.done >= progress.total && progress.total > 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">&#10003;</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">피드백 완료</h2>
          <p className="text-sm text-slate-500 mb-4">
            총 {progress.total}개 문항 피드백을 모두 마쳤습니다.
          </p>
          <button
            onClick={() => navigate('/feedback/dashboard')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            피드백 현황 보기
          </button>
        </div>
      </div>
    )
  }

  if (!question) {
    return <div className="p-8 text-center text-slate-400">피드백할 문항이 없습니다.</div>
  }

  const label = question.question_label
  const options = [...(question.question_option ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">문항 피드백</h2>
          <span className="text-xs text-slate-400">({reviewer})</span>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem('qb_reviewer'); setReviewer('') }}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          작업자 변경
        </button>
      </div>

      {/* 진행률 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{progress.done} / {progress.total} 완료</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* 문항 카드 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {/* 분류 배지 */}
        <div className="flex items-center gap-2">
          {label?.category && (
            <Badge color={CAT_COLORS[label.category] ?? 'slate'} label={`${label.category} ${CAT_LABELS[label.category] ?? ''}`} />
          )}
        </div>

        {/* 제목 */}
        <h3 className="text-base font-bold text-slate-900">{question.title}</h3>

        {/* 지문 */}
        {question.description && (
          <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 border-l-3 border-slate-300">
            {question.description}
          </div>
        )}

        {/* 선택지 */}
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div
              key={opt.id}
              className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                opt.is_correct
                  ? 'bg-green-50 border border-green-200 text-green-800 font-medium'
                  : 'bg-slate-50 text-slate-700'
              }`}
            >
              <span className="font-medium text-xs mt-0.5 min-w-[16px]">{String.fromCharCode(9312 + i)}</span>
              <span>{opt.label}</span>
              {opt.is_correct && <span className="ml-auto text-green-600 text-xs font-bold">정답</span>}
            </div>
          ))}
        </div>

        {/* 해설 */}
        {question.explanation && (
          <div className="text-sm text-slate-600 bg-amber-50 rounded-lg p-4 border-l-3 border-amber-300">
            <span className="font-medium text-amber-700">해설: </span>{question.explanation}
          </div>
        )}

        {/* 투표 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleVote('up')}
            disabled={submitting}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            추천
          </button>
          <button
            onClick={() => setShowComment(true)}
            disabled={submitting}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            비추천
          </button>
          <button
            onClick={() => handleVote('skip')}
            disabled={submitting}
            className="flex-1 bg-slate-400 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-500 disabled:opacity-50 transition-colors"
          >
            패스
          </button>
        </div>

        {/* 비추천 코멘트 */}
        {showComment && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-y"
              placeholder="비추천 사유 (선택)"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleVote('down', comment)}
                disabled={submitting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? '저장 중...' : '비추천 제출'}
              </button>
              <button
                onClick={() => { setShowComment(false); setComment('') }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

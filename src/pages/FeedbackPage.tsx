import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeedbackList, useQuestionById, submitFeedback, deleteFeedback } from '../hooks/useFeedback'
import type { QuestionSummary } from '../hooks/useFeedback'
import Badge from '../components/common/Badge'

const CAT_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }
const CAT_LABELS: Record<string, string> = { P: '프롬프트', E: '윤리/보안', D: '데이터', W: '워크플로우' }

const VOTE_ICON: Record<string, string> = { up: '\u25B2', down: '\u25BC', skip: '\u2014' }
const VOTE_COLOR: Record<string, string> = { up: 'text-green-600', down: 'text-red-500', skip: 'text-slate-400' }

function ReviewerGate({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl border border-slate-200 p-8 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2">피드백 시작</h2>
        <p className="text-sm text-slate-500 mb-4">닉네임을 입력하면 문항 목록이 표시됩니다.</p>
        <input
          type="text" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onEnter(name.trim())}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="닉네임" autoFocus
        />
        <button onClick={() => name.trim() && onEnter(name.trim())} disabled={!name.trim()}
          className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
          시작
        </button>
      </div>
    </div>
  )
}

type SidebarFilter = 'all' | 'pending' | 'skip'

function Sidebar({ items, selectedId, filter, onSelect, onFilterChange }: {
  items: QuestionSummary[]; selectedId: string | null; filter: SidebarFilter
  onSelect: (id: string) => void; onFilterChange: (f: SidebarFilter) => void
}) {
  const filtered = useMemo(() => {
    if (filter === 'pending') return items.filter(i => i.vote === null)
    if (filter === 'skip') return items.filter(i => i.vote === 'skip')
    return items
  }, [items, filter])

  const doneCount = items.filter(i => i.vote === 'up' || i.vote === 'down').length
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div className="w-64 flex-shrink-0 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 진행률 */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{doneCount} / {items.length}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex border-b border-slate-100 text-xs">
        {([['all', '전체'], ['pending', '미완료'], ['skip', '패스']] as const).map(([key, label]) => (
          <button key={key} onClick={() => onFilterChange(key)}
            className={`flex-1 py-1.5 text-center transition-colors ${filter === key ? 'text-primary-700 font-semibold border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>
            {label}
            <span className="ml-1 text-[10px]">
              {key === 'all' ? items.length : key === 'pending' ? items.filter(i => i.vote === null).length : items.filter(i => i.vote === 'skip').length}
            </span>
          </button>
        ))}
      </div>

      {/* 문항 목록 */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
        {filtered.map((item, idx) => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            className={`w-full text-left px-3 py-2 border-b border-slate-50 text-xs transition-colors flex items-start gap-2 ${
              selectedId === item.id ? 'bg-primary-50' : 'hover:bg-slate-50'
            }`}>
            <span className={`mt-0.5 font-bold ${item.vote ? VOTE_COLOR[item.vote] : 'text-slate-300'}`}>
              {item.vote ? VOTE_ICON[item.vote] : '\u25CB'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                {item.category && <span className={`text-[10px] font-bold ${CAT_COLORS[item.category] === 'blue' ? 'text-blue-600' : CAT_COLORS[item.category] === 'red' ? 'text-red-600' : CAT_COLORS[item.category] === 'green' ? 'text-green-600' : 'text-purple-600'}`}>{item.category}</span>}
                <span className="text-[10px] text-slate-400">#{idx + 1}</span>
              </div>
              <div className="truncate text-slate-700">{item.title}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-slate-400 text-xs">
            {filter === 'pending' ? '모든 문항에 피드백을 완료했습니다' : filter === 'skip' ? '패스한 문항이 없습니다' : '문항이 없습니다'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const navigate = useNavigate()
  const [reviewer, setReviewer] = useState(() => sessionStorage.getItem('qb_reviewer') ?? '')
  const { items, loading: listLoading, refetch: refetchList } = useFeedbackList(reviewer)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('pending')
  const [submitting, setSubmitting] = useState(false)
  const [comment, setComment] = useState('')

  // 선택된 문항이 없으면 첫 미피드백 문항 자동 선택
  const effectiveId = useMemo(() => {
    if (selectedId) return selectedId
    const pending = items.find(i => i.vote === null)
    return pending?.id ?? items[0]?.id ?? null
  }, [selectedId, items])

  const { question, loading: questionLoading } = useQuestionById(effectiveId)
  const currentItem = items.find(i => i.id === effectiveId)

  const handleEnter = (name: string) => {
    sessionStorage.setItem('qb_reviewer', name)
    setReviewer(name)
  }

  if (!reviewer) return <ReviewerGate onEnter={handleEnter} />

  const handleVote = async (vote: 'up' | 'down' | 'skip') => {
    if (!effectiveId || submitting) return
    setSubmitting(true)
    try {
      // 이미 피드백이 있으면 삭제 후 재등록
      if (currentItem?.vote) {
        await deleteFeedback(effectiveId, reviewer)
      }
      await submitFeedback({
        question_id: effectiveId,
        reviewer,
        vote,
        comment: comment.trim() || undefined,
      })
      setComment('')
      await refetchList()
      // 다음 미피드백 문항으로 이동
      const nextPending = items.find(i => i.vote === null && i.id !== effectiveId)
      if (nextPending) setSelectedId(nextPending.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류 발생')
    } finally {
      setSubmitting(false)
    }
  }

  if (listLoading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>

  const label = question?.question_label
  const options = [...(question?.question_option ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">문항 피드백</h2>
          <span className="text-xs text-slate-400">({reviewer})</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/feedback/dashboard')} className="text-xs text-primary-600 hover:text-primary-700">피드백 현황</button>
          <button onClick={() => { sessionStorage.removeItem('qb_reviewer'); setReviewer('') }}
            className="text-xs text-slate-400 hover:text-slate-600">작업자 변경</button>
        </div>
      </div>

      {/* 사이드바 + 카드 */}
      <div className="flex gap-4">
        <Sidebar items={items} selectedId={effectiveId} filter={sidebarFilter}
          onSelect={id => { setSelectedId(id); setComment('') }}
          onFilterChange={setSidebarFilter} />

        {/* 메인 카드 */}
        <div className="flex-1 min-w-0">
          {questionLoading ? (
            <div className="p-8 text-center text-slate-400">불러오는 중...</div>
          ) : !question ? (
            <div className="p-8 text-center text-slate-400">문항을 선택하세요</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              {/* 상태 표시 */}
              {currentItem?.vote && (
                <div className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                  currentItem.vote === 'up' ? 'bg-green-50 text-green-700' :
                  currentItem.vote === 'down' ? 'bg-red-50 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {currentItem.vote === 'up' ? '추천됨' : currentItem.vote === 'down' ? '비추천됨' : '패스됨'} (재투표 가능)
                </div>
              )}

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
                  <div key={opt.id}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                      opt.is_correct ? 'bg-green-50 border border-green-200 text-green-800 font-medium' : 'bg-slate-50 text-slate-700'
                    }`}>
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

              {/* 코멘트 (상시 표시) */}
              <div className="pt-2">
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                  placeholder="코멘트 (선택 — 수정 의견, 보완 사항 등)" />
              </div>

              {/* 투표 버튼 */}
              <div className="flex gap-3">
                <button onClick={() => handleVote('up')} disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                  추천
                </button>
                <button onClick={() => handleVote('down')} disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                  비추천
                </button>
                <button onClick={() => handleVote('skip')} disabled={submitting}
                  className="flex-1 bg-slate-400 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-500 disabled:opacity-50 transition-colors">
                  패스
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

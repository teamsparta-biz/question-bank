import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePoolDetail, addQuestionToPool, removeQuestionFromPool, swapPoolQuestionOrder } from '../hooks/usePools'
import { supabase } from '../lib/supabase'
import Badge from '../components/common/Badge'
import { CATEGORIES } from '../lib/constants'
import type { QuestionWithLabel, QuestionLabel, QuestionOption } from '../types'

const CAT_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }
const DIFF_COLORS: Record<string, string> = { 'Lv.1': 'green', 'Lv.2': 'amber', 'Lv.3': 'red' }

function getLabel(q: QuestionWithLabel | undefined): QuestionLabel | null {
  if (!q) return null
  return Array.isArray(q.question_label) ? q.question_label[0] ?? null : q.question_label
}

// ---- 퍼널 단계 정의 (객관식만) ----
const FUNNEL_STEPS = [
  { key: 'P', label: 'P 프롬프트 리터러시', count: 5 },
  { key: 'E', label: 'E 윤리/보안', count: 5 },
  { key: 'D', label: 'D 데이터 리터러시', count: 5 },
  { key: 'W', label: 'W 워크플로우 설계', count: 5 },
]

// Fisher-Yates 셔플 후 n개 추출
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

// ---- 퍼널 컴포넌트 ----
function QuestionPicker({
  existingIds, onDone, onCancel,
}: {
  existingIds: Set<string>
  onDone: (ids: string[]) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState(0)
  const [allQuestions, setAllQuestions] = useState<(QuestionWithLabel & { pool_count: number; question_option?: QuestionOption[] })[]>([])
  const [selected, setSelected] = useState<Record<string, string[]>>({ P: [], E: [], D: [], W: [] })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: questions } = await supabase
        .from('question')
        .select('*, question_label(*), question_option(*), pool_question(count)')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(500)
      const mapped = (questions ?? []).map((q: Record<string, unknown>) => ({
        ...q,
        pool_count: Array.isArray(q.pool_question) && q.pool_question.length > 0
          ? (q.pool_question[0] as { count: number }).count : 0,
      }))
      setAllQuestions(mapped as (QuestionWithLabel & { pool_count: number; question_option?: QuestionOption[] })[])
      setLoading(false)
    })()
  }, [])

  // 랜덤 자동 구성: 각 카테고리별 랜덤 5개
  const autoRandom = () => {
    const available = allQuestions.filter(q => !existingIds.has(q.id))
    const next: Record<string, string[]> = { P: [], E: [], D: [], W: [] }

    for (const s of FUNNEL_STEPS) {
      const pool = available.filter(q => {
        const label = getLabel(q)
        return label?.category === s.key
      })
      const usedIds = new Set(Object.values(next).flat())
      const eligible = pool.filter(q => !usedIds.has(q.id))
      next[s.key] = pickRandom(eligible, s.count).map(q => q.id)
    }

    setSelected(next)
    setStep(0)
  }

  const currentStep = FUNNEL_STEPS[step]
  const currentSelected = selected[currentStep.key] ?? []

  const filtered = useMemo(() => {
    return allQuestions.filter(q => {
      if (existingIds.has(q.id)) return false
      const allSelected = Object.values(selected).flat()
      if (allSelected.includes(q.id) && !currentSelected.includes(q.id)) return false
      const label = getLabel(q)
      if (label?.category !== currentStep.key) return false
      if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allQuestions, existingIds, selected, currentSelected, currentStep, search])

  const toggleSelect = (id: string) => {
    const key = currentStep.key
    const cur = selected[key] ?? []
    if (cur.includes(id)) {
      setSelected({ ...selected, [key]: cur.filter(x => x !== id) })
    } else {
      if (cur.length >= currentStep.count) return
      setSelected({ ...selected, [key]: [...cur, id] })
    }
  }

  const handleDone = () => {
    const allIds = Object.values(selected).flat()
    onDone(allIds)
  }

  const totalSelected = Object.values(selected).flat().length

  if (loading) return <div className="p-6 text-center text-slate-400">문항 불러오는 중...</div>

  return (
    <div className="bg-white rounded-xl border border-primary-200 mb-4">
      {/* 퍼널 스텝 바 */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={autoRandom}
          className="px-4 py-2.5 text-xs font-medium whitespace-nowrap text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors border-r border-slate-200"
        >
          랜덤 자동 구성
        </button>
        {FUNNEL_STEPS.map((s, i) => {
          const cnt = (selected[s.key] ?? []).length
          const isActive = i === step
          const isDone = cnt > 0
          return (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors relative flex items-center gap-1.5 ${
                isActive ? 'text-primary-700' : isDone ? 'text-green-600' : 'text-slate-400'
              }`}
            >
              {isDone && !isActive && <span>&#10003;</span>}
              {s.key}
              {cnt > 0 && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{cnt}</span>}
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t" />}
            </button>
          )
        })}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-700">{currentStep.label}</h4>
            <p className="text-xs text-slate-400">
              {currentSelected.length}/{currentStep.count}개 선택
              {currentSelected.length >= currentStep.count && ' (완료)'}
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색..."
            className="border border-slate-300 rounded-lg px-3 py-1 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">해당 조건의 문항이 없습니다</p>
          ) : (
            filtered.map(q => {
              const label = getLabel(q)
              const isChecked = currentSelected.includes(q.id)
              const isFull = currentSelected.length >= currentStep.count && !isChecked
              return (
                <div
                  key={q.id}
                  onClick={() => !isFull && toggleSelect(q.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isChecked
                      ? 'border-primary-300 bg-primary-50'
                      : isFull
                        ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                        : 'border-slate-150 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{q.title}</p>
                      {q.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{q.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {label?.difficulty && (
                          <Badge label={label.difficulty} color={DIFF_COLORS[label.difficulty] as 'amber' ?? 'slate'} />
                        )}
                        <span className="text-[10px] text-slate-400">
                          풀 {q.pool_count}회 &#183; {new Date(q.updated_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'
                    }`}>
                      {isChecked && <span className="text-xs">&#10003;</span>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">총 {totalSelected}개 선택됨</div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">
              취소
            </button>
            {step < FUNNEL_STEPS.length - 1 ? (
              <button
                onClick={() => { setStep(step + 1); setSearch('') }}
                className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                다음 &rarr;
              </button>
            ) : (
              <button
                onClick={handleDone}
                disabled={totalSelected === 0}
                className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {totalSelected}개 추가
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- 문항 상세 표시 (접기/펼치기) ----
function QuestionContent({ questionId }: { questionId: string }) {
  const [options, setOptions] = useState<QuestionOption[] | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.from('question_option').select('*').eq('question_id', questionId).order('sort_order')
      .then(({ data }) => { setOptions((data ?? []) as QuestionOption[]); setLoaded(true) })
  }, [questionId])

  if (!loaded) return <div className="text-xs text-slate-400">불러오는 중...</div>

  return (
    <div className="mt-2 space-y-1">
      {(options ?? []).map((o, i) => (
        <div key={o.id} className={`flex items-start gap-2 text-xs px-2 py-1 rounded ${o.is_correct ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-600'}`}>
          <span className="w-4 shrink-0">{String.fromCharCode(9312 + i)}</span>
          <span>{o.label}</span>
          {o.is_correct && <span className="text-green-500 ml-auto shrink-0">&#10003; 정답</span>}
        </div>
      ))}
    </div>
  )
}

// ---- 메인 페이지 ----
export default function PoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pool, questions, loading, refetch } = usePoolDetail(id)
  const [showPicker, setShowPicker] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (qid: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(qid)) next.delete(qid); else next.add(qid)
      return next
    })
  }

  const allExpanded = questions.length > 0 && expanded.size >= questions.length
  const toggleAll = () => {
    if (allExpanded) {
      setExpanded(new Set())
    } else {
      setExpanded(new Set(questions.map(pq => pq.question_id)))
    }
  }

  const handleAdd = async (ids: string[]) => {
    try {
      for (let i = 0; i < ids.length; i++) {
        await addQuestionToPool(id!, ids[i], questions.length + i)
      }
      setShowPicker(false)
      refetch()
    } catch (err) {
      console.error(err)
      alert('추가 실패')
    }
  }

  const handleRemove = async (questionId: string) => {
    if (!confirm('이 문항을 풀에서 제거하시겠습니까?')) return
    try {
      await removeQuestionFromPool(id!, questionId)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= questions.length) return
    const a = questions[index]
    const b = questions[targetIdx]
    try {
      await swapPoolQuestionOrder(a.id, a.sort_order, b.id, b.sort_order)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>
  if (!pool) return <div className="p-8 text-center text-slate-400">문항풀을 찾을 수 없습니다</div>

  const existingIds = new Set(questions.map(pq => pq.question_id))

  // 통계
  const stats = { categories: {} as Record<string, number>, difficulties: {} as Record<string, number> }
  questions.forEach(pq => {
    const label = getLabel(pq.question)
    if (label?.category) stats.categories[label.category] = (stats.categories[label.category] || 0) + 1
    if (label?.difficulty) stats.difficulties[label.difficulty] = (stats.difficulties[label.difficulty] || 0) + 1
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/pools')} className="text-slate-400 hover:text-slate-600">&larr;</button>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{pool.name}</h2>
          {pool.description && <p className="text-sm text-slate-500">{pool.description}</p>}
        </div>
      </div>

      {/* 통계 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div><span className="text-slate-500">총:</span><span className="ml-1 font-semibold">{questions.length}</span></div>
          {Object.entries(stats.categories).sort().map(([d, c]) => (
            <div key={d}>
              <Badge label={`${d} ${CATEGORIES[d as keyof typeof CATEGORIES] ?? d}`} color={CAT_COLORS[d] as 'blue' ?? 'slate'} />
              <span className="ml-1 font-semibold text-slate-700">{c}</span>
            </div>
          ))}
          {Object.entries(stats.difficulties).sort().map(([d, c]) => (
            <div key={d}>
              <Badge label={d} color={DIFF_COLORS[d] as 'amber' ?? 'slate'} />
              <span className="ml-1 font-semibold text-slate-700">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 문항 추가 + 일괄 펼치기 */}
      <div className="flex justify-between mb-3">
        <div className="flex gap-2">
          {questions.length > 0 && (
            <>
              <button
                onClick={toggleAll}
                className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg"
              >
                {allExpanded ? '전체 접기' : '전체 펼치기'}
              </button>
              <Link
                to={`/pools/${id}/print`}
                className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg"
              >
                PDF 출력
              </Link>
            </>
          )}
        </div>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          {showPicker ? '닫기' : '+ 문항 추가'}
        </button>
      </div>

      {showPicker && (
        <QuestionPicker
          existingIds={existingIds}
          onDone={handleAdd}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {/* 문항 목록 */}
      <div className="bg-white rounded-xl border border-slate-200">
        {questions.length === 0 ? (
          <div className="p-6 text-center text-slate-400">문항이 없습니다. 위 버튼으로 추가하세요.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((pq, i) => {
              const label = getLabel(pq.question)
              const isExpanded = expanded.has(pq.question_id)
              return (
                <div key={pq.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex flex-col items-center shrink-0 pt-0.5 gap-0.5">
                        <button
                          onClick={() => handleMove(i, 'up')}
                          disabled={i === 0}
                          className="text-[10px] text-slate-400 hover:text-slate-600 disabled:opacity-20 disabled:cursor-default leading-none"
                        >&#9650;</button>
                        <span className="text-xs text-slate-400 w-5 text-center">{i + 1}</span>
                        <button
                          onClick={() => handleMove(i, 'down')}
                          disabled={i === questions.length - 1}
                          className="text-[10px] text-slate-400 hover:text-slate-600 disabled:opacity-20 disabled:cursor-default leading-none"
                        >&#9660;</button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {label?.category && (
                            <Badge label={`${label.category}`} color={CAT_COLORS[label.category] as 'blue' ?? 'slate'} />
                          )}
                          {label?.difficulty && (
                            <Badge label={label.difficulty} color={DIFF_COLORS[label.difficulty] as 'amber' ?? 'slate'} />
                          )}
                        </div>
                        <Link
                          to={`/questions/${pq.question_id}`}
                          className="text-sm font-medium text-slate-800 hover:text-primary-600"
                        >
                          {pq.question?.title}
                        </Link>
                        {pq.question?.description && (
                          <p className={`text-xs text-slate-400 mt-0.5 ${isExpanded ? '' : 'line-clamp-1'}`}>
                            {pq.question.description}
                          </p>
                        )}

                        {isExpanded && (
                          <QuestionContent questionId={pq.question_id} />
                        )}

                        <button
                          onClick={() => toggleExpand(pq.question_id)}
                          className="text-[10px] text-primary-500 hover:text-primary-700 mt-1"
                        >
                          {isExpanded ? '접기 ▲' : '펼치기 ▼'}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(pq.question_id)}
                      className="text-xs text-slate-400 hover:text-red-500 shrink-0"
                    >
                      제거
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

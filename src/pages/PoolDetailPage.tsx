import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePoolDetail, addQuestionToPool, removeQuestionFromPool } from '../hooks/usePools'
import { supabase } from '../lib/supabase'
import Badge from '../components/common/Badge'
import { CATEGORIES } from '../lib/constants'
import type { QuestionWithLabel } from '../types'

const DOMAIN_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }

export default function PoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pool, questions, loading, refetch } = usePoolDetail(id)
  const [showPicker, setShowPicker] = useState(false)
  const [allQuestions, setAllQuestions] = useState<QuestionWithLabel[]>([])
  const [search, setSearch] = useState('')

  const existingIds = new Set(questions.map(pq => pq.question_id))

  useEffect(() => {
    if (!showPicker) return
    supabase
      .from('question')
      .select('*, question_label(*)')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setAllQuestions((data ?? []) as QuestionWithLabel[]))
  }, [showPicker])

  const handleAdd = async (questionId: string) => {
    try {
      await addQuestionToPool(id!, questionId, questions.length)
      refetch()
    } catch (err) {
      console.error(err)
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

  if (loading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>
  if (!pool) return <div className="p-8 text-center text-slate-400">문항풀을 찾을 수 없습니다</div>

  // 분류 통계
  const stats = {
    mcq: 0, subjective: 0,
    categories: {} as Record<string, number>,
    difficulties: {} as Record<string, number>,
  }
  questions.forEach(pq => {
    const label = Array.isArray(pq.question?.question_label)
      ? pq.question.question_label[0]
      : pq.question?.question_label
    if (pq.question?.response_type === 'text') stats.subjective++
    else stats.mcq++
    if (label?.category) stats.categories[label.category] = (stats.categories[label.category] || 0) + 1
    if (label?.difficulty) stats.difficulties[label.difficulty] = (stats.difficulties[label.difficulty] || 0) + 1
  })

  const filteredAvailable = allQuestions
    .filter(q => !existingIds.has(q.id))
    .filter(q => !search || q.title.toLowerCase().includes(search.toLowerCase()))

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
          <div>
            <span className="text-slate-500">총 문항:</span>
            <span className="ml-1 font-semibold">{questions.length}</span>
          </div>
          <div>
            <span className="text-slate-500">객관식:</span>
            <span className="ml-1 font-semibold">{stats.mcq}</span>
          </div>
          <div>
            <span className="text-slate-500">주관식:</span>
            <span className="ml-1 font-semibold">{stats.subjective}</span>
          </div>
          {Object.entries(stats.categories).map(([d, c]) => (
            <div key={d}>
              <Badge label={`${d} ${CATEGORIES[d as keyof typeof CATEGORIES] ?? d}`} color={DOMAIN_COLORS[d] as 'blue' ?? 'slate'} />
              <span className="ml-1 font-semibold text-slate-700">{c}</span>
            </div>
          ))}
          {Object.entries(stats.difficulties).map(([d, c]) => (
            <div key={d}>
              <Badge label={`난이도 ${d}`} color="amber" />
              <span className="ml-1 font-semibold text-slate-700">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 문항 추가 버튼 */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          {showPicker ? '닫기' : '+ 문항 추가'}
        </button>
      </div>

      {/* 문항 선택 피커 */}
      {showPicker && (
        <div className="bg-white rounded-xl border border-primary-200 p-4 mb-4 max-h-64 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목 검색..."
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {filteredAvailable.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">추가 가능한 문항이 없습니다</p>
          ) : (
            filteredAvailable.map(q => (
              <div key={q.id} className="flex items-center justify-between py-1.5 hover:bg-slate-50 px-2 rounded-lg">
                <span className="text-sm text-slate-700 truncate flex-1">{q.title}</span>
                <button
                  onClick={() => handleAdd(q.id)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-2 shrink-0"
                >
                  추가
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 문항 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {questions.length === 0 ? (
          <div className="p-6 text-center text-slate-400">문항이 없습니다. 위 버튼으로 추가하세요.</div>
        ) : (
          questions.map((pq, i) => {
            return (
              <div key={pq.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-slate-400 w-5">{i + 1}</span>
                  <Badge
                    label={pq.question?.response_type === 'text' ? '주관식' : '객관식'}
                    color={pq.question?.response_type === 'text' ? 'teal' : 'blue'}
                  />
                  <span className="text-sm text-slate-700 truncate">{pq.question?.title}</span>
                </div>
                <button
                  onClick={() => handleRemove(pq.question_id)}
                  className="text-xs text-slate-400 hover:text-red-500 shrink-0 ml-2"
                >
                  제거
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

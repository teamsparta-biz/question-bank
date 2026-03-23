import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePoolDetail, addQuestionToPool, removeQuestionFromPool } from '../hooks/usePools'
import { supabase } from '../lib/supabase'
import Badge from '../components/common/Badge'
import { CATEGORIES, COMPLEXITIES } from '../lib/constants'
import type { QuestionWithLabel, QuestionLabel } from '../types'

const CAT_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }
const DIFF_COLORS: Record<string, string> = { 'Lv.1': 'green', 'Lv.2': 'amber', 'Lv.3': 'red' }

function getLabel(q: QuestionWithLabel | undefined): QuestionLabel | null {
  if (!q) return null
  return Array.isArray(q.question_label) ? q.question_label[0] ?? null : q.question_label
}

function QuestionBadges({ label, responseType }: { label: QuestionLabel | null; responseType?: string }) {
  const isSubjective = responseType === 'text'
  return (
    <div className="flex flex-wrap gap-1">
      <Badge
        label={isSubjective ? '주관식' : '객관식'}
        color={isSubjective ? 'teal' : 'blue'}
      />
      {label?.category && (
        <Badge label={`${label.category} ${CATEGORIES[label.category as keyof typeof CATEGORIES] ?? ''}`} color={CAT_COLORS[label.category] as 'blue' ?? 'slate'} />
      )}
      {label?.complexity && (
        <Badge label={COMPLEXITIES[label.complexity as keyof typeof COMPLEXITIES] ?? label.complexity} color="purple" />
      )}
      {label?.industry && label.industry !== '공통' && (
        <Badge label={label.industry} color="slate" />
      )}
      {label?.position && label.position !== '공통' && (
        <Badge label={label.position} color="slate" />
      )}
      {label?.difficulty && (
        <Badge label={label.difficulty} color={DIFF_COLORS[label.difficulty] as 'amber' ?? 'slate'} />
      )}
    </div>
  )
}

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
    const label = getLabel(pq.question)
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
              <Badge label={`${d} ${CATEGORIES[d as keyof typeof CATEGORIES] ?? d}`} color={CAT_COLORS[d] as 'blue' ?? 'slate'} />
              <span className="ml-1 font-semibold text-slate-700">{c}</span>
            </div>
          ))}
          {Object.entries(stats.difficulties).map(([d, c]) => (
            <div key={d}>
              <Badge label={d} color={DIFF_COLORS[d] as 'amber' ?? 'slate'} />
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
        <div className="bg-white rounded-xl border border-primary-200 p-4 mb-4 max-h-80 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목 검색..."
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {filteredAvailable.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">추가 가능한 문항이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {filteredAvailable.map(q => {
                const label = getLabel(q)
                return (
                  <div key={q.id} className="flex items-start justify-between p-2.5 hover:bg-slate-50 rounded-lg border border-slate-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{q.title}</p>
                      <div className="mt-1">
                        <QuestionBadges label={label} responseType={q.response_type} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(q.id)}
                      className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium ml-3 px-3 py-1.5 rounded-lg shrink-0"
                    >
                      추가
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 문항 목록 */}
      <div className="bg-white rounded-xl border border-slate-200">
        {questions.length === 0 ? (
          <div className="p-6 text-center text-slate-400">문항이 없습니다. 위 버튼으로 추가하세요.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-center px-3 py-2.5 font-medium text-slate-500 w-10">#</th>
                <th className="text-left px-3 py-2.5 font-medium text-slate-500">유형</th>
                <th className="text-left px-3 py-2.5 font-medium text-slate-500">제목</th>
                <th className="text-left px-3 py-2.5 font-medium text-slate-500">분류</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-500 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map((pq, i) => {
                const label = getLabel(pq.question)
                const isSubjective = pq.question?.response_type === 'text'
                return (
                  <tr key={pq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="text-center px-3 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-3 py-3">
                      <Badge
                        label={isSubjective ? '주관식' : '객관식'}
                        color={isSubjective ? 'teal' : 'blue'}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to={`/questions/${pq.question_id}`}
                        className="text-slate-800 hover:text-primary-600 font-medium"
                      >
                        {pq.question?.title}
                      </Link>
                      {pq.question?.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{pq.question.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {label?.category && (
                          <Badge label={`${label.category} ${CATEGORIES[label.category as keyof typeof CATEGORIES] ?? ''}`} color={CAT_COLORS[label.category] as 'blue' ?? 'slate'} />
                        )}
                        {label?.complexity && (
                          <Badge label={COMPLEXITIES[label.complexity as keyof typeof COMPLEXITIES] ?? label.complexity} color="purple" />
                        )}
                        {label?.industry && label.industry !== '공통' && (
                          <Badge label={label.industry} color="slate" />
                        )}
                        {label?.position && label.position !== '공통' && (
                          <Badge label={label.position} color="slate" />
                        )}
                        {label?.difficulty && (
                          <Badge label={label.difficulty} color={DIFF_COLORS[label.difficulty] as 'amber' ?? 'slate'} />
                        )}
                      </div>
                    </td>
                    <td className="text-center px-3 py-3">
                      <button
                        onClick={() => handleRemove(pq.question_id)}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        제거
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

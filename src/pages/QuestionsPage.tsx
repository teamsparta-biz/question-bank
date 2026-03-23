import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'
import FilterPanel from '../components/common/FilterPanel'
import Badge from '../components/common/Badge'
import { CATEGORIES } from '../lib/constants'
import type { QuestionFilters } from '../types'

const INITIAL_FILTERS: QuestionFilters = {
  question_type: '',
  category: '',
  industry: '',
  position: '',
  difficulty: '',
  complexity: '',
  task_type: '',
  is_active: '',
  search: '',
}

const CAT_COLORS: Record<string, string> = { P: 'blue', E: 'red', D: 'green', W: 'purple' }
const DIFF_COLORS: Record<string, string> = { 'Lv.1': 'green', 'Lv.2': 'amber', 'Lv.3': 'red' }

export default function QuestionsPage() {
  const [filters, setFilters] = useState<QuestionFilters>(INITIAL_FILTERS)
  const [page, setPage] = useState(0)

  const { questions, total, loading, pageSize } = useQuestions(filters, page)

  useEffect(() => { setPage(0) }, [filters])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">문항 관리</h2>
          <p className="text-sm text-slate-500">{total}개 문항</p>
        </div>
        <Link
          to="/questions/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + 새 문항
        </Link>
      </div>

      <FilterPanel filters={filters} onChange={setFilters} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">불러오는 중...</div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">문항이 없습니다</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">유형</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">제목</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">분류</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">v</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">수정일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map(q => {
                const label = q.question_label
                const isSubjective = q.response_type === 'text'
                return (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Badge
                        label={isSubjective ? '주관식' : '객관식'}
                        color={isSubjective ? 'teal' : 'blue'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/questions/${q.id}`} className="text-slate-900 hover:text-primary-600 font-medium">
                        {q.title}
                      </Link>
                      {!q.is_active && <Badge label="비활성" color="slate" className="ml-2" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {label?.category && (
                          <Badge label={`${label.category} ${CATEGORIES[label.category as keyof typeof CATEGORIES] ?? ''}`} color={CAT_COLORS[label.category] as 'blue' ?? 'slate'} />
                        )}
                        {label?.industry && label.industry !== '공통' && (
                          <Badge label={label.industry} color="slate" />
                        )}
                        {label?.position && label.position !== '공통' && (
                          <Badge label={label.position} color="slate" />
                        )}
                        {label?.difficulty && (
                          <Badge label={`난이도 ${label.difficulty}`} color={DIFF_COLORS[label.difficulty] as 'amber' ?? 'slate'} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {q.current_version}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(q.updated_at).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100"
          >
            이전
          </button>
          <span className="text-sm text-slate-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}

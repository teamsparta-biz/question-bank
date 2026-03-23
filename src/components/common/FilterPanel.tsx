import { CATEGORIES, INDUSTRIES, POSITIONS, DIFFICULTIES, COMPLEXITIES } from '../../lib/constants'
import type { QuestionFilters } from '../../types'

interface Props {
  filters: QuestionFilters
  onChange: (filters: QuestionFilters) => void
}

function Select({
  label, value, onChange, options, allLabel = '전체',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  allLabel?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">{allLabel}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function FilterPanel({ filters, onChange }: Props) {
  const set = (key: keyof QuestionFilters, value: string) => {
    const next = { ...filters, [key]: value }
    // 탭 전환 시 관련 필터 초기화
    if (key === 'question_type') {
      next.category = ''
      next.complexity = ''
      next.task_type = ''
    }
    // category 변경 시 관련 리셋 (폼에서만 사용, 필터에는 topic 없음)
    onChange(next)
  }

  const isMcq = filters.question_type === 'mcq'
  const isSubjective = filters.question_type === 'subjective'

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-4">
      {/* 유형 탭 */}
      <div className="flex border-b border-slate-200">
        {[
          { value: '', label: '전체' },
          { value: 'mcq', label: '객관식' },
          { value: 'subjective', label: '주관식' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => set('question_type', tab.value)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
              filters.question_type === tab.value
                ? 'text-primary-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {filters.question_type === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* 객관식 전용 */}
        {isMcq && (
          <div className="flex flex-wrap gap-3">
            <Select
              label="카테고리"
              value={filters.category}
              onChange={v => set('category', v)}
              options={Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
            />
          </div>
        )}

        {/* 주관식 전용 */}
        {isSubjective && (
          <div className="flex flex-wrap gap-3">
            <Select
              label="복잡도"
              value={filters.complexity}
              onChange={v => set('complexity', v)}
              options={Object.entries(COMPLEXITIES).map(([k, v]) => ({ value: k, label: v }))}
            />
          </div>
        )}

        {/* 공통 필터 */}
        <div className="flex flex-wrap gap-3">
          <Select
            label="산업"
            value={filters.industry}
            onChange={v => set('industry', v)}
            options={Object.entries(INDUSTRIES).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            label="직급"
            value={filters.position}
            onChange={v => set('position', v)}
            options={Object.entries(POSITIONS).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            label="난이도"
            value={filters.difficulty}
            onChange={v => set('difficulty', v)}
            options={Object.entries(DIFFICULTIES).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            label="상태"
            value={filters.is_active}
            onChange={v => set('is_active', v)}
            options={[
              { value: 'true', label: '활성' },
              { value: 'false', label: '비활성' },
            ]}
          />
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-500">검색</label>
            <input
              type="text"
              value={filters.search}
              onChange={e => set('search', e.target.value)}
              placeholder="제목 검색..."
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

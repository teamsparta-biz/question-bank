import { DOMAINS, COGNITIVE_LEVELS, QUESTION_FORMATS, COMPLEXITIES, TASK_TYPES } from '../../lib/constants'
import type { QuestionFilters } from '../../types'
import type { Topic } from '../../types'

interface Props {
  filters: QuestionFilters
  topics: Topic[]
  onChange: (filters: QuestionFilters) => void
}

function Select({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">전체</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function FilterPanel({ filters, topics, onChange }: Props) {
  const set = (key: keyof QuestionFilters, value: string) => {
    const next = { ...filters, [key]: value }
    if (key === 'domain') next.topic_code = ''
    onChange(next)
  }

  const switchType = (type: string) => {
    onChange({
      question_type: type,
      domain: '',
      cognitive_level: '',
      question_format: '',
      topic_code: '',
      complexity: '',
      task_type: '',
      is_active: filters.is_active,
      search: filters.search,
    })
  }

  const filteredTopics = filters.domain
    ? topics.filter(t => t.domain === filters.domain)
    : topics

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
            onClick={() => switchType(tab.value)}
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
        {/* 객관식 필터 */}
        {isMcq && (
          <div className="flex flex-wrap gap-3">
            <Select
              label="영역"
              value={filters.domain}
              onChange={v => set('domain', v)}
              options={Object.entries(DOMAINS).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
            />
            <Select
              label="인지수준"
              value={filters.cognitive_level}
              onChange={v => set('cognitive_level', v)}
              options={Object.entries(COGNITIVE_LEVELS).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
            />
            <Select
              label="문제형식"
              value={filters.question_format}
              onChange={v => set('question_format', v)}
              options={Object.entries(QUESTION_FORMATS).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
            />
            <Select
              label="토픽"
              value={filters.topic_code}
              onChange={v => set('topic_code', v)}
              options={filteredTopics.map(t => ({ value: t.code, label: `${t.code} ${t.name}` }))}
            />
          </div>
        )}

        {/* 주관식 필터 */}
        {isSubjective && (
          <div className="flex flex-wrap gap-3">
            <Select
              label="복잡도"
              value={filters.complexity}
              onChange={v => set('complexity', v)}
              options={Object.entries(COMPLEXITIES).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Select
              label="유형"
              value={filters.task_type ?? ''}
              onChange={v => set('task_type' as keyof QuestionFilters, v)}
              options={Object.entries(TASK_TYPES).map(([k, v]) => ({ value: k, label: v }))}
            />
          </div>
        )}

        {/* 공통 필터 */}
        <div className="flex flex-wrap gap-3">
          <Select
            label="상태"
            value={filters.is_active}
            onChange={v => set('is_active', v)}
            options={[
              { value: 'all', label: '전체' },
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

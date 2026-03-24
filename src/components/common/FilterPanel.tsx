import { CATEGORIES } from '../../lib/constants'
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
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-4 p-4">
      <div className="flex flex-wrap gap-3">
        <Select
          label="카테고리"
          value={filters.category}
          onChange={v => set('category', v)}
          options={Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
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
  )
}

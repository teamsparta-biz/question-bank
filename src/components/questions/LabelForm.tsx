import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES, INDUSTRIES, POSITIONS, DIFFICULTIES, COMPLEXITIES } from '../../lib/constants'
import type { Topic } from '../../types'

interface Props {
  isSubjective: boolean
  category: string
  industry: string
  position: string
  topicId: string
  difficulty: string
  complexity: string
  onChange: (key: string, value: string) => void
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">선택</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export default function LabelForm({ isSubjective, category, industry, position, topicId, difficulty, complexity, onChange }: Props) {
  const [allTopics, setAllTopics] = useState<Topic[]>([])

  useEffect(() => {
    supabase.from('topic').select('*').eq('is_active', true).order('category').order('sort_order')
      .then(({ data }) => setAllTopics((data ?? []) as Topic[]))
  }, [])

  const filteredTopics = useMemo(() => {
    return allTopics.filter(t => {
      if (category && t.category !== category) return false
      if (industry && !t.industries.includes('공통') && !t.industries.includes(industry)) return false
      if (position && !t.positions.includes('공통') && !t.positions.includes(position)) return false
      return true
    })
  }, [allTopics, category, industry, position])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">분류</h3>

      {/* 객관식: 카테고리 + 토픽 */}
      {!isSubjective && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <Select
            label="카테고리"
            value={category}
            onChange={v => { onChange('category', v); onChange('topic_id', '') }}
            options={Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
          />
          <Select
            label="토픽"
            value={topicId}
            onChange={v => onChange('topic_id', v)}
            options={filteredTopics.map(t => ({ value: t.id, label: `${t.code} ${t.name}` }))}
          />
        </div>
      )}

      {/* 주관식: 복잡도 */}
      {isSubjective && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <Select
            label="복잡도"
            value={complexity}
            onChange={v => onChange('complexity', v)}
            options={Object.entries(COMPLEXITIES).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>
      )}

      {/* 공통: 산업 + 직급 + 난이도 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Select
          label="산업"
          value={industry}
          onChange={v => { onChange('industry', v); if (!isSubjective) onChange('topic_id', '') }}
          options={Object.entries(INDUSTRIES).map(([k, v]) => ({ value: k, label: v }))}
        />
        <Select
          label="직급"
          value={position}
          onChange={v => { onChange('position', v); if (!isSubjective) onChange('topic_id', '') }}
          options={Object.entries(POSITIONS).map(([k, v]) => ({ value: k, label: v }))}
        />
        <Select
          label="난이도"
          value={difficulty}
          onChange={v => onChange('difficulty', v)}
          options={Object.entries(DIFFICULTIES).map(([k, v]) => ({ value: k, label: v }))}
        />
      </div>
    </div>
  )
}

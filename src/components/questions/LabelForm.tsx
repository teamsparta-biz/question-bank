import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../lib/constants'
import type { Topic } from '../../types'

interface Props {
  category: string
  topicId: string
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

export default function LabelForm({ category, topicId, onChange }: Props) {
  const [allTopics, setAllTopics] = useState<Topic[]>([])

  useEffect(() => {
    supabase.from('topic').select('*').eq('is_active', true).order('category').order('sort_order')
      .then(({ data }) => setAllTopics((data ?? []) as Topic[]))
  }, [])

  const filteredTopics = useMemo(() => {
    return allTopics.filter(t => {
      if (category && t.category !== category) return false
      return true
    })
  }, [allTopics, category])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">분류</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
      <p className="text-xs text-slate-400 mt-3">산업·직급 '공통' 고정 / 난이도는 정답률 기반 자동 산출</p>
    </div>
  )
}

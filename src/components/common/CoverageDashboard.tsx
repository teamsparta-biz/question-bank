import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../lib/constants'

const TARGET = 100
const CAT_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  P: { bar: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-700' },
  E: { bar: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-700' },
  D: { bar: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-700' },
  W: { bar: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-700' },
}

export default function CoverageDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('question')
        .select('id, question_label!inner(category)')
        .eq('is_active', true)

      const catCounts: Record<string, number> = { P: 0, E: 0, D: 0, W: 0 }
      for (const q of data ?? []) {
        const label = Array.isArray(q.question_label) ? q.question_label[0] : q.question_label
        const cat = (label as { category: string } | null)?.category
        if (cat && cat in catCounts) catCounts[cat]++
      }
      setCounts(catCounts)
      setLoading(false)
    })()
  }, [])

  if (loading) return null

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">문항 DB 커버리지</h3>
        <span className="text-xs text-slate-500">총 {total}개 / 목표 {TARGET * 4}개</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(CATEGORIES).map(([key, label]) => {
          const count = counts[key] ?? 0
          const pct = Math.min(100, Math.round((count / TARGET) * 100))
          const colors = CAT_COLORS[key]
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${colors.text}`}>{key} {label}</span>
                <span className="text-xs text-slate-500">{count}/{TARGET}</span>
              </div>
              <div className={`h-2 rounded-full ${colors.bg}`}>
                <div
                  className={`h-2 rounded-full transition-all ${colors.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { QuestionVersion } from '../../types'

interface Props {
  versions: QuestionVersion[]
}

export default function VersionHistory({ versions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const sorted = [...versions].sort((a, b) => b.version - a.version)

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
        버전 이력이 없습니다
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {sorted.map(v => (
        <div key={v.id} className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded(expanded === v.id ? null : v.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">v{v.version}</span>
              <span className="text-sm text-slate-600">{v.title}</span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{v.response_type}</span>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(v.created_at).toLocaleString('ko-KR')}
            </span>
          </div>
          {expanded === v.id && v.snapshot && (
            <pre className="mt-3 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 overflow-x-auto max-h-64">
              {JSON.stringify(v.snapshot, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}

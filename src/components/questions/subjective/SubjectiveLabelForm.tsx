import { COMPLEXITIES, TASK_TYPES } from '../../../lib/constants'

interface Props {
  complexity: string
  taskType: string
  onChange: (key: string, value: string) => void
}

export default function SubjectiveLabelForm({ complexity, taskType, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">분류 (라벨링)</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">복잡도</label>
          <select
            value={complexity}
            onChange={e => onChange('complexity', e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">선택</option>
            {Object.entries(COMPLEXITIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">유형</label>
          <select
            value={taskType}
            onChange={e => onChange('task_type', e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">선택</option>
            {Object.entries(TASK_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

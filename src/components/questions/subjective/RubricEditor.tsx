interface Criterion {
  name: string
  description: string
  max_score: number
  sort_order: number
}

interface Props {
  title: string
  description: string
  criteria: Criterion[]
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onCriteriaChange: (c: Criterion[]) => void
}

export default function RubricEditor({ title, description, criteria, onTitleChange, onDescriptionChange, onCriteriaChange }: Props) {
  const setCriterion = (index: number, patch: Partial<Criterion>) => {
    onCriteriaChange(criteria.map((c, i) => i === index ? { ...c, ...patch } : c))
  }

  const addCriterion = () => {
    onCriteriaChange([...criteria, { name: '', description: '', max_score: 2, sort_order: criteria.length }])
  }

  const removeCriterion = (index: number) => {
    onCriteriaChange(criteria.filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i })))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">루브릭</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">루브릭 제목</label>
          <input
            type="text"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="예: AI 활용 프롬프트 작성 평가"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">설명</label>
          <textarea
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            placeholder="평가 기준 설명 (선택)"
          />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">평가 영역</p>
          <div className="space-y-2">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-slate-400 mt-2 w-4">{i + 1}.</span>
                <input
                  type="text"
                  value={c.name}
                  onChange={e => setCriterion(i, { name: e.target.value })}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="영역명"
                />
                <input
                  type="text"
                  value={c.description}
                  onChange={e => setCriterion(i, { description: e.target.value })}
                  className="flex-[2] border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="설명"
                />
                <input
                  type="number"
                  value={c.max_score}
                  onChange={e => setCriterion(i, { max_score: Number(e.target.value) })}
                  className="w-16 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min={0.5}
                  step={0.5}
                  title="만점"
                />
                <button
                  type="button"
                  onClick={() => removeCriterion(i)}
                  className="text-slate-400 hover:text-red-500 text-sm mt-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCriterion}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + 평가 영역 추가
          </button>
        </div>
      </div>
    </div>
  )
}

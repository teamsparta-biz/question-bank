interface Option {
  label: string
  is_correct: boolean
  sort_order: number
}

interface Props {
  options: Option[]
  responseType: string
  onChange: (options: Option[]) => void
}

export default function McqOptionEditor({ options, responseType, onChange }: Props) {
  const setOption = (index: number, patch: Partial<Option>) => {
    const next = options.map((o, i) => {
      if (i === index) return { ...o, ...patch }
      // 단일선택: 다른 옵션 정답 해제
      if (patch.is_correct && responseType === 'single_choice') {
        return { ...o, is_correct: false }
      }
      return o
    })
    onChange(next)
  }

  const addOption = () => {
    onChange([...options, { label: '', is_correct: false, sort_order: options.length }])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    onChange(options.filter((_, i) => i !== index).map((o, i) => ({ ...o, sort_order: i })))
  }

  const moveOption = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= options.length) return
    const next = [...options]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((o, i) => ({ ...o, sort_order: i })))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        선택지
        <span className="text-xs font-normal text-slate-400 ml-2">
          {responseType === 'single_choice' ? '정답 1개 선택' : '정답 복수 선택 가능'}
        </span>
      </h3>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveOption(i, -1)}
              disabled={i === 0}
              className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => moveOption(i, 1)}
              disabled={i === options.length - 1}
              className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs"
            >
              ▼
            </button>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type={responseType === 'single_choice' ? 'radio' : 'checkbox'}
                name="correct-option"
                checked={opt.is_correct}
                onChange={() => setOption(i, { is_correct: responseType === 'single_choice' ? true : !opt.is_correct })}
                className="accent-primary-600"
              />
              <span className="text-xs text-slate-500 w-5">{i + 1}.</span>
            </label>
            <input
              type="text"
              value={opt.label}
              onChange={e => setOption(i, { label: e.target.value })}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={`선택지 ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={options.length <= 2}
              className="text-slate-400 hover:text-red-500 disabled:opacity-30 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        + 선택지 추가
      </button>
    </div>
  )
}

import { ELEMENTS, ACTIVE_TIERS, type ElementTier } from '../../../lib/constants'

interface Props {
  complexity: string
  selected: string[]
  onChange: (elements: string[]) => void
}

export default function ElementMappingGrid({ complexity, selected, onChange }: Props) {
  const activeTiers: ElementTier[] = complexity ? (ACTIVE_TIERS[complexity] ?? []) : ['basic', 'standard', 'advanced']
  const dimensions = [...new Set(ELEMENTS.map(e => e.dimension))]

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const selectByComplexity = () => {
    if (!complexity) return
    const ids = ELEMENTS
      .filter(e => activeTiers.includes(e.tier as ElementTier))
      .map(e => e.id)
    onChange(ids)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Element 매핑
          <span className="text-xs font-normal text-slate-400 ml-2">
            {selected.length}/20개 선택
          </span>
        </h3>
        {complexity && (
          <button
            type="button"
            onClick={selectByComplexity}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            복잡도 기준 자동 선택
          </button>
        )}
      </div>

      <div className="space-y-4">
        {dimensions.map(dim => {
          const dimElements = ELEMENTS.filter(e => e.dimension === dim)
          return (
            <div key={dim}>
              <p className="text-xs font-medium text-slate-500 mb-1.5">{dim}</p>
              <div className="flex flex-wrap gap-1.5">
                {dimElements.map(el => {
                  const isActive = activeTiers.includes(el.tier as ElementTier)
                  const isSelected = selected.includes(el.id)
                  return (
                    <button
                      key={el.id}
                      type="button"
                      disabled={!isActive && !!complexity}
                      onClick={() => toggle(el.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-primary-50 border-primary-300 text-primary-700'
                          : isActive || !complexity
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'border-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                      title={`${el.id} ${el.name} (${el.tier})`}
                    >
                      {el.id} {el.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

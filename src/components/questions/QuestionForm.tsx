import { useState } from 'react'
import { ELEMENTS, ACTIVE_TIERS, type ElementTier } from '../../lib/constants'
import McqOptionEditor from './mcq/McqOptionEditor'
import LabelForm from './LabelForm'
import ElementMappingGrid from './subjective/ElementMappingGrid'
import RubricEditor from './subjective/RubricEditor'
import type { QuestionFormData } from '../../types'

const EMPTY_FORM: QuestionFormData = {
  response_type: 'single_choice',
  title: '',
  description: '',
  is_active: true,
  options: [
    { label: '', is_correct: false, sort_order: 0 },
    { label: '', is_correct: false, sort_order: 1 },
    { label: '', is_correct: false, sort_order: 2 },
    { label: '', is_correct: false, sort_order: 3 },
  ],
  category: '',
  industry: '',
  position: '',
  topic_id: '',
  difficulty: '',
  complexity: '',
  task_type: '',
  elements: [],
  rubric_title: '',
  rubric_description: '',
  criteria: [],
}

interface Props {
  initialData?: QuestionFormData
  onSave: (data: QuestionFormData) => void
  saving: boolean
}

export default function QuestionForm({ initialData, onSave, saving }: Props) {
  const [form, setForm] = useState<QuestionFormData>(initialData ?? EMPTY_FORM)

  const set = <K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // 복잡도 변경 시 Element 자동 매핑
      if (key === 'complexity' && typeof value === 'string' && value) {
        const tiers = ACTIVE_TIERS[value] ?? []
        next.elements = ELEMENTS
          .filter(e => tiers.includes(e.tier as ElementTier))
          .map(e => e.id)
      }
      return next
    })
  }

  const isSubjective = form.response_type === 'text'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      alert('제목을 입력하세요')
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 유형 선택 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">문항 유형</h3>
        <div className="flex gap-2">
          {[
            { value: 'single_choice', label: '단일 선택' },
            { value: 'multiple_choice', label: '복수 선택' },
            { value: 'text', label: '주관식' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('response_type', opt.value as QuestionFormData['response_type'])}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.response_type === opt.value
                  ? opt.value === 'text'
                    ? 'bg-teal-50 border-teal-300 text-teal-700'
                    : 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-slate-300 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">기본 정보</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={isSubjective ? '과제 시나리오 제목' : '문항 제목 (질문)'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">설명 / 지문</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              placeholder={isSubjective ? '과제 상황 설명' : '지문이나 시나리오 (선택)'}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-600">활성 상태</span>
          </label>
        </div>
      </div>

      {/* MCQ: 선택지 */}
      {!isSubjective && (
        <McqOptionEditor
          options={form.options}
          responseType={form.response_type}
          onChange={opts => set('options', opts)}
        />
      )}

      {/* 분류 */}
      <LabelForm
        isSubjective={isSubjective}
        category={form.category}
        industry={form.industry}
        position={form.position}
        topicId={form.topic_id}
        difficulty={form.difficulty}
        complexity={form.complexity}
        onChange={(key, value) => set(key as keyof QuestionFormData, value)}
      />

      {/* 주관식: Element 매핑 */}
      {isSubjective && (
        <ElementMappingGrid
          complexity=""
          selected={form.elements}
          onChange={els => set('elements', els)}
        />
      )}

      {/* 주관식: 루브릭 */}
      {isSubjective && (
        <RubricEditor
          title={form.rubric_title}
          description={form.rubric_description}
          criteria={form.criteria}
          onTitleChange={v => set('rubric_title', v)}
          onDescriptionChange={v => set('rubric_description', v)}
          onCriteriaChange={c => set('criteria', c)}
        />
      )}

      {/* 저장 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}

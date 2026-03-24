import { useState } from 'react'
import McqOptionEditor from './mcq/McqOptionEditor'
import LabelForm from './LabelForm'
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
  industry: '공통',
  position: '공통',
  topic_id: '',
  difficulty: '',
}

interface Props {
  initialData?: QuestionFormData
  onSave: (data: QuestionFormData) => void
  saving: boolean
}

export default function QuestionForm({ initialData, onSave, saving }: Props) {
  const [form, setForm] = useState<QuestionFormData>(initialData ?? EMPTY_FORM)

  const set = <K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

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
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('response_type', opt.value as QuestionFormData['response_type'])}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.response_type === opt.value
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
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
              placeholder="문항 제목 (질문)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">설명 / 지문</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              placeholder="지문이나 시나리오 (선택)"
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

      {/* 선택지 */}
      <McqOptionEditor
        options={form.options}
        responseType={form.response_type}
        onChange={opts => set('options', opts)}
      />

      {/* 분류 */}
      <LabelForm
        category={form.category}
        topicId={form.topic_id}
        onChange={(key, value) => set(key as keyof QuestionFormData, value)}
      />

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

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import McqOptionEditor from './mcq/McqOptionEditor'
import McqLabelForm from './mcq/McqLabelForm'
import SubjectiveLabelForm from './subjective/SubjectiveLabelForm'
import ElementMappingGrid from './subjective/ElementMappingGrid'
import RubricEditor from './subjective/RubricEditor'
import type { QuestionFormData, Topic } from '../../types'

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
  question_type: 'mcq',
  domain: '',
  cognitive_level: '',
  question_format: '',
  topic_code: '',
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
  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    supabase.from('topic').select('*').order('domain').order('sort_order')
      .then(({ data }) => setTopics((data ?? []) as Topic[]))
  }, [])

  const set = <K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleTypeToggle = (qt: 'mcq' | 'subjective') => {
    set('question_type', qt)
    if (qt === 'mcq') {
      set('response_type', 'single_choice')
    } else {
      set('response_type', 'text')
    }
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
      {/* 타입 선택 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">문항 유형</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeToggle('mcq')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.question_type === 'mcq'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'border-slate-300 text-slate-500 hover:bg-slate-50'
            }`}
          >
            객관식
          </button>
          <button
            type="button"
            onClick={() => handleTypeToggle('subjective')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.question_type === 'subjective'
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'border-slate-300 text-slate-500 hover:bg-slate-50'
            }`}
          >
            주관식
          </button>
        </div>

        {form.question_type === 'mcq' && (
          <div className="mt-3">
            <label className="text-xs font-medium text-slate-500">응답 방식</label>
            <select
              value={form.response_type}
              onChange={e => set('response_type', e.target.value as QuestionFormData['response_type'])}
              className="ml-2 text-sm border border-slate-300 rounded-lg px-3 py-1.5"
            >
              <option value="single_choice">단일 선택</option>
              <option value="multiple_choice">복수 선택</option>
            </select>
          </div>
        )}
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
              placeholder={form.question_type === 'mcq' ? '문항 제목 (질문)' : '과제 시나리오 제목'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">설명 / 지문</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              placeholder={form.question_type === 'mcq' ? '지문이나 시나리오 (선택)' : '과제 상황 설명'}
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
      {form.question_type === 'mcq' && (
        <McqOptionEditor
          options={form.options}
          responseType={form.response_type}
          onChange={opts => set('options', opts)}
        />
      )}

      {/* 라벨링 */}
      {form.question_type === 'mcq' ? (
        <McqLabelForm
          domain={form.domain}
          cognitiveLevel={form.cognitive_level}
          questionFormat={form.question_format}
          topicCode={form.topic_code}
          topics={topics}
          onChange={(key, value) => set(key as keyof QuestionFormData, value)}
        />
      ) : (
        <SubjectiveLabelForm
          complexity={form.complexity}
          taskType={form.task_type}
          onChange={(key, value) => set(key as keyof QuestionFormData, value)}
        />
      )}

      {/* 주관식: Element 매핑 */}
      {form.question_type === 'subjective' && (
        <ElementMappingGrid
          complexity={form.complexity}
          selected={form.elements}
          onChange={els => set('elements', els)}
        />
      )}

      {/* 주관식: 루브릭 */}
      {form.question_type === 'subjective' && (
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

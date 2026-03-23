import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionForm from '../components/questions/QuestionForm'
import { createQuestion } from '../hooks/useQuestions'
import type { QuestionFormData } from '../types'

export default function QuestionNewPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const handleSave = async (data: QuestionFormData) => {
    setSaving(true)
    try {
      const id = await createQuestion({
        response_type: data.response_type,
        title: data.title,
        description: data.description,
        is_active: data.is_active,
        options: data.question_type === 'mcq' ? data.options : undefined,
        label: {
          question_type: data.question_type,
          domain: data.domain || undefined,
          cognitive_level: data.cognitive_level || undefined,
          question_format: data.question_format || undefined,
          topic_code: data.topic_code || undefined,
          complexity: data.complexity || undefined,
          task_type: data.task_type || undefined,
        },
        elements: data.question_type === 'subjective' ? data.elements : undefined,
        rubric: data.question_type === 'subjective' && data.rubric_title ? {
          title: data.rubric_title,
          description: data.rubric_description,
          criteria: data.criteria,
        } : undefined,
      })
      navigate(`/questions/${id}`)
    } catch (err) {
      console.error(err)
      alert('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-4">새 문항</h2>
      <QuestionForm onSave={handleSave} saving={saving} />
    </div>
  )
}

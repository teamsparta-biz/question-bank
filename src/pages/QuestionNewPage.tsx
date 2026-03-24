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
        options: data.options,
        label: {
          category: data.category || undefined,
          industry: '공통',
          position: '공통',
          topic_id: data.topic_id || undefined,
          difficulty: data.difficulty || undefined,
        },
      })
      navigate(`/questions/${id}`)
    } catch (err) {
      console.error(err)
      alert('저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
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

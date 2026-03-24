import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuestionDetail, updateQuestion } from '../hooks/useQuestions'
import QuestionForm from '../components/questions/QuestionForm'
import VersionHistory from '../components/questions/VersionHistory'
import type { QuestionFormData } from '../types'

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { question, loading, refetch } = useQuestionDetail(id)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'edit' | 'history'>('edit')

  if (loading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>
  if (!question) return <div className="p-8 text-center text-slate-400">문항을 찾을 수 없습니다</div>

  const label = question.question_label

  const initialData: QuestionFormData = {
    response_type: question.response_type,
    title: question.title,
    description: question.description ?? '',
    is_active: question.is_active,
    options: (question.question_option ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(o => ({ label: o.label, is_correct: o.is_correct, sort_order: o.sort_order })),
    category: label?.category ?? '',
    industry: label?.industry ?? '공통',
    position: label?.position ?? '공통',
    topic_id: label?.topic_id ?? '',
    difficulty: label?.difficulty ?? '',
  }

  const handleSave = async (data: QuestionFormData) => {
    setSaving(true)
    try {
      await updateQuestion(question.id, question.current_version, {
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
      await refetch()
      alert('저장 완료')
    } catch (err) {
      console.error(err)
      alert('저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/questions')} className="text-slate-400 hover:text-slate-600">&larr;</button>
          <h2 className="text-lg font-bold text-slate-900">문항 수정</h2>
          <span className="text-sm text-slate-400">v{question.current_version}</span>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab('edit')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${tab === 'edit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            편집
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${tab === 'history' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            버전 이력
          </button>
        </div>
      </div>

      {tab === 'edit' ? (
        <QuestionForm initialData={initialData} onSave={handleSave} saving={saving} />
      ) : (
        <VersionHistory versions={question.question_version ?? []} />
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { QuestionWithLabel, QuestionDetail, QuestionFilters } from '../types'

const PAGE_SIZE = 20

export function useQuestions(filters: QuestionFilters, page: number) {
  const [questions, setQuestions] = useState<QuestionWithLabel[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('question')
      .select('*, question_label(*)', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters.is_active && filters.is_active !== 'all') {
      query = query.eq('is_active', filters.is_active === 'true')
    }
    if (filters.question_type === 'mcq') {
      query = query.in('response_type', ['single_choice', 'multiple_choice'])
    } else if (filters.question_type === 'subjective') {
      query = query.eq('response_type', 'text')
    }
    if (filters.category) {
      query = query.eq('question_label.category', filters.category)
    }
    if (filters.industry) {
      query = query.eq('question_label.industry', filters.industry)
    }
    if (filters.position) {
      query = query.eq('question_label.position', filters.position)
    }
    if (filters.difficulty) {
      query = query.eq('question_label.difficulty', filters.difficulty)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Failed to fetch questions:', error)
    } else {
      setQuestions((data ?? []) as QuestionWithLabel[])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [filters, page])

  useEffect(() => { fetch() }, [fetch])

  return { questions, total, loading, pageSize: PAGE_SIZE, refetch: fetch }
}

export function useQuestionDetail(id: string | undefined) {
  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)

    const { data, error } = await supabase
      .from('question')
      .select(`
        *,
        question_label(*),
        question_option(*),
        rubric(*, rubric_criterion(*)),
        element_mapping(*),
        question_version(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch question detail:', error)
    } else {
      const q = data as Record<string, unknown>
      if (Array.isArray(q.rubric)) q.rubric = q.rubric[0] ?? null
      if (Array.isArray(q.question_label)) q.question_label = q.question_label[0] ?? null
      setQuestion(q as unknown as QuestionDetail)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  return { question, loading, refetch: fetch }
}

export async function createQuestion(data: {
  response_type: string
  title: string
  description: string
  is_active: boolean
  options?: { label: string; is_correct: boolean; sort_order: number }[]
  label: {
    category?: string
    industry?: string
    position?: string
    topic_id?: string
    difficulty?: string
  }
  elements?: string[]
  rubric?: {
    title: string
    description: string
    criteria: { name: string; description: string; max_score: number; sort_order: number }[]
  }
}) {
  const { data: q, error: qErr } = await supabase
    .from('question')
    .insert({
      response_type: data.response_type,
      title: data.title,
      description: data.description || null,
      is_active: data.is_active,
    })
    .select()
    .single()

  if (qErr || !q) throw qErr ?? new Error('Failed to create question')
  const questionId = q.id

  await supabase.from('question_label').insert({
    question_id: questionId,
    category: data.label.category || null,
    industry: data.label.industry || null,
    position: data.label.position || null,
    topic_id: data.label.topic_id || null,
    difficulty: data.label.difficulty || null,
  })

  await supabase.from('question_version').insert({
    question_id: questionId,
    version: 1,
    title: data.title,
    description: data.description || null,
    response_type: data.response_type,
    snapshot: { options: data.options, label: data.label, elements: data.elements, rubric: data.rubric },
  })

  if (data.options && data.options.length > 0) {
    await supabase.from('question_option').insert(
      data.options.map(o => ({ ...o, question_id: questionId }))
    )
  }

  if (data.rubric) {
    const { data: r } = await supabase
      .from('rubric')
      .insert({ question_id: questionId, title: data.rubric.title, description: data.rubric.description || null })
      .select()
      .single()
    if (r && data.rubric.criteria.length > 0) {
      await supabase.from('rubric_criterion').insert(
        data.rubric.criteria.map(c => ({ ...c, rubric_id: r.id }))
      )
    }
  }

  if (data.elements && data.elements.length > 0) {
    await supabase.from('element_mapping').insert(
      data.elements.map(eid => ({ question_id: questionId, element_id: eid, is_active: true }))
    )
  }

  return questionId
}

export async function updateQuestion(
  questionId: string,
  currentVersion: number,
  data: Parameters<typeof createQuestion>[0]
) {
  const newVersion = currentVersion + 1

  await supabase.from('question').update({
    response_type: data.response_type,
    title: data.title,
    description: data.description || null,
    is_active: data.is_active,
    current_version: newVersion,
  }).eq('id', questionId)

  await supabase.from('question_version').insert({
    question_id: questionId,
    version: newVersion,
    title: data.title,
    description: data.description || null,
    response_type: data.response_type,
    snapshot: { options: data.options, label: data.label, elements: data.elements, rubric: data.rubric },
  })

  const { data: existingLabel } = await supabase
    .from('question_label').select('id').eq('question_id', questionId).single()

  if (existingLabel) {
    await supabase.from('question_label').update({
      category: data.label.category || null,
      industry: data.label.industry || null,
      position: data.label.position || null,
      topic_id: data.label.topic_id || null,
      difficulty: data.label.difficulty || null,
    }).eq('id', existingLabel.id)
  } else {
    await supabase.from('question_label').insert({
      question_id: questionId,
      ...data.label,
    })
  }

  await supabase.from('question_option').delete().eq('question_id', questionId)
  if (data.options && data.options.length > 0) {
    await supabase.from('question_option').insert(
      data.options.map(o => ({ ...o, question_id: questionId }))
    )
  }

  await supabase.from('rubric').delete().eq('question_id', questionId)
  if (data.rubric) {
    const { data: r } = await supabase
      .from('rubric')
      .insert({ question_id: questionId, title: data.rubric.title, description: data.rubric.description || null })
      .select()
      .single()
    if (r && data.rubric.criteria.length > 0) {
      await supabase.from('rubric_criterion').insert(
        data.rubric.criteria.map(c => ({ ...c, rubric_id: r.id }))
      )
    }
  }

  await supabase.from('element_mapping').delete().eq('question_id', questionId)
  if (data.elements && data.elements.length > 0) {
    await supabase.from('element_mapping').insert(
      data.elements.map(eid => ({ question_id: questionId, element_id: eid, is_active: true }))
    )
  }
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { QuestionWithLabel, QuestionDetail, QuestionFilters } from '../types'

const PAGE_SIZE = 20

// 에러를 throw하는 헬퍼
function check<T>(result: { data: T; error: unknown }, context: string): T {
  if (result.error) {
    throw new Error(`${context}: ${(result.error as { message?: string }).message ?? '알 수 없는 오류'}`)
  }
  return result.data
}

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
    if (filters.complexity) {
      query = query.eq('question_label.complexity', filters.complexity)
    }
    if (filters.task_type) {
      query = query.eq('question_label.task_type', filters.task_type)
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
    complexity?: string
    task_type?: string
  }
  elements?: string[]
  rubric?: {
    title: string
    description: string
    criteria: { name: string; description: string; max_score: number; sort_order: number }[]
  }
}) {
  // 1. question 생성
  const q = check(
    await supabase.from('question').insert({
      response_type: data.response_type,
      title: data.title,
      description: data.description || null,
      is_active: data.is_active,
    }).select().single(),
    '문항 생성'
  )
  const questionId = q.id

  try {
    // 2. label
    check(
      await supabase.from('question_label').insert({
        question_id: questionId,
        category: data.label.category || null,
        industry: data.label.industry || null,
        position: data.label.position || null,
        topic_id: data.label.topic_id || null,
        difficulty: data.label.difficulty || null,
        complexity: data.label.complexity || null,
        task_type: data.label.task_type || null,
      }),
      '라벨 생성'
    )

    // 3. version
    check(
      await supabase.from('question_version').insert({
        question_id: questionId,
        version: 1,
        title: data.title,
        description: data.description || null,
        response_type: data.response_type,
        snapshot: { options: data.options, label: data.label, elements: data.elements, rubric: data.rubric },
      }),
      '버전 생성'
    )

    // 4. options (MCQ)
    if (data.options && data.options.length > 0) {
      check(
        await supabase.from('question_option').insert(
          data.options.map(o => ({ ...o, question_id: questionId }))
        ),
        '선택지 생성'
      )
    }

    // 5. rubric (주관식)
    if (data.rubric) {
      const r = check(
        await supabase.from('rubric').insert({
          question_id: questionId,
          title: data.rubric.title,
          description: data.rubric.description || null,
        }).select().single(),
        '루브릭 생성'
      )
      if (data.rubric.criteria.length > 0) {
        check(
          await supabase.from('rubric_criterion').insert(
            data.rubric.criteria.map(c => ({ ...c, rubric_id: r.id }))
          ),
          '루브릭 기준 생성'
        )
      }
    }

    // 6. elements (주관식)
    if (data.elements && data.elements.length > 0) {
      check(
        await supabase.from('element_mapping').insert(
          data.elements.map(eid => ({ question_id: questionId, element_id: eid, is_active: true }))
        ),
        'Element 매핑 생성'
      )
    }

    return questionId
  } catch (err) {
    // 실패 시 생성된 문항 삭제 (CASCADE로 하위 데이터 정리됨)
    await supabase.from('question').delete().eq('id', questionId)
    throw err
  }
}

export async function updateQuestion(
  questionId: string,
  currentVersion: number,
  data: Parameters<typeof createQuestion>[0]
) {
  const newVersion = currentVersion + 1
  const errors: string[] = []

  // 1. question 업데이트
  const qResult = await supabase.from('question').update({
    response_type: data.response_type,
    title: data.title,
    description: data.description || null,
    is_active: data.is_active,
    current_version: newVersion,
  }).eq('id', questionId)
  if (qResult.error) errors.push('문항 업데이트: ' + qResult.error.message)

  // 2. version (새 버전은 항상 추가, 실패해도 계속)
  const vResult = await supabase.from('question_version').insert({
    question_id: questionId,
    version: newVersion,
    title: data.title,
    description: data.description || null,
    response_type: data.response_type,
    snapshot: { options: data.options, label: data.label, elements: data.elements, rubric: data.rubric },
  })
  if (vResult.error) errors.push('버전 생성: ' + vResult.error.message)

  // 3. label upsert
  const { data: existingLabel } = await supabase
    .from('question_label').select('id').eq('question_id', questionId).maybeSingle()

  const labelData = {
    category: data.label.category || null,
    industry: data.label.industry || null,
    position: data.label.position || null,
    topic_id: data.label.topic_id || null,
    difficulty: data.label.difficulty || null,
    complexity: data.label.complexity || null,
    task_type: data.label.task_type || null,
  }

  if (existingLabel) {
    const lResult = await supabase.from('question_label').update(labelData).eq('id', existingLabel.id)
    if (lResult.error) errors.push('라벨 업데이트: ' + lResult.error.message)
  } else {
    const lResult = await supabase.from('question_label').insert({ question_id: questionId, ...labelData })
    if (lResult.error) errors.push('라벨 생성: ' + lResult.error.message)
  }

  // 4. options — 삭제 후 재삽입
  const delOpt = await supabase.from('question_option').delete().eq('question_id', questionId)
  if (delOpt.error) errors.push('선택지 삭제: ' + delOpt.error.message)

  if (data.options && data.options.length > 0) {
    const insOpt = await supabase.from('question_option').insert(
      data.options.map(o => ({ ...o, question_id: questionId }))
    )
    if (insOpt.error) errors.push('선택지 생성: ' + insOpt.error.message)
  }

  // 5. elements — 삭제 후 재삽입
  const delEl = await supabase.from('element_mapping').delete().eq('question_id', questionId)
  if (delEl.error) errors.push('Element 삭제: ' + delEl.error.message)

  if (data.elements && data.elements.length > 0) {
    const insEl = await supabase.from('element_mapping').insert(
      data.elements.map(eid => ({ question_id: questionId, element_id: eid, is_active: true }))
    )
    if (insEl.error) errors.push('Element 생성: ' + insEl.error.message)
  }

  // 에러가 있으면 모아서 throw
  if (errors.length > 0) {
    throw new Error('일부 항목 저장 실패:\n' + errors.join('\n'))
  }
}

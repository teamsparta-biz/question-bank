import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { QuestionDetail, QuestionFeedback } from '../types'

// ---- 다음 미피드백 문항 조회 ----

interface Progress { done: number; total: number }

export function useNextQuestion(reviewer: string) {
  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!reviewer) return
    setLoading(true)

    // 1. 전체 활성 문항 수
    const { count: totalCount } = await supabase
      .from('question')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    // 2. 이 reviewer가 피드백한 question_id 목록
    const { data: doneRows } = await supabase
      .from('question_feedback')
      .select('question_id')
      .eq('reviewer', reviewer)

    const doneIds = (doneRows ?? []).map(r => r.question_id)
    const doneCount = doneIds.length
    const total = totalCount ?? 0

    setProgress({ done: doneCount, total })

    // 3. 미피드백 문항 1개 조회
    let query = supabase
      .from('question')
      .select('*, question_label(*), question_option(*), question_version(*)')
      .eq('is_active', true)
      .order('created_at')
      .limit(1)

    if (doneIds.length > 0) {
      query = query.not('id', 'in', `(${doneIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch next question:', error)
      setQuestion(null)
    } else if (data && data.length > 0) {
      const q = data[0] as Record<string, unknown>
      if (Array.isArray(q.question_label)) q.question_label = q.question_label[0] ?? null
      setQuestion(q as unknown as QuestionDetail)
    } else {
      setQuestion(null)
    }

    setLoading(false)
  }, [reviewer])

  useEffect(() => { fetch() }, [fetch])

  return { question, progress, loading, refetch: fetch }
}

// ---- 직전 피드백 철회 ----

export async function undoLastFeedback(reviewer: string): Promise<string | null> {
  // 가장 최근 피드백 1건 조회
  const { data } = await supabase
    .from('question_feedback')
    .select('id, question_id')
    .eq('reviewer', reviewer)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) return null

  const feedbackId = data[0].id
  const questionId = data[0].question_id

  const { error } = await supabase
    .from('question_feedback')
    .delete()
    .eq('id', feedbackId)

  if (error) throw new Error(`피드백 철회 실패: ${error.message}`)

  return questionId
}

// ---- 피드백 제출 ----

export async function submitFeedback(data: {
  question_id: string
  reviewer: string
  vote: 'up' | 'down' | 'skip'
  comment?: string
}) {
  const { error } = await supabase.from('question_feedback').insert({
    question_id: data.question_id,
    reviewer: data.reviewer,
    vote: data.vote,
    comment: data.comment || null,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('이미 피드백한 문항입니다.')
    }
    throw new Error(`피드백 저장 실패: ${error.message}`)
  }
}

// ---- 대시보드 집계 ----

interface QuestionStat {
  question_id: string
  title: string
  category: string | null
  up: number
  down: number
  skip: number
  total: number
  comments: string[]
}

interface ReviewerStat {
  reviewer: string
  done: number
}

export function useFeedbackDashboard(categoryFilter?: string) {
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([])
  const [reviewerStats, setReviewerStats] = useState<ReviewerStat[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    // 1. 전체 활성 문항 + 라벨
    const labelJoin = categoryFilter ? 'question_label!inner(category)' : 'question_label(category)'
    let qQuery = supabase
      .from('question')
      .select(`id, title, ${labelJoin}`)
      .eq('is_active', true)
      .order('created_at')

    if (categoryFilter) {
      qQuery = qQuery.eq('question_label.category', categoryFilter)
    }

    const { data: questions } = await qQuery

    // 2. 전체 피드백
    const { data: feedbacks } = await supabase
      .from('question_feedback')
      .select('*')

    const allQuestions = (questions ?? []) as Array<{
      id: string
      title: string
      question_label: { category: string } | Array<{ category: string }> | null
    }>
    const allFeedbacks = (feedbacks ?? []) as QuestionFeedback[]

    setTotalQuestions(allQuestions.length)

    // 3. 문항별 집계
    const statsMap = new Map<string, QuestionStat>()
    for (const q of allQuestions) {
      const label = Array.isArray(q.question_label) ? q.question_label[0] : q.question_label
      statsMap.set(q.id, {
        question_id: q.id,
        title: q.title,
        category: label?.category ?? null,
        up: 0, down: 0, skip: 0, total: 0,
        comments: [],
      })
    }

    for (const fb of allFeedbacks) {
      const stat = statsMap.get(fb.question_id)
      if (!stat) continue
      if (fb.vote === 'up') stat.up++
      else if (fb.vote === 'down') stat.down++
      else if (fb.vote === 'skip') stat.skip++
      stat.total++
      if (fb.comment) stat.comments.push(`${fb.reviewer}: ${fb.comment}`)
    }

    setQuestionStats(Array.from(statsMap.values()))

    // 4. 작업자별 진행률
    const reviewerMap = new Map<string, number>()
    for (const fb of allFeedbacks) {
      reviewerMap.set(fb.reviewer, (reviewerMap.get(fb.reviewer) ?? 0) + 1)
    }
    setReviewerStats(
      Array.from(reviewerMap.entries())
        .map(([reviewer, done]) => ({ reviewer, done }))
        .sort((a, b) => b.done - a.done)
    )

    setLoading(false)
  }, [categoryFilter])

  useEffect(() => { fetch() }, [fetch])

  return { questionStats, reviewerStats, totalQuestions, loading, refetch: fetch }
}

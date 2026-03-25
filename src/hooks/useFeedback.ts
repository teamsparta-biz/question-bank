import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { QuestionDetail, QuestionFeedback, QuestionLabel } from '../types'

// ---- 전체 문항 + 내 피드백 목록 (사이드바용) ----

export interface QuestionSummary {
  id: string
  title: string
  category: string | null
  vote: 'up' | 'down' | 'skip' | null // null = 미피드백
}

export function useFeedbackList(reviewer: string) {
  const [items, setItems] = useState<QuestionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!reviewer) return
    setLoading(true)

    const [qRes, fbRes] = await Promise.all([
      supabase.from('question').select('id, title, question_label(category)').eq('is_active', true).order('created_at'),
      supabase.from('question_feedback').select('question_id, vote').eq('reviewer', reviewer),
    ])

    const questions = (qRes.data ?? []) as Array<{ id: string; title: string; question_label: QuestionLabel | QuestionLabel[] | null }>
    const feedbacks = (fbRes.data ?? []) as Array<{ question_id: string; vote: string }>
    const fbMap = new Map(feedbacks.map(f => [f.question_id, f.vote as QuestionFeedback['vote']]))

    setItems(questions.map(q => {
      const label = Array.isArray(q.question_label) ? q.question_label[0] : q.question_label
      return {
        id: q.id,
        title: q.title,
        category: label?.category ?? null,
        vote: fbMap.get(q.id) ?? null,
      }
    }))

    setLoading(false)
  }, [reviewer])

  useEffect(() => { fetch() }, [fetch])

  return { items, loading, refetch: fetch }
}

// ---- 특정 문항 상세 조회 ----

export function useQuestionById(questionId: string | null) {
  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!questionId) { setQuestion(null); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('question')
      .select('*, question_label(*), question_option(*), question_version(*)')
      .eq('id', questionId)
      .single()

    if (error) {
      setQuestion(null)
    } else {
      const q = data as Record<string, unknown>
      if (Array.isArray(q.question_label)) q.question_label = q.question_label[0] ?? null
      setQuestion(q as unknown as QuestionDetail)
    }
    setLoading(false)
  }, [questionId])

  useEffect(() => { fetch() }, [fetch])

  return { question, loading }
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

// ---- 피드백 삭제 (재투표용) ----

export async function deleteFeedback(questionId: string, reviewer: string) {
  const { error } = await supabase
    .from('question_feedback')
    .delete()
    .eq('question_id', questionId)
    .eq('reviewer', reviewer)

  if (error) throw new Error(`피드백 삭제 실패: ${error.message}`)
}

// ---- 대시보드 집계 ----

export interface QuestionStat {
  question_id: string
  title: string
  category: string | null
  up: number
  down: number
  skip: number
  total: number
  feedbacks: Array<{ reviewer: string; vote: string; comment: string | null }>
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

    const labelJoin = categoryFilter ? 'question_label!inner(category)' : 'question_label(category)'
    let qQuery = supabase
      .from('question')
      .select(`id, title, ${labelJoin}`)
      .eq('is_active', true)
      .order('created_at')

    if (categoryFilter) {
      qQuery = qQuery.eq('question_label.category', categoryFilter)
    }

    const [qRes, fbRes] = await Promise.all([
      qQuery,
      supabase.from('question_feedback').select('*'),
    ])

    const allQuestions = (qRes.data ?? []) as Array<{
      id: string; title: string
      question_label: { category: string } | Array<{ category: string }> | null
    }>
    const allFeedbacks = (fbRes.data ?? []) as QuestionFeedback[]

    setTotalQuestions(allQuestions.length)

    const statsMap = new Map<string, QuestionStat>()
    for (const q of allQuestions) {
      const label = Array.isArray(q.question_label) ? q.question_label[0] : q.question_label
      statsMap.set(q.id, {
        question_id: q.id,
        title: q.title,
        category: label?.category ?? null,
        up: 0, down: 0, skip: 0, total: 0,
        feedbacks: [],
      })
    }

    for (const fb of allFeedbacks) {
      const stat = statsMap.get(fb.question_id)
      if (!stat) continue
      if (fb.vote === 'up') stat.up++
      else if (fb.vote === 'down') stat.down++
      else if (fb.vote === 'skip') stat.skip++
      stat.total++
      stat.feedbacks.push({ reviewer: fb.reviewer, vote: fb.vote, comment: fb.comment })
    }

    setQuestionStats(Array.from(statsMap.values()))

    // 작업자별 진행률 (패스 제외)
    const reviewerMap = new Map<string, number>()
    for (const fb of allFeedbacks) {
      if (fb.vote !== 'skip') {
        reviewerMap.set(fb.reviewer, (reviewerMap.get(fb.reviewer) ?? 0) + 1)
      }
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

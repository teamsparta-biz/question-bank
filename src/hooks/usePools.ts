import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { QuestionPool, PoolQuestion, QuestionWithLabel } from '../types'

export function usePools() {
  const [pools, setPools] = useState<(QuestionPool & { question_count: number })[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('question_pool')
      .select('*, pool_question(count)')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch pools:', error)
    } else {
      const mapped = (data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        question_count: Array.isArray(p.pool_question) && p.pool_question.length > 0
          ? (p.pool_question[0] as { count: number }).count
          : 0,
      }))
      setPools(mapped as (QuestionPool & { question_count: number })[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { pools, loading, refetch: fetch }
}

export function usePoolDetail(poolId: string | undefined) {
  const [pool, setPool] = useState<QuestionPool | null>(null)
  const [questions, setQuestions] = useState<(PoolQuestion & { question: QuestionWithLabel })[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!poolId) return
    setLoading(true)

    const [poolRes, pqRes] = await Promise.all([
      supabase.from('question_pool').select('*').eq('id', poolId).single(),
      supabase
        .from('pool_question')
        .select('*, question(*, question_label(*))')
        .eq('pool_id', poolId)
        .order('sort_order'),
    ])

    if (poolRes.data) setPool(poolRes.data as QuestionPool)
    if (pqRes.data) setQuestions(pqRes.data as (PoolQuestion & { question: QuestionWithLabel })[])
    setLoading(false)
  }, [poolId])

  useEffect(() => { fetch() }, [fetch])

  return { pool, questions, loading, refetch: fetch }
}

export async function createPool(name: string, description: string) {
  const { data, error } = await supabase
    .from('question_pool')
    .insert({ name, description: description || null })
    .select()
    .single()
  if (error) throw error
  return data as QuestionPool
}

export async function addQuestionToPool(poolId: string, questionId: string, sortOrder: number) {
  const { error } = await supabase.from('pool_question').insert({
    pool_id: poolId,
    question_id: questionId,
    sort_order: sortOrder,
  })
  if (error) throw error
}

export async function removeQuestionFromPool(poolId: string, questionId: string) {
  const { error } = await supabase
    .from('pool_question')
    .delete()
    .eq('pool_id', poolId)
    .eq('question_id', questionId)
  if (error) throw error
}

export async function swapPoolQuestionOrder(idA: string, orderA: number, idB: string, orderB: number) {
  const [resA, resB] = await Promise.all([
    supabase.from('pool_question').update({ sort_order: orderB }).eq('id', idA),
    supabase.from('pool_question').update({ sort_order: orderA }).eq('id', idB),
  ])
  if (resA.error) throw resA.error
  if (resB.error) throw resB.error
}

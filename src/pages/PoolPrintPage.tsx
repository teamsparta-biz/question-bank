import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { QuestionPool, QuestionOption, QuestionLabel } from '../types'

interface PoolQuestionJoined {
  id: string
  question_id: string
  sort_order: number
  question: {
    id: string
    response_type: string
    title: string
    description: string | null
    question_label: QuestionLabel | QuestionLabel[] | null
    question_option: QuestionOption[]
  }
}

function getLabel(q: PoolQuestionJoined['question']): QuestionLabel | null {
  if (!q.question_label) return null
  if (Array.isArray(q.question_label)) return q.question_label[0] ?? null
  return q.question_label
}

const CAT_LABELS: Record<string, string> = { P: '프롬프트 리터러시', E: '윤리/보안', D: '데이터 리터러시', W: '워크플로우 설계' }

export default function PoolPrintPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const printRef = useRef<HTMLDivElement>(null)
  const [pool, setPool] = useState<QuestionPool | null>(null)
  const [questions, setQuestions] = useState<PoolQuestionJoined[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const [poolRes, pqRes] = await Promise.all([
        supabase.from('question_pool').select('*').eq('id', id).single(),
        supabase
          .from('pool_question')
          .select('*, question(*, question_label(*), question_option(*))')
          .eq('pool_id', id)
          .order('sort_order'),
      ])
      if (poolRes.data) setPool(poolRes.data as QuestionPool)
      if (pqRes.data) setQuestions(pqRes.data as PoolQuestionJoined[])
      setLoading(false)
    })()
  }, [id])

  const handleExport = async () => {
    if (!printRef.current) return
    setExporting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = (await import('html2pdf.js')).default as any
      await html2pdf().set({
        margin: [12, 16, 12, 16],
        filename: `${pool?.name ?? 'question-pool'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      }).from(printRef.current).save()
    } catch (err) {
      console.error(err)
      alert('PDF 생성 실패')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">불러오는 중...</div>
  if (!pool) return <div className="p-8 text-center text-slate-400">문항풀을 찾을 수 없습니다</div>

  // 카테고리별 그룹
  const byCategory: Record<string, PoolQuestionJoined[]> = {}
  questions.forEach(pq => {
    const label = getLabel(pq.question)
    const cat = label?.category ?? '미분류'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(pq)
  })

  const categoryOrder = ['P', 'E', 'D', 'W', '미분류']
  const sortedCategories = categoryOrder.filter(c => byCategory[c]?.length > 0)

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  let globalIndex = 0

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/pools/${id}`)} className="text-slate-400 hover:text-slate-600">&larr;</button>
          <span className="text-sm font-medium text-slate-700">PDF 미리보기</span>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {exporting ? '생성 중...' : 'PDF 다운로드'}
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto my-6 print:my-0">
        <div ref={printRef} style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", color: '#1e293b', fontSize: '11px', lineHeight: '1.6' }}>

          {/* 표지 */}
          <div style={{ padding: '60px 40px 40px', pageBreakAfter: 'always' }}>
            <div style={{ borderLeft: '4px solid #2563eb', paddingLeft: '20px', marginBottom: '48px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{pool.name}</h1>
              {pool.description && (
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{pool.description}</p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sortedCategories.filter(c => c !== '미분류').length + 1}, 1fr)`, gap: '16px', marginBottom: '48px' }}>
              <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>총 문항</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{questions.length}</div>
              </div>
              {sortedCategories.filter(c => c !== '미분류').map(cat => (
                <div key={cat} style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>{cat} {CAT_LABELS[cat]}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{byCategory[cat].length}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              생성일: {today}
            </div>
          </div>

          {/* 카테고리별 문항 */}
          {sortedCategories.map((cat, catIdx) => (
            <div key={cat} style={catIdx > 0 ? { pageBreakBefore: 'always' } : undefined}>
              <div style={{ padding: '24px 40px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0' }}>
                  <span style={{ display: 'inline-block', width: '28px', height: '28px', borderRadius: '6px', background: cat === 'P' ? '#2563eb' : cat === 'E' ? '#dc2626' : cat === 'D' ? '#16a34a' : cat === 'W' ? '#9333ea' : '#64748b', color: '#fff', textAlign: 'center', lineHeight: '28px', fontSize: '14px', fontWeight: 700 }}>{cat}</span>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{CAT_LABELS[cat] ?? cat}</h2>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{byCategory[cat].length}문항</span>
                </div>
              </div>

              {byCategory[cat].map((pq, pqIdx) => {
                globalIndex++
                const label = getLabel(pq.question)
                const options = [...(pq.question.question_option ?? [])].sort((a, b) => a.sort_order - b.sort_order)
                return (
                  <div key={pq.id} style={{ padding: '0 40px', marginBottom: '10px', borderTop: pqIdx > 0 ? '1px solid #e2e8f0' : 'none', paddingTop: pqIdx > 0 ? '14px' : '0', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>Q{globalIndex}</span>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a', flex: 1 }}>{pq.question.title}</span>
                      {label?.difficulty && (
                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: label.difficulty === 'Lv.1' ? '#dcfce7' : label.difficulty === 'Lv.2' ? '#fef3c7' : '#fee2e2', color: label.difficulty === 'Lv.1' ? '#16a34a' : label.difficulty === 'Lv.2' ? '#d97706' : '#dc2626', fontWeight: 600 }}>{label.difficulty}</span>
                      )}
                    </div>

                    {pq.question.description && (
                      <p style={{ fontSize: '10.5px', color: '#475569', margin: '0 0 8px 20px', padding: '8px 12px', background: '#f8fafc', borderLeft: '3px solid #e2e8f0' }}>{pq.question.description}</p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginLeft: '20px' }}>
                      {options.map((o, oi) => (
                        <div key={o.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '4px 10px', background: o.is_correct ? '#eff6ff' : 'transparent', borderLeft: o.is_correct ? '3px solid #3b82f6' : '3px solid transparent' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: o.is_correct ? '#2563eb' : '#94a3b8', minWidth: '14px', flexShrink: 0 }}>{String.fromCharCode(9312 + oi)}</span>
                          <span style={{ fontSize: '10.5px', color: o.is_correct ? '#1e40af' : '#334155', fontWeight: o.is_correct ? 600 : 400 }}>{o.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* 정답표 */}
          {questions.length > 0 && (
            <div style={{ pageBreakBefore: 'always', padding: '24px 40px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0' }}>정답표</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#64748b', width: '50px' }}>번호</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#64748b', width: '50px' }}>영역</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#64748b', width: '50px' }}>정답</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>문항</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let ansIdx = 0
                    return questions.map((pq) => {
                      ansIdx++
                      const label = getLabel(pq.question)
                      const options = [...(pq.question.question_option ?? [])].sort((a, b) => a.sort_order - b.sort_order)
                      const correctIdx = options.findIndex(o => o.is_correct)
                      const correctMark = correctIdx >= 0 ? String.fromCharCode(9312 + correctIdx) : '-'
                      return (
                        <tr key={pq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600 }}>{ansIdx}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'center', color: '#64748b' }}>{label?.category ?? '-'}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: '#2563eb', fontSize: '13px' }}>{correctMark}</td>
                          <td style={{ padding: '6px 12px', color: '#475569', fontSize: '10px' }}>{pq.question.title.substring(0, 50)}{pq.question.title.length > 50 ? '...' : ''}</td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 문항 등록 스크립트
 *
 * 사용법:
 *   node scripts/insert-question.mjs <json파일경로>
 *
 * JSON 형식:
 * {
 *   "title": "질문 제목",
 *   "description": "지문 (없으면 null)",
 *   "explanation": "해설",
 *   "response_type": "single_choice",
 *   "is_active": true,
 *   "category": "P",
 *   "topic_code": "P-3",
 *   "options": [
 *     { "label": "선택지1", "is_correct": true },
 *     { "label": "선택지2", "is_correct": false },
 *     { "label": "선택지3", "is_correct": false },
 *     { "label": "선택지4", "is_correct": false }
 *   ]
 * }
 *
 * 여러 문항 일괄 등록: JSON 배열로 전달
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SB_URL = 'https://agswdadflotjczbszplu.supabase.co'
const SB_KEY = 'sb_publishable_7q4_nzN4fapxYxkv8jkYEQ_LFkLfTff'

const supabase = createClient(SB_URL, SB_KEY)

// 토픽 코드 → UUID 캐시
let topicCache = null

async function getTopicId(code) {
  if (!topicCache) {
    const { data } = await supabase.from('topic').select('id, code').eq('is_active', true)
    topicCache = Object.fromEntries((data ?? []).map(t => [t.code, t.id]))
  }
  const id = topicCache[code]
  if (!id) throw new Error(`토픽 코드 "${code}" 를 찾을 수 없습니다. 유효한 코드: ${Object.keys(topicCache).join(', ')}`)
  return id
}

function check(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`)
  return result.data
}

async function insertQuestion(q) {
  const topicId = q.topic_code ? await getTopicId(q.topic_code) : null

  // 1. question
  const question = check(
    await supabase.from('question').insert({
      response_type: q.response_type ?? 'single_choice',
      title: q.title,
      description: q.description ?? null,
      explanation: q.explanation ?? null,
      is_active: q.is_active ?? true,
    }).select().single(),
    '문항 생성'
  )

  try {
    // 2. label
    check(
      await supabase.from('question_label').insert({
        question_id: question.id,
        category: q.category ?? null,
        industry: '공통',
        position: '공통',
        topic_id: topicId,
      }),
      '라벨 생성'
    )

    // 3. version
    check(
      await supabase.from('question_version').insert({
        question_id: question.id,
        version: 1,
        title: q.title,
        description: q.description ?? null,
        response_type: q.response_type ?? 'single_choice',
        snapshot: { options: q.options, category: q.category, topic_code: q.topic_code },
      }),
      '버전 생성'
    )

    // 4. options
    if (q.options?.length) {
      check(
        await supabase.from('question_option').insert(
          q.options.map((o, i) => ({
            question_id: question.id,
            label: o.label,
            sort_order: o.sort_order ?? i,
            is_correct: o.is_correct ?? false,
          }))
        ),
        '선택지 생성'
      )
    }

    return { id: question.id, title: q.title, status: 'ok' }
  } catch (err) {
    // 롤백
    await supabase.from('question').delete().eq('id', question.id)
    return { title: q.title, status: 'error', message: err.message }
  }
}

// main
const filePath = process.argv[2]
if (!filePath) {
  console.error('사용법: node scripts/insert-question.mjs <json파일경로>')
  process.exit(1)
}

const raw = readFileSync(resolve(filePath), 'utf8')
const input = JSON.parse(raw)
const questions = Array.isArray(input) ? input : [input]

console.log(`\n${questions.length}개 문항 등록 시작...\n`)

const results = []
for (const q of questions) {
  const result = await insertQuestion(q)
  results.push(result)
  const icon = result.status === 'ok' ? 'OK' : 'FAIL'
  console.log(`  [${icon}] ${result.title?.substring(0, 50)}...`)
  if (result.status === 'error') console.log(`        ${result.message}`)
}

const ok = results.filter(r => r.status === 'ok').length
const fail = results.filter(r => r.status === 'error').length
console.log(`\n완료: 성공 ${ok}건, 실패 ${fail}건`)

if (ok > 0) {
  console.log('\n등록된 문항 ID:')
  results.filter(r => r.status === 'ok').forEach(r => console.log(`  ${r.id}`))
}

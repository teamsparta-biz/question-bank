// ---- DB 테이블 타입 ----

export interface Question {
  id: string
  response_type: 'single_choice' | 'multiple_choice'
  title: string
  description: string | null
  current_version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QuestionVersion {
  id: string
  question_id: string
  version: number
  title: string
  description: string | null
  response_type: string
  snapshot: Record<string, unknown> | null
  created_at: string
}

export interface QuestionOption {
  id: string
  question_id: string
  label: string
  sort_order: number
  is_correct: boolean
  created_at: string
}

export interface Topic {
  id: string
  code: string
  category: string
  name: string
  description: string | null
  industries: string[]
  positions: string[]
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface QuestionLabel {
  id: string
  question_id: string
  category: string | null
  industry: string | null
  position: string | null
  topic_id: string | null
  difficulty: string | null
  created_at: string
  updated_at: string
}

export interface QuestionPool {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PoolQuestion {
  id: string
  pool_id: string
  question_id: string
  sort_order: number
  created_at: string
}

// ---- 조인된 뷰 타입 ----

export interface QuestionWithLabel extends Question {
  question_label: QuestionLabel | null
}

export interface QuestionDetail extends Question {
  question_label: QuestionLabel | null
  question_option: QuestionOption[]
  question_version: QuestionVersion[]
}

// ---- 폼 타입 ----

export interface QuestionFormData {
  response_type: Question['response_type']
  title: string
  description: string
  is_active: boolean
  options: { label: string; is_correct: boolean; sort_order: number }[]
  // 분류
  category: string
  industry: string
  position: string
  topic_id: string
  difficulty: string
}

// ---- 필터 ----

export interface QuestionFilters {
  category: string
  is_active: string
  search: string
}

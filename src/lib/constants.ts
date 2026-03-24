// 카테고리 (객관식)
export const CATEGORIES = {
  P: '프롬프트 리터러시',
  E: '윤리/보안',
  D: '데이터 리터러시',
  W: '워크플로우 설계',
} as const

export type Category = keyof typeof CATEGORIES

// 산업
export const INDUSTRIES = {
  공통: '공통',
  IT: 'IT',
  금융: '금융',
  제조: '제조',
  공공: '공공',
  교육: '교육',
  유통: '유통',
  의료: '의료',
} as const

export type Industry = keyof typeof INDUSTRIES

// 직급
export const POSITIONS = {
  공통: '공통',
  실무자: '실무자',
  직책자: '직책자',
  임원: '임원',
} as const

export type Position = keyof typeof POSITIONS

// 난이도
export const DIFFICULTIES = {
  'Lv.1': 'Lv.1',
  'Lv.2': 'Lv.2',
  'Lv.3': 'Lv.3',
} as const

export type Difficulty = keyof typeof DIFFICULTIES

// 응답 유형
export const RESPONSE_TYPES = {
  single_choice: '단일 선택',
  multiple_choice: '복수 선택',
} as const

export type ResponseType = keyof typeof RESPONSE_TYPES

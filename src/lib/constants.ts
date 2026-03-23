// 카테고리
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
  사원: '사원',
  대리: '대리',
  과장: '과장',
  부장: '부장',
  임원: '임원',
} as const

export type Position = keyof typeof POSITIONS

// 난이도
export const DIFFICULTIES = {
  상: '상',
  중: '중',
  하: '하',
} as const

export type Difficulty = keyof typeof DIFFICULTIES

// 응답 유형
export const RESPONSE_TYPES = {
  single_choice: '단일 선택',
  multiple_choice: '복수 선택',
  text: '주관식',
} as const

export type ResponseType = keyof typeof RESPONSE_TYPES

// Element Pool (4차원 20개) — 주관식 채점용
export const ELEMENTS = [
  { id: 'C1', dimension: '맥락 설계', name: '과제 주제 특정', tier: 'basic' },
  { id: 'C2', dimension: '맥락 설계', name: '목적/활용처 명시', tier: 'basic' },
  { id: 'C3', dimension: '맥락 설계', name: 'AI 역할 부여', tier: 'standard' },
  { id: 'C4', dimension: '맥락 설계', name: '독자/수신자 설정', tier: 'standard' },
  { id: 'C5', dimension: '맥락 설계', name: '배경 데이터 제공', tier: 'basic' },
  { id: 'C6', dimension: '맥락 설계', name: '핵심 용어 정의', tier: 'advanced' },
  { id: 'O1', dimension: '출력 형식', name: '출력 형태 지정', tier: 'basic' },
  { id: 'O2', dimension: '출력 형식', name: '전체 구성 제시', tier: 'standard' },
  { id: 'O3', dimension: '출력 형식', name: '필수 항목 나열', tier: 'basic' },
  { id: 'O4', dimension: '출력 형식', name: '항목별 기준 제시', tier: 'advanced' },
  { id: 'O5', dimension: '출력 형식', name: '참고 자료 제공', tier: 'advanced' },
  { id: 'G1', dimension: '제약 조건', name: '어조/톤 지정', tier: 'basic' },
  { id: 'G2', dimension: '제약 조건', name: '분량 지정', tier: 'basic' },
  { id: 'G3', dimension: '제약 조건', name: '금지 사항 명시', tier: 'standard' },
  { id: 'G4', dimension: '제약 조건', name: '범위 한정', tier: 'basic' },
  { id: 'G5', dimension: '제약 조건', name: '불확실 대처 지시', tier: 'standard' },
  { id: 'D1', dimension: '작업 분해', name: '단계적 분리', tier: 'standard' },
  { id: 'D2', dimension: '작업 분해', name: '단계별 수행 기준', tier: 'advanced' },
  { id: 'D3', dimension: '작업 분해', name: '단계 간 연결', tier: 'advanced' },
  { id: 'D4', dimension: '작업 분해', name: '검증 요청 및 기준', tier: 'standard' },
] as const

export type ElementTier = 'basic' | 'standard' | 'advanced'

export const ACTIVE_TIERS: Record<string, ElementTier[]> = {
  basic: ['basic'],
  standard: ['basic', 'standard'],
  advanced: ['basic', 'standard', 'advanced'],
}

// 영역
export const DOMAINS = {
  P: '프롬프트 리터러시',
  E: '윤리/보안',
  D: '데이터 리터러시',
  W: '워크플로우 설계',
} as const

export type Domain = keyof typeof DOMAINS

// 인지 수준
export const COGNITIVE_LEVELS = {
  L1: '기억',
  L2: '이해',
  L3: '적용',
  L4: '분석',
} as const

export type CognitiveLevel = keyof typeof COGNITIVE_LEVELS

// 문제 형식
export const QUESTION_FORMATS = {
  A: '단일 최선답',
  B: '시나리오/사례',
  D: '비교/구분',
  E: '순서/절차',
  F: '자료 해석',
} as const

export type QuestionFormat = keyof typeof QUESTION_FORMATS

// 복잡도 (주관식)
export const COMPLEXITIES = {
  basic: '단순 (8E)',
  standard: '표준 (15E)',
  advanced: '심화 (20E)',
} as const

export type Complexity = keyof typeof COMPLEXITIES

// 유형 (주관식)
export const TASK_TYPES = {
  generate: '생성',
  analyze: '분석',
  transform: '변환',
  extract: '추출',
} as const

export type TaskType = keyof typeof TASK_TYPES

// Element Pool (4차원 20개)
export const ELEMENTS = [
  // 맥락 설계 (Context Design)
  { id: 'C1', dimension: '맥락 설계', name: '과제 주제 특정', tier: 'basic' },
  { id: 'C2', dimension: '맥락 설계', name: '목적/활용처 명시', tier: 'basic' },
  { id: 'C3', dimension: '맥락 설계', name: 'AI 역할 부여', tier: 'standard' },
  { id: 'C4', dimension: '맥락 설계', name: '독자/수신자 설정', tier: 'standard' },
  { id: 'C5', dimension: '맥락 설계', name: '배경 데이터 제공', tier: 'basic' },
  { id: 'C6', dimension: '맥락 설계', name: '핵심 용어 정의', tier: 'advanced' },
  // 출력 형식 (Output Structure)
  { id: 'O1', dimension: '출력 형식', name: '출력 형태 지정', tier: 'basic' },
  { id: 'O2', dimension: '출력 형식', name: '전체 구성 제시', tier: 'standard' },
  { id: 'O3', dimension: '출력 형식', name: '필수 항목 나열', tier: 'basic' },
  { id: 'O4', dimension: '출력 형식', name: '항목별 기준 제시', tier: 'advanced' },
  { id: 'O5', dimension: '출력 형식', name: '참고 자료 제공', tier: 'advanced' },
  // 제약 조건 (Constraints)
  { id: 'G1', dimension: '제약 조건', name: '어조/톤 지정', tier: 'basic' },
  { id: 'G2', dimension: '제약 조건', name: '분량 지정', tier: 'basic' },
  { id: 'G3', dimension: '제약 조건', name: '금지 사항 명시', tier: 'standard' },
  { id: 'G4', dimension: '제약 조건', name: '범위 한정', tier: 'basic' },
  { id: 'G5', dimension: '제약 조건', name: '불확실 대처 지시', tier: 'standard' },
  // 작업 분해 (Decomposition)
  { id: 'D1', dimension: '작업 분해', name: '단계적 분리', tier: 'standard' },
  { id: 'D2', dimension: '작업 분해', name: '단계별 수행 기준', tier: 'advanced' },
  { id: 'D3', dimension: '작업 분해', name: '단계 간 연결', tier: 'advanced' },
  { id: 'D4', dimension: '작업 분해', name: '검증 요청 및 기준', tier: 'standard' },
] as const

export type ElementTier = 'basic' | 'standard' | 'advanced'

// 복잡도별 활성 tier
export const ACTIVE_TIERS: Record<string, ElementTier[]> = {
  basic: ['basic'],
  standard: ['basic', 'standard'],
  advanced: ['basic', 'standard', 'advanced'],
}

// 응답 유형
export const RESPONSE_TYPES = {
  single_choice: '단일 선택',
  multiple_choice: '복수 선택',
  text: '주관식',
} as const

export type ResponseType = keyof typeof RESPONSE_TYPES

/**
 * 스킨케어 도메인 타입 정의
 *
 * 데이터 경로: users/{uid}/skincare/main (개인 전용, 가족 공유 안 함)
 *
 * 레거시 legacy/skincare.html의 데이터 구조를 TypeScript로 정리한 것.
 */

/** 스킨케어 단계 1~7 */
export type SkincareStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 클렌징(S1) 서브타입 */
export type CleanserType = 'oil' | 'balm' | 'milk' | 'foam' | 'scrub';

/** Step6(크림/선크림) 서브카테고리 */
export type Step6Sub = 'general' | 'suncream';

/** Step7(스페셜) 타입 */
export type PackType = 'exfoliate' | 'sleeping' | 'mask' | 'mist';

/** 제형 무게감 */
export type Weight = 'light' | 'medium' | 'heavy';

/** 피부 컨디션 옵션 */
export type SkinCondition =
  | '건조함'
  | '칙칙함'
  | '민감/붉은기'
  | '트러블'
  | '유분/번들거림'
  | '정상';

/** 성분 사전 항목 */
export interface IngredientInfo {
  name: string;
  desc: string;
  type: 'pro' | 'caution';
}

/** 인벤토리 제품 1개 */
export interface Product {
  id: string;
  brand: string;
  name: string;
  step: SkincareStep;
  /** Step1(클렌징)일 때 사용 */
  cleanserType?: CleanserType;
  /** Step6일 때 사용: general(일반크림) / suncream(선크림) */
  subCategory?: Step6Sub;
  /** Step7일 때 사용 */
  packType?: PackType;
  weight?: Weight;
  keyIngredients?: string[];
  cautionIngredients?: string[];
  description?: string;
  imageBase64?: string;
  imageMime?: string;
  createdAt?: string;
  /** AI 분석 정보 */
  aiNotes?: string;
}

/** 단계별 선택된 제품 ID 배열 (1~7) */
export type RoutineSelection = Record<SkincareStep, string[]>;

/** 한 번의 루틴 분석/저장 기록 */
export interface RoutineRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timeOfDay: 'day' | 'night';
  routine: RoutineSelection;
  condition: SkinCondition;
  goal: string;
  score: number;
  feedback?: {
    step: number | 'general';
    type: 'pro' | 'con' | 'info';
    msg: string;
  }[];
  /** AI 메커니즘 분석 리포트 (있을 수도 없을 수도) */
  mechanismReport?: {
    conclusion: string;
    mechanism: string;
    improvements: string;
    generatedAt: string;
  };
  createdAt: string;
}

/** 일자별 피부 컨디션 기록 */
export interface ConditionRecord {
  date: string; // YYYY-MM-DD
  condition: SkinCondition;
}

/** AI가 학습한 성분 매핑 (입력값 → 사전 키) */
export type LearnedIngredients = Record<string, string>;

/** 사용자 프로필 */
export interface SkincareProfile {
  nickname: string;
  gender: '남성' | '여성' | '기타';
  age: number;
  skinType: '건성' | '지성' | '수부지' | '복합성' | '민감성' | '중성';
  /** AI 기능용 API 키 (개인 보관) */
  apiKey: string;
}

/** Firestore users/{uid}/skincare/main 한 문서의 전체 스키마 */
export interface SkincareDoc {
  inventory: Product[];
  history: RoutineRecord[];
  conditionHistory: ConditionRecord[];
  learnedIngredients: LearnedIngredients;
  profile: SkincareProfile;
  /** 휴지통 — 삭제된 제품 (7일 후 자동 정리) */
  trash: (Product & { deletedAt: string })[];
  /** 휴지통 — 삭제된 루틴 기록 */
  historyTrash: (RoutineRecord & { deletedAt: string })[];
  lastBackupAt?: string;
  /** 스키마 버전 (마이그레이션 대비) */
  schemaVersion: number;
}

/** 기본 프로필 */
export const DEFAULT_PROFILE: SkincareProfile = {
  nickname: '마스터',
  gender: '남성',
  age: 40,
  skinType: '수부지',
  apiKey: '',
};

/** 빈 루틴 선택 (S1~S7 모두 빈 배열) */
export const EMPTY_ROUTINE: RoutineSelection = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
};

/** 빈 스킨케어 문서 */
export const EMPTY_SKINCARE_DOC: SkincareDoc = {
  inventory: [],
  history: [],
  conditionHistory: [],
  learnedIngredients: {},
  profile: DEFAULT_PROFILE,
  trash: [],
  historyTrash: [],
  schemaVersion: 1,
};

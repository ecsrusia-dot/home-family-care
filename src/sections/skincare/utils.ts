/**
 * 스킨케어 도메인 유틸리티 함수
 *
 * legacy/skincare.html의 getIngredientDetails, getBaseIngredient, getProductBadges,
 * getTodayDateString을 TypeScript로 옮긴 것.
 */

import { ingredientDict } from './meta';
import type {
  IngredientInfo,
  LearnedIngredients,
  Product,
} from './types';

/** 오늘 날짜를 YYYY-MM-DD (로컬 타임존) 형식으로 반환 */
export function getTodayDateString(): string {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
}

/**
 * 성분 이름으로 사전 항목을 찾는다.
 * 사전에 없으면 type 정보(pro/caution)에 따라 기본 설명을 반환.
 */
export function getIngredientDetails(
  ing: string,
  type: 'pro' | 'caution',
): IngredientInfo {
  const key = ing.toLowerCase();
  for (const dictKey in ingredientDict) {
    if (key.includes(dictKey)) return ingredientDict[dictKey];
  }
  return {
    name: ing,
    desc:
      type === 'pro'
        ? '해당 제품의 핵심 효능을 담당하는 유효 성분/기능입니다.'
        : '개인의 피부 상태나 사용 방법에 따라 자극이 될 수 있으니 주의가 필요한 성분입니다.',
    type,
  };
}

/**
 * 입력 성분명을 사전 키로 정규화.
 * 사전에 직접 매칭되지 않으면 학습된 매핑(learnedIngredients)을 시도.
 * 둘 다 실패하면 null 반환.
 */
export function getBaseIngredient(
  ing: string,
  learnedIngredients: LearnedIngredients,
): string | null {
  const key = ing.toLowerCase();
  for (const dictKey in ingredientDict) {
    if (key.includes(dictKey)) return dictKey;
  }
  for (const unknownKey in learnedIngredients) {
    if (key.includes(unknownKey.toLowerCase())) {
      return learnedIngredients[unknownKey].toLowerCase();
    }
  }
  return null;
}

/** 제품 카드에 표시할 기능 뱃지 (최대 3개) */
export interface ProductBadge {
  key: string;
  icon: string;
  label: string;
  color: string;
}

export function getProductBadges(item: Product | null | undefined): ProductBadge[] {
  if (!item) return [];
  const ings = [
    ...(item.keyIngredients || []),
    ...(item.cautionIngredients || []),
  ].map((x) => (x || '').toLowerCase());
  const has = (kws: string[]) =>
    kws.some((k) => ings.some((i) => i.includes(k)));

  const all: ProductBadge[] = [];

  // 선크림(Step 6 + suncream) 최우선
  if (item.step === 6 && item.subCategory === 'suncream') {
    all.push({
      key: 'uv',
      icon: '☀️',
      label: 'UV차단',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    });
  }
  // 아이크림(Step 5)
  if (item.step === 5) {
    all.push({
      key: 'eye',
      icon: '👁️',
      label: '아이케어',
      color: 'bg-pink-50 text-pink-700 border-pink-200',
    });
  }

  if (has(['hyaluronic', 'panthenol'])) {
    all.push({
      key: 'moisture',
      icon: '💧',
      label: '수분',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    });
  }
  if (has(['cica', 'ceramide', 'centella', 'panthenol', 'repair'])) {
    all.push({
      key: 'soothing',
      icon: '🛡️',
      label: '진정/장벽',
      color: 'bg-green-50 text-green-700 border-green-200',
    });
  }
  if (has(['peptides', 'caviar', 'retinol', 'resveratrol', 'antiaging'])) {
    all.push({
      key: 'antiaging',
      icon: '👑',
      label: '안티에이징',
      color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    });
  }
  if (has(['vitamin c', 'niacinamide', 'resveratrol'])) {
    all.push({
      key: 'bright',
      icon: '🌟',
      label: '브라이트닝',
      color: 'bg-pink-50 text-pink-700 border-pink-200',
    });
  }
  if (has(['aha', 'bha', 'glycolic'])) {
    all.push({
      key: 'exfoliate',
      icon: '✨',
      label: '각질/모공',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    });
  }
  if (has(['exosome', 'peptides'])) {
    all.push({
      key: 'regen',
      icon: '🔬',
      label: '재생',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    });
  }

  const seen = new Set<string>();
  const uniq = all.filter((b) => {
    if (seen.has(b.key)) return false;
    seen.add(b.key);
    return true;
  });
  return uniq.slice(0, 3);
}

/** 새 제품 ID 생성 */
export function newProductId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 새 루틴 기록 ID 생성 */
export function newRecordId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

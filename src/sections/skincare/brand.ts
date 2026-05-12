/**
 * 브랜드 표기 정규화 유틸.
 *
 * 목적: 한 번 등록된 브랜드는 이후 동일 브랜드 등록 시 표기가 흔들리지 않도록
 *       표준 표기로 통일한다.
 *
 * 처리 사례:
 *   - "VALMONT" / "valmont" / "Val Mont" → 모두 동일 처리, 첫 등록 표기 유지
 *   - "LA MER" / "LAMER" / "la-mer" → 띄어쓰기/하이픈 차이 흡수
 *   - "라메르" ↔ "LA MER" 같은 한글↔영문 등가는 normalize로는 해결 불가.
 *     이 경우는 AI 프롬프트에 기존 브랜드 목록을 전달해 Gemini가 매칭하게 한다.
 */

/** 비교용 정규화된 키 생성 — 대소문자/공백/구두점 차이 제거 */
export function normalizeBrandKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    // 영문/숫자/한글만 남김 (공백·하이픈·마침표·작은따옴표 등 모두 제거)
    .replace(/[^a-z0-9가-힣]/g, '');
}

/**
 * 입력된 브랜드명을, 인벤토리에 이미 존재하는 동일 브랜드의 표기(원문 그대로)로 정규화.
 * 매칭되는 게 없으면 입력값을 trim해서 그대로 반환.
 *
 * @param input 사용자가 입력하거나 AI가 반환한 브랜드명
 * @param existingBrands 인벤토리에 이미 존재하는 브랜드 원문 배열
 */
export function canonicalizeBrand(
  input: string,
  existingBrands: string[],
): string {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return trimmed;
  const key = normalizeBrandKey(trimmed);
  if (!key) return trimmed;

  for (const brand of existingBrands) {
    if (normalizeBrandKey(brand) === key) {
      return brand;
    }
  }
  return trimmed;
}

/** 인벤토리에서 고유 브랜드 목록 추출 (중복 제거 + 알파벳/가나다 정렬) */
export function uniqueBrands(
  items: { brand?: string }[],
): string[] {
  const set = new Set<string>();
  for (const it of items) {
    const b = it.brand?.trim();
    if (b) set.add(b);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
}

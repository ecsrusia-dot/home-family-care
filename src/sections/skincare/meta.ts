/**
 * 스킨케어 도메인 상수/메타데이터
 *
 * legacy/skincare.html의 ingredientDict, stepMeta, cleanserTypes, step6Subs, packTypes를
 * 그대로 옮기되 TypeScript로 타입 지정.
 */

import type {
  CleanserType,
  IngredientInfo,
  PackType,
  SkincareStep,
  Step6Sub,
} from './types';

/** 성분 사전 — 키는 소문자 영문 이름의 일부, 매칭 시 includes로 부분 일치 검색 */
export const ingredientDict: Record<string, IngredientInfo> = {
  aha: {
    name: 'AHA (알파하이드록시산)',
    desc: '피부 최외곽의 묵은 각질을 녹여 피부결을 매끄럽게 하고 턴오버를 돕습니다. 단, 자외선에 취약해지므로 밤에만 사용해야 합니다.',
    type: 'caution',
  },
  bha: {
    name: 'BHA (살리실산)',
    desc: '지용성 각질 제거 성분으로, 모공 속 피지와 블랙헤드를 녹이는 데 탁월합니다. 건조함을 유발할 수 있습니다.',
    type: 'caution',
  },
  alcohol: {
    name: '알코올/에탄올',
    desc: '제품의 흡수력을 높이고 청량감을 주지만, 수분을 증발시켜 건조함을 유발하거나 면도 상처에 자극이 될 수 있습니다.',
    type: 'caution',
  },
  fragrance: {
    name: '향료 (Fragrance)',
    desc: '화장품에 향을 부여합니다. 인공 향료는 민감성 피부나 알레르기 피부에 트러블을 유발할 가능성이 있어 주의가 필요합니다.',
    type: 'caution',
  },
  silicone: {
    name: '실리콘 (Silicone)',
    desc: '피부에 매끄러운 막을 형성해 발림성을 좋게 하지만, 모공을 막아 수부지/지성 피부에 트러블을 유발할 수 있습니다.',
    type: 'caution',
  },
  'shea butter': {
    name: '시어버터',
    desc: '강력한 천연 보습막을 형성하는 초고영양 성분입니다. 건성에게는 최고이나 지성에게는 모공을 막아 여드름을 유발할 수 있습니다.',
    type: 'caution',
  },
  liposome: {
    name: '리포솜 (Liposome)',
    desc: '피부 세포막과 유사한 구조의 미세 캡슐로, 유효 성분을 피부 진피층까지 안전하고 깊숙하게 전달하는 고급 흡수 기술입니다.',
    type: 'pro',
  },
  ceramide: {
    name: '세라마이드',
    desc: '피부 지질의 50% 이상을 차지하는 핵심 성분으로, 무너진 피부 장벽을 시멘트처럼 메워 수분 증발을 막습니다.',
    type: 'pro',
  },
  'hyaluronic acid': {
    name: '히알루론산',
    desc: '자기 무게의 1000배에 달하는 수분을 끌어당기는 수분 자석입니다. 번들거림 없이 속건조 해결에 탁월합니다.',
    type: 'pro',
  },
  panthenol: {
    name: '판테놀 (Vitamin B5)',
    desc: '피부에 흡수되면 비타민 B5로 변환되어 즉각적인 진정 효과와 함께 강력한 수분 보습막을 형성합니다.',
    type: 'pro',
  },
  cica: {
    name: '시카 (병풀 추출물)',
    desc: '호랑이풀로 불리며, 상처 입고 자극받은 피부(면도 트러블 등)를 진정시키고 장벽을 회복하는 데 매우 탁월합니다.',
    type: 'pro',
  },
  exosome: {
    name: '엑소좀',
    desc: '세포 간 신호를 전달하는 나노 소포체로, 손상된 피부 세포의 근본적인 자생력을 높이는 최첨단 줄기세포 배양 기술입니다.',
    type: 'pro',
  },
  resveratrol: {
    name: '레스베라트롤',
    desc: '포도 등에 함유된 강력한 항산화 성분입니다. 칙칙한 안색을 맑게 개선하지만 빛/열에 취약해 밤에 주로 사용합니다.',
    type: 'pro',
  },
  caviar: {
    name: '캐비아 추출물',
    desc: '해양성 단백질과 아미노산이 풍부하여 늘어진 피부의 밀도와 탄력을 코르셋처럼 강력하게 끌어올려 줍니다.',
    type: 'pro',
  },
  peptides: {
    name: '펩타이드',
    desc: '단백질 조각 성분으로, 피부 속 콜라겐 생성을 촉진하여 주름을 개선하고 쫀쫀한 탄력을 부여합니다.',
    type: 'pro',
  },
  niacinamide: {
    name: '나이아신아마이드',
    desc: '식약처 고시 미백 성분으로 멜라닌 이동을 억제하여 톤을 밝혀주고 피지 조절 기능도 갖추고 있습니다.',
    type: 'pro',
  },
  retinol: {
    name: '레티놀',
    desc: '주름 개선과 턴오버 촉진에 탁월한 비타민A 유도체입니다. 빛에 취약해 밤에만 바르며 초기 적응기가 필요합니다.',
    type: 'caution',
  },
  cooling: {
    name: '쿨링 에이전트',
    desc: '피부에 닿는 즉시 열감을 내려 홍조를 완화하고 모공을 타이트하게 조여주는 작용을 합니다.',
    type: 'pro',
  },
  softening: {
    name: '유연화 (Softening)',
    desc: '거칠어진 각질층을 스펀지처럼 말랑하게 풀어주어 다음 단계 유효성분의 흡수력을 폭발적으로 높여줍니다.',
    type: 'pro',
  },
  repair: {
    name: '리페어/재생 (Repair)',
    desc: '피부 본연의 자생력을 높여 손상된 장벽을 회복시킵니다.',
    type: 'pro',
  },
  antiaging: {
    name: '안티에이징 (Antiaging)',
    desc: '주름 개선 및 탄력 강화에 도움을 주는 고영양 성분입니다.',
    type: 'pro',
  },
};

/** 단계 1~7 메타정보 */
export const stepMeta: Record<
  SkincareStep,
  { short: string; label: string; desc: string }
> = {
  1: { short: 'S1', label: '클렌징', desc: '세안 및 메이크업 제거' },
  2: { short: 'S2', label: '미스트/퍼스트', desc: '수분길 열기' },
  3: { short: 'S3', label: '토너/로션', desc: '피부결 정돈' },
  4: { short: 'S4', label: '세럼/앰플', desc: '고농축 유효성분 (순서 중요)' },
  5: { short: 'S5', label: '아이크림', desc: '눈가 전용 집중 케어' },
  6: { short: 'S6', label: '크림/선크림', desc: '마무리 · 잠금 · UV차단' },
  7: { short: 'S7', label: '스페셜', desc: '각질/수면팩/마스크팩/미스트' },
};

/** Step1 클렌저 서브타입 */
export const cleanserTypes: Record<
  CleanserType,
  { label: string; icon: string }
> = {
  oil: { label: '오일', icon: '🫒' },
  balm: { label: '밤', icon: '🧈' },
  milk: { label: '밀크/크림', icon: '🥛' },
  foam: { label: '폼/젤', icon: '🧼' },
  scrub: { label: '각질', icon: '✨' },
};

/** Step6 서브카테고리 */
export const step6Subs: Record<Step6Sub, { label: string; icon: string }> = {
  general: { label: '일반크림', icon: '🧴' },
  suncream: { label: '선크림', icon: '☀️' },
};

/** Step7 스페셜 타입 */
export const packTypes: Record<PackType, { label: string; icon: string }> = {
  exfoliate: { label: '각질', icon: '✨' },
  sleeping: { label: '수면팩', icon: '😴' },
  mask: { label: '마스크팩', icon: '🧖' },
  mist: { label: '미스트', icon: '💨' },
};

/** 피부 컨디션 옵션 (UI 표시 순서) */
export const conditionOptions = [
  '건조함',
  '칙칙함',
  '민감/붉은기',
  '트러블',
  '유분/번들거림',
  '정상',
] as const;

/** 스킨케어 목표 옵션 */
export const goalOptions = [
  { value: 'antiaging', label: '안티에이징/탄력' },
  { value: 'moisture', label: '수분/보습' },
  { value: 'soothing', label: '진정/장벽' },
  { value: 'bright', label: '브라이트닝/미백' },
  { value: 'pore', label: '모공/각질' },
] as const;

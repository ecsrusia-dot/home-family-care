/**
 * 스킨케어 루틴 분석 엔진.
 *
 * 레거시 computeAnalysis 함수를 TypeScript로 이식.
 * - 점수: 100점에서 시작, 위반/취약점은 감점, 좋은 궁합은 가점
 * - 단계별 피드백: 1~7 + 'general' (전체 차원의 피드백)
 * - 피드백 타입: pro(좋음) | con(나쁨) | info(중립)
 *
 * 입력에 따라 조정되는 변수:
 * - 피부 타입 (건성/지성/수부지/복합성/민감성/중성)
 * - 오늘 컨디션 (건조함/칙칙함/민감 등)
 * - 시간대 (day/night)
 * - 학습된 성분 사전 (모르는 성분도 대표 카테고리에 매핑)
 */

import { ingredientDict } from './meta';
import type {
  LearnedIngredients,
  Product,
  RoutineSelection,
  SkinCondition,
  SkincareProfile,
  SkincareStep,
} from './types';

/** 피드백 한 줄 */
export interface Feedback {
  step: SkincareStep | 'general';
  type: 'pro' | 'con' | 'info';
  msg: string;
}

/** 분석 결과 */
export interface AnalysisResult {
  score: number;
  grade: string;
  stepFeedback: Record<SkincareStep | 'general', Feedback[]>;
  selectedCount: number;
}

interface AnalysisInput {
  routine: RoutineSelection;
  timeOfDay: 'day' | 'night';
  inventory: Product[];
  profile: SkincareProfile;
  condition: SkinCondition;
  learnedIngredients: LearnedIngredients;
}

const emptyFeedback = (): Record<SkincareStep | 'general', Feedback[]> => ({
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  general: [],
});

/** 입력 성분명을 사전 키로 정규화 (못 찾으면 null) */
function getBaseIngredient(
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

export function computeAnalysis(input: AnalysisInput): AnalysisResult | null {
  const { routine, timeOfDay, inventory, profile, condition, learnedIngredients } =
    input;

  let score = 100;
  const stepFeedback = emptyFeedback();

  // 각 step의 제품 객체 배열로 변환
  const byStep = (s: SkincareStep) =>
    (routine[s] ?? [])
      .map((id) => inventory.find((i) => i.id === id))
      .filter((p): p is Product => !!p);

  const pCleanse = byStep(1);
  const pMist = byStep(2);
  const pToner = byStep(3);
  const pSerum = byStep(4);
  const pEye = byStep(5);
  const pCream = byStep(6);
  const pPack = byStep(7);

  const selectedProducts = [
    ...pCleanse,
    ...pMist,
    ...pToner,
    ...pSerum,
    ...pEye,
    ...pCream,
    ...pPack,
  ];

  if (selectedProducts.length === 0) {
    return null;
  }

  const addMsg = (
    step: SkincareStep | 'general',
    type: Feedback['type'],
    msg: string,
  ) => {
    stepFeedback[step].push({ step, type, msg });
    if (type === 'con') score -= 15;
    if (type === 'pro') score += 5;
  };

  const resolveIngs = (list: Product[]) =>
    list.flatMap((p) => [
      ...(p?.keyIngredients ?? []),
      ...(p?.cautionIngredients ?? []),
    ]).map((i) => getBaseIngredient(i, learnedIngredients) ?? i.toLowerCase());

  const hasAnyIng = (productOrList: Product | Product[], keywords: string[]) => {
    const list = Array.isArray(productOrList) ? productOrList : [productOrList];
    const ings = resolveIngs(list);
    return keywords.some((kw) => ings.some((i) => i.includes(kw.toLowerCase())));
  };

  const isOily = profile.skinType === '지성' || profile.skinType === '수부지';
  const isDry = profile.skinType === '건성';
  const isSensitive =
    profile.skinType === '민감성' ||
    condition === '민감/붉은기' ||
    condition === '트러블';

  const pCreamGeneral = pCream.find(
    (p) => !p.subCategory || p.subCategory === 'general',
  );
  const sunCreams = pCream.filter((p) => p.subCategory === 'suncream');

  const oneMist = pMist[0];
  const oneToner = pToner[0];

  // ========== 일반 루틴 체크 ==========
  let stepCount =
    (oneMist ? 1 : 0) +
    (oneToner ? 1 : 0) +
    (pSerum.length > 0 ? 1 : 0) +
    (pCream.length > 0 ? 1 : 0);
  if (pCream.length === 0) {
    addMsg(
      'general',
      'con',
      `🚨 [마무리 누락] 크림(Step 6)이 없어 바른 유효 성분과 수분이 증발합니다. 스킨케어는 잠그는 것이 생명입니다.`,
    );
    score -= 25;
  }
  if (stepCount < 3) {
    addMsg(
      'general',
      'con',
      `⚠️ [루틴 부실] ${profile.age}대 ${profile.skinType} 스킨케어는 최소 3단계가 권장됩니다.`,
    );
    score -= 10;
  }
  if (!oneMist && !oneToner && pSerum.length > 0) {
    addMsg(
      'general',
      'con',
      '⚠️ [수분길 누락] 길을 여는 미스트/토너 없이 고농축 세럼을 바로 바르면 흡수율이 크게 떨어집니다.',
    );
    score -= 10;
  }
  if (pSerum.length > 2) {
    addMsg(
      'general',
      'con',
      '🚨 [과영양/밀림 경고] 고농축 앰플을 3개 이상 겹쳐 바르면 모공이 막히고 화장이 밀립니다. 최대 2개만 선택하세요!',
    );
    score -= 40;
  }

  const heavyCount = selectedProducts.filter((p) => p.weight === 'heavy').length;
  if (timeOfDay === 'day' && heavyCount > 0) {
    if (isDry) {
      addMsg(
        'general',
        'info',
        `낮 루틴에 무거운 제형이 포함되었습니다. ${profile.skinType}이시므로 보습 유지에 도움이 됩니다.`,
      );
    } else {
      addMsg(
        'general',
        'con',
        `낮 루틴에 무거운 제형이 있어 ${profile.skinType} 피부 특성상 오후에 유분(개기름) 폭발이 우려됩니다.`,
      );
      score -= 15;
    }
  }

  if (condition === '건조함' && hasAnyIng(selectedProducts, ['hyaluronic acid', 'panthenol', 'ceramide'])) {
    addMsg(
      'general',
      'pro',
      `★ [컨디션 맞춤] 오늘 피부 상태(${condition})에 완벽히 부합하는 수분/보습 처방이 포함되었습니다.`,
    );
    score += 10;
  }
  if (condition === '칙칙함' && hasAnyIng(selectedProducts, ['resveratrol', 'vitamin c', 'niacinamide', 'aha'])) {
    addMsg(
      'general',
      'pro',
      `★ [컨디션 맞춤] 칙칙한 오늘 피부에 안색을 맑게 밝혀주는 브라이트닝/항산화 성분이 배치되었습니다.`,
    );
    score += 10;
  }
  if (isSensitive && hasAnyIng(selectedProducts, ['aha', 'bha', 'retinol', 'glycolic acid'])) {
    addMsg(
      'general',
      'con',
      `🚨 [컨디션 충돌] 오늘 피부가 '${condition}' 상태입니다! 산성이나 레티놀 성분은 피부를 강하게 자극하므로 오늘은 무조건 피하세요.`,
    );
    score -= 30;
  }

  // ========== S1 클렌징 ==========
  if (pCleanse.length === 0) {
    if (timeOfDay === 'night') {
      addMsg(
        'general',
        'con',
        `🚨 [클렌징 누락] 저녁 루틴에 클렌징이 없습니다. 세안 없이 스킨케어를 시작하면 유효 성분이 피지·노폐물에 막혀 흡수되지 않습니다.`,
      );
      score -= 20;
    }
  } else {
    const kinds = pCleanse.map((p) => p.cleanserType).filter(Boolean) as string[];
    const hasOilBased = kinds.some((k) => ['oil', 'balm', 'milk'].includes(k));
    const hasWaterBased = kinds.some((k) => ['foam'].includes(k));

    if (hasOilBased && hasWaterBased) {
      addMsg(
        1,
        'pro',
        `★ [이상적 더블 클렌징] 유성 + 수성 조합으로 메이크업과 피지를 완벽히 제거합니다.`,
      );
      score += 10;
    } else if (timeOfDay === 'night' && !hasOilBased) {
      addMsg(
        1,
        'info',
        `💡 [더블 클렌징 권장] 저녁엔 선크림·미세먼지 제거를 위해 오일/밤/밀크 타입을 먼저 사용하는 것이 이상적입니다.`,
      );
    }

    pCleanse.forEach((p) => {
      const kind = p.cleanserType;
      if (kind === 'oil' || kind === 'balm') {
        addMsg(1, 'pro', `[${p.name}] 유성 노폐물(메이크업·선크림·피지)을 녹여냅니다. 반드시 건조한 손·건조한 얼굴에 사용하세요.`);
      } else if (kind === 'milk') {
        addMsg(1, 'pro', `[${p.name}] 순한 워시 타입. ${isSensitive ? '민감해진 오늘 피부에 특히 적합합니다.' : '부담 없는 가벼운 세정에 적합합니다.'}`);
      } else if (kind === 'foam') {
        if (isDry) {
          addMsg(1, 'con', `[${p.name}] 건성 피부가 폼 단독 사용 시 건조·당김이 심해질 수 있습니다. 부드러운 밀크 타입 병행을 고려하세요.`);
        } else {
          addMsg(1, 'pro', `[${p.name}] 모공 속 피지까지 개운하게 씻어냅니다. 1분 이내 빠르게 헹궈주세요.`);
        }
      } else if (kind === 'scrub') {
        if (isSensitive) {
          addMsg(1, 'con', `[${p.name}] 민감한 오늘 피부에 스크럽 클렌저는 자극이 강합니다. 오늘은 건너뛰세요.`);
        } else {
          addMsg(1, 'info', `[${p.name}] 각질 케어 클렌저. 주 1~2회 정도로 제한 사용하세요.`);
        }
      }
    });

    if (timeOfDay === 'day' && pCleanse.length >= 2) {
      addMsg(
        1,
        'con',
        `⚠️ [아침 과세정] 아침에 클렌징 2종 이상 사용은 과세정을 유발해 피부 장벽을 약화시킵니다. 아침엔 1종 권장.`,
      );
      score -= 10;
    }
  }

  // ========== S2 미스트/퍼스트 ==========
  if (oneMist) {
    if (hasAnyIng(oneMist, ['liposome', 'softening'])) {
      addMsg(2, 'pro', `피부 결을 깨우고 수분길을 열어 다음 단계 제품의 흡수율을 극대화합니다.`);
    } else if (hasAnyIng(oneMist, ['hyaluronic acid', 'ceramide', 'panthenol'])) {
      addMsg(2, 'pro', `세안 직후 메마른 피부에 즉각적인 속건조 해결 마스터키 역할을 합니다.`);
    } else {
      addMsg(2, 'info', `${oneMist.name}이(가) 첫 단계 피부결을 정돈합니다.`);
    }
  }

  // ========== S3 토너/로션 ==========
  if (oneToner) {
    if (timeOfDay === 'day' && hasAnyIng(oneToner, ['cooling'])) {
      addMsg(3, 'pro', `아침/낮 사용 시 피부 열감을 즉각적으로 내려 메이크업이 잘 받는 상태로 만듭니다.`);
    }
    if (hasAnyIng(oneToner, ['softening'])) {
      addMsg(3, 'pro', `피부 결을 에스테틱 다녀온 것처럼 유연하고 매끄럽게 풀어줍니다.`);
    }
    if (oneToner.weight === 'heavy') {
      if (timeOfDay === 'day' && isOily) {
        addMsg(3, 'con', `${profile.skinType} 피부가 낮에 쓰기엔 무겁습니다. 저녁으로 미루는 것을 권장합니다.`);
      } else {
        addMsg(3, 'pro', '탄탄한 영양감과 수분 탄력을 동시에 챙기기 좋은 든든한 베이스입니다.');
      }
    } else if (!hasAnyIng(oneToner, ['cooling', 'softening'])) {
      addMsg(3, 'info', `피부 결 정돈 및 1차 수분 공급에 충실하게 작용합니다.`);
    }
  }

  // ========== S4 세럼/앰플 ==========
  if (pSerum.length > 0) {
    if (pSerum.length === 2) {
      const w1 = pSerum[0].weight;
      const w2 = pSerum[1].weight;
      if (
        (w1 === 'heavy' && (w2 === 'medium' || w2 === 'light')) ||
        (w1 === 'medium' && w2 === 'light')
      ) {
        addMsg(
          4,
          'con',
          `🚨 [제형 순서 오류] 무거운 제형(${pSerum[0].name})을 가벼운 제형(${pSerum[1].name})보다 먼저 바르면 유효 성분이 겉돕니다. 가벼운 세럼을 먼저 바르세요.`,
        );
        score -= 15;
      } else {
        addMsg(4, 'pro', '★ [완벽한 레이어링] 묽고 가벼운 제형에서 점도 있는 무거운 제형 순서로 겹쳐 발라 흡수 시너지가 좋습니다.');
        score += 10;
      }
    }
    pSerum.forEach((ps) => {
      if (hasAnyIng(ps, ['exosome', 'cica', 'panthenol', 'repair'])) {
        addMsg(4, 'pro', `[${ps.name}] 외부 자극으로 얇아진 장벽을 속부터 튼튼하게 진정·재건합니다.`);
        if (isSensitive) {
          addMsg(4, 'pro', `★ [컨디션 찰떡] 민감해진 피부를 빠르게 다독이는 최고의 선택입니다.`);
          score += 10;
        }
      }
      if (hasAnyIng(ps, ['hyaluronic acid'])) {
        addMsg(4, 'pro', `[${ps.name}] 번들거림 없이 수분만 꽉 채워 속건조를 완벽히 차단합니다.`);
      }
      if (hasAnyIng(ps, ['resveratrol', 'vitamin c'])) {
        if (timeOfDay === 'day' && hasAnyIng(ps, ['resveratrol', 'retinol'])) {
          addMsg(4, 'con', `🚨 [광독성 주의] ${ps.name} 성분은 자외선에 취약하여 낮에 바르면 색소침착을 유발할 수 있습니다! 밤에만 사용하세요.`);
          score -= 30;
        } else {
          addMsg(4, 'pro', `[${ps.name}] 강력한 항산화/안티에이징 작용으로 안색을 맑게 하고 노화를 방어합니다.`);
        }
      }
      if (hasAnyIng(ps, ['aha', 'bha', 'glycolic acid', 'retinol'])) {
        if (timeOfDay === 'day') {
          addMsg(4, 'con', `🚨 [자외선 주의] ${ps.name} 성분은 낮에 자외선과 만나면 화상을 유발할 수 있습니다! 반드시 밤에 쓰거나 선크림을 강력하게 바르세요.`);
          score -= 30;
        } else {
          addMsg(4, 'pro', `[${ps.name}] 묵은 각질과 모공을 매끄럽게 스케일링하여 턴오버 주기를 정상화합니다.`);
        }
      }
    });
  }

  // ========== S5 아이크림 ==========
  pEye.forEach((ec) => {
    addMsg(5, 'pro', `👁️ [${ec.name}] 아이케어 전용. 약지로 톡톡 두드려 흡수시키고 절대 문지르지 마세요.`);
    if (hasAnyIng(ec, ['retinol', 'aha', 'bha'])) {
      addMsg(5, 'con', `🚨 [눈가 고자극] ${ec.name}에 레티놀/산성 성분이 포함되어 있습니다. 소량만, 눈 점막에서 1cm 이상 떨어져 바르세요.`);
      score -= 10;
    }
  });
  if (pEye.length >= 2) {
    addMsg(5, 'con', `⚠️ [아이케어 중복] 아이크림은 1개만 사용하세요. 중복 레이어링은 밀리움(좁쌀 여드름)을 유발합니다.`);
    score -= 15;
  }

  // ========== S6 크림/선크림 ==========
  if (pCreamGeneral) {
    const pc = pCreamGeneral;
    const hasAcid = hasAnyIng(pSerum, ['aha', 'bha', 'glycolic acid', 'retinol']);

    if (pc.weight === 'light') {
      if (timeOfDay === 'day') addMsg(6, 'pro', `[${pc.name}] 밀림 없이 화사한 수분광만 남기는 완벽한 데이용 피니시 크림입니다.`);
      else addMsg(6, 'info', `밤에 바르기엔 수분 잠금 기능이 다소 가벼울 수 있으니 앞단계에서 보습을 든든히 채워주세요.`);
    }
    if (hasAnyIng(pc, ['liposome', 'ceramide', 'repair'])) {
      if (timeOfDay === 'day' && isOily && pc.weight !== 'light') {
        addMsg(6, 'con', `[${pc.name}] 고보습 리페어 크림이라 아침에 바르면 오후에 유분감이 올라올 수 있습니다.`);
      } else {
        addMsg(6, 'pro', `[${pc.name}] 지친 피부에 깊은 휴식을 주며, 손상된 장벽을 완벽하게 다독이고 복구합니다.`);
      }
    }
    if (hasAnyIng(pc, ['antiaging', 'caviar', 'peptides']) || pc.weight === 'heavy') {
      if (timeOfDay === 'day' && !isDry) {
        addMsg(6, 'con', `🚨 [모공 답답함] ${profile.skinType} 피부가 낮에 초고영양 제형을 바르면 모공이 막히고 답답할 수 있습니다.`);
        score -= 10;
      } else {
        addMsg(6, 'pro', `[${pc.name}] 나이트 스페셜 케어의 최고봉. 무너지는 탄력과 밀도를 코르셋처럼 꽉 잡아줍니다.`);
      }
    }
    if (hasAcid) {
      if (hasAnyIng(pc, ['ceramide', 'repair', 'panthenol', 'cica'])) {
        addMsg(6, 'pro', `★ [산성 진정 궁합] 각질이 탈락된 예민한 피부에 리페어 성분이 침투하여 자극을 완벽하게 진정시킵니다.`);
        score += 15;
      }
      if (hasAnyIng(pc, ['antiaging', 'caviar', 'shea butter']) || pc.weight === 'heavy') {
        addMsg(6, 'con', `🚨 [과영양/트러블 경고] 각질 제거 직후 모공이 열린 상태에서 초고영양 크림을 덮으면 과영양 뾰루지가 날 확률이 높습니다.`);
        score -= 20;
      }
    }
  }

  // 선크림
  if (timeOfDay === 'day') {
    if (sunCreams.length === 0) {
      addMsg(6, 'con', `🚨 [UV 차단 누락] 낮 루틴에 선크림이 없습니다! 자외선은 모든 피부 노화의 주범입니다.`);
      score -= 30;
    } else if (sunCreams.length >= 2) {
      addMsg(6, 'con', `⚠️ [선크림 중복] 선크림 2종 이상은 밀림·뭉침을 유발하고 SPF가 더 높아지지도 않습니다.`);
      score -= 10;
    } else {
      addMsg(6, 'pro', `☀️ [${sunCreams[0].name}] 낮 루틴의 마지막 단계에 적합합니다. 2-3시간마다 덧발라주면 완벽합니다.`);
      score += 10;
    }
  } else if (timeOfDay === 'night' && sunCreams.length > 0) {
    addMsg(6, 'con', `⚠️ [선크림 불필요] 저녁 루틴에 선크림은 불필요합니다. 자기 전엔 모공이 막히지 않도록 씻어내주세요.`);
    score -= 5;
  }

  // ========== S7 스페셜 ==========
  if (pPack.length > 0) {
    const realPacks = pPack.filter(
      (p) => p.packType !== 'exfoliate' && p.packType !== 'mist',
    );
    if (realPacks.length >= 2) {
      addMsg(7, 'con', `🚨 [팩 중복] 마스크팩/수면팩 2개 이상은 피부 호흡을 막아 트러블을 유발합니다. 하루 1종만 사용하세요.`);
      score -= 20;
    }

    pPack.forEach((pp) => {
      if ((pp.packType === 'sleeping' || hasAnyIng(pp, ['sleeping'])) && pCreamGeneral) {
        addMsg(7, 'con', `⚠️ [과영양 경고] 수면팩(${pp.name})과 크림(${pCreamGeneral.name})을 함께 쓰면 과영양으로 뾰루지가 날 수 있습니다.`);
        score -= 10;
      }
      const hasAcidInSerum = pSerum.some((p) =>
        hasAnyIng(p, ['aha', 'bha', 'retinol', 'glycolic acid']),
      );
      if (
        hasAcidInSerum &&
        (pp.packType === 'exfoliate' || hasAnyIng(pp, ['clay', 'scrub']))
      ) {
        addMsg(7, 'con', `🚨 [자극 충돌] 산성/레티놀 세럼 사용 후 각질 관리 팩은 장벽을 무너뜨립니다. 같은 날 병행 금지.`);
        score -= 25;
      }
      if (isSensitive && (hasAnyIng(pp, ['aha', 'bha']) || pp.packType === 'exfoliate')) {
        addMsg(7, 'con', `⚠️ [컨디션 충돌] 오늘 피부가 '${condition}' 상태입니다. 각질 팩은 건너뛰고 진정 마스크팩을 쓰세요.`);
        score -= 20;
      } else if (pp.packType === 'mask' || hasAnyIng(pp, ['cica', 'panthenol'])) {
        addMsg(7, 'pro', `★ [${pp.name}] 진정·보습 마스크팩은 피부 안정화에 탁월합니다. 15분 이내에 떼어내세요.`);
        score += 5;
      }
    });
  }

  if (score > 100) score = 100;
  if (score < 0) score = 0;
  const grade =
    score >= 90
      ? '최고의 궁합 🏆'
      : score >= 70
        ? '좋은 루틴 👍'
        : score >= 50
          ? '주의 필요 ⚠️'
          : '재설계 시급 🚨';

  return {
    score,
    grade,
    stepFeedback,
    selectedCount: selectedProducts.length,
  };
}

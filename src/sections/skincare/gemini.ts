/**
 * Google Gemini API 서비스 — 스킨케어 제품 AI 분석.
 *
 * 키는 사용자별로 Firestore의 SkincareProfile.apiKey에 보관된다.
 * 본 모듈은 React 의존성이 없는 순수 함수들로 구성된다.
 *
 * 모델 폴백 전략:
 *   - 이미지 포함: 2.5-pro → 2.5-flash → 2.5-flash-lite → 2.0-flash → 2.0-flash-lite
 *   - 텍스트만: 2.5-flash 우선 (속도/한도 유리), 나머지 동일 폴백
 *
 * 일시 에러(429/500/502/503/504)는 같은 모델에 백오프 후 1회 재시도, 그래도 실패하면 다음 모델로.
 * API_KEY_INVALID는 즉시 중단.
 */

import { ingredientDict } from './meta';
import type {
  CleanserType,
  LearnedIngredients,
  MechanismReport,
  PackType,
  Product,
  RoutineRecord,
  SkincareStep,
  Step6Sub,
  Weight,
} from './types';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models';

const TEXT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

const IMAGE_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiPayload {
  contents: { role: 'user'; parts: GeminiPart[] }[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isTransient = (status: number) =>
  status === 429 ||
  status === 500 ||
  status === 502 ||
  status === 503 ||
  status === 504;

/** 텍스트에서 JSON 객체/배열을 추출해 파싱 */
export function extractJsonFromText<T = unknown>(text: string): T {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) {
    console.error('[gemini] JSON 형태를 찾을 수 없음:', text);
    throw new Error('AI가 올바른 양식으로 답변하지 못했습니다. 한 번 더 시도해주세요.');
  }
  try {
    return JSON.parse(match[0]) as T;
  } catch (e) {
    console.error('[gemini] JSON 파싱 실패:', text, e);
    throw new Error('AI 응답을 해석할 수 없습니다. 한 번 더 시도해주세요.');
  }
}

/** Gemini API 호출 (모델 폴백 + 재시도 포함) */
async function callGemini(payload: GeminiPayload, apiKey: string): Promise<string> {
  const key = apiKey.trim();
  if (!key || key.length < 20) {
    throw new Error(
      'AI API 키가 설정되지 않았습니다.\n[내 정보] 모달에서 Gemini API 키를 입력하고 저장해주세요.',
    );
  }

  const hasImage = payload.contents[0].parts.some((p) => p.inlineData);
  const models = hasImage ? IMAGE_MODELS : TEXT_MODELS;

  const errorLogs: string[] = [];
  let lastTransientStatus: number | null = null;

  for (const model of models) {
    const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${key}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const responseText = await res.text();

        if (res.ok) {
          const data = JSON.parse(responseText) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        }

        errorLogs.push(`[${model}] 시도${attempt + 1} ➔ ❌ ${res.status}`);

        if (res.status === 400 && responseText.includes('API_KEY_INVALID')) {
          throw new Error(
            '⚠️ 발급하신 API 키가 유효하지 않습니다.\nGoogle AI Studio에서 새 키를 발급받아 입력해주세요.\n\nhttps://aistudio.google.com/app/apikey',
          );
        }

        if (isTransient(res.status)) {
          lastTransientStatus = res.status;
          if (attempt === 0) {
            const backoffMs = res.status === 429 ? 2500 : 800;
            await sleep(backoffMs);
            continue;
          }
          break; // 두 번 실패 → 다음 모델
        }

        // 일시 에러 아닌 실패 → 다음 모델
        break;
      } catch (err) {
        if (err instanceof Error && err.message.includes('API 키가')) throw err;
        if (err instanceof Error && err.message.includes('유효하지 않습니다')) throw err;
        const msg = err instanceof Error ? err.message : String(err);
        errorLogs.push(`[${model}] 시도${attempt + 1} ➔ 오류: ${msg}`);
        break;
      }
    }
  }

  let hint: string;
  if (lastTransientStatus === 429) {
    hint =
      '⏳ Gemini의 분당 요청 한도에 걸렸습니다.\n무료 등급은 분당 2~15회 한도이니 30초~1분 후 다시 시도해주세요.';
  } else if (lastTransientStatus && lastTransientStatus >= 500) {
    hint =
      '🌐 Gemini 서버가 일시적으로 과부하 상태입니다 (사용자 잘못 아님).\n1~3분 후 다시 시도해주세요.';
  } else {
    hint =
      'Gemini 서버에 연결할 수 없습니다.\nAI Studio에서 새 키를 발급받아보세요.';
  }
  throw new Error(`${hint}\n\n[진단 로그]\n${errorLogs.join('\n')}`);
}

/** AI가 분석한 제품 (Product의 일부 필드) */
export interface AiAnalyzedProduct {
  brand: string;
  name: string;
  step: SkincareStep;
  cleanserType?: CleanserType;
  subCategory?: Step6Sub;
  packType?: PackType;
  time?: 'day' | 'night' | 'all';
  weight?: Weight;
  keyIngredients: string[];
  cautionIngredients: string[];
  description?: string;
  usage?: string;
  precautions?: string;
}

function buildAnalyzePrompt(existingBrands: string[]): string {
  const brandsList =
    existingBrands.length > 0
      ? `\n\n[기존 등록된 브랜드 목록]\n${existingBrands.join(', ')}\n→ 분석할 제품이 위 브랜드 중 하나(한글·영문·띄어쓰기 변형 포함)와 동일하다면, brand 필드는 반드시 위 목록의 표기를 그대로 사용하세요. 예: 입력이 "라메르"여도 목록에 "LA MER"가 있으면 "LA MER"로 출력.`
      : '';

  return `당신은 세계 최고의 스킨케어 전문가입니다. 제공된 화장품의 이름이나 이미지를 분석하여 아래의 '출력 양식'에 맞춰 오직 순수한 JSON 형식으로만 대답하세요. 부가적인 설명이나 마크다운 기호(\`\`\` 등)는 절대 쓰지 마세요. description, usage, precautions는 반드시 한국어(Korean)로 작성해야 합니다.

[핵심 지시사항]
1. 성분 추출 시 영문 키워드로 분리:
   - 좋은/유효 성분 (keyIngredients): [Vitamin C, Ceramide, Panthenol, Cica, Hyaluronic Acid, Peptides, Liposome, Exosome, Resveratrol, Cooling, Softening, Antiaging, Repair]
   - 주의/자극 성분 (cautionIngredients): [AHA, BHA, Retinol, Alcohol, Fragrance, Silicone, Shea Butter]
2. step은 1~7 중 반드시 하나:
   - 1=클렌징, 2=미스트/퍼스트, 3=토너/로션, 4=세럼/앰플, 5=아이크림(독립), 6=크림/선크림, 7=스페셜(각질/수면팩/마스크팩)
3. step 1일 때 cleanserType 필수 (oil/balm/milk/foam/scrub)
4. step 6일 때 subCategory 필수 (general/suncream)
5. step 7일 때 packType 필수 (exfoliate/sleeping/mask/mist)

[usage 작성 규칙]
"usage"는 사용자가 실제로 따라할 수 있도록 단계별 절차로 작성하세요.
- 반드시 3~5개 번호 단계 ("1) ... 2) ... 3) ..." 형식)
- 각 단계는 구체적 행동: 사용량(예: 1펌프, 동전 크기), 부위(이마/볼/턱 등), 방향(안→밖, 위→아래), 시간(아침/저녁/주 N회), 후속 동작(흡수까지 두드리기 등)을 포함
- 줄바꿈은 "\\n"으로 구분 (실제 줄바꿈 문자)
예시: "1) 세안 후 토너로 결을 정돈한다.\\n2) 펌프를 1~2번 눌러 손바닥에 덜고 양 볼에 점찍어 바른다.\\n3) 안에서 바깥으로 부드럽게 펴 바르고 흡수될 때까지 가볍게 두드린다.\\n4) 아침·저녁 모두 사용 가능하지만, 특히 저녁에 사용하면 효과적이다."${brandsList}

[출력 양식]
{"brand":"브랜드 표기","name":"한국어 제품명","step":숫자(1~7),"cleanserType":"(step 1일때만)","subCategory":"(step 6일때만)","packType":"(step 7일때만)","time":"day|night|all","weight":"light|medium|heavy","keyIngredients":[],"cautionIngredients":[],"description":"한국어 특징 2줄","usage":"1) ... 2) ... 3) ... (단계별 번호 + \\n 줄바꿈)","precautions":"한국어 주의사항 2줄"}

[분석할 제품 정보]: `;
}

/** 레거시 packType 정규화 */
function normalizePackType(pt: unknown): PackType {
  if (pt === 'modeling' || pt === 'sheet') return 'mask';
  if (pt === 'washoff') return 'exfoliate';
  if (pt === 'exfoliate' || pt === 'sleeping' || pt === 'mask' || pt === 'mist')
    return pt;
  return 'mask';
}

/** AI 응답에 누락된 필수 서브타입 보완 + 정리 */
export function sanitizeAiResult(raw: AiAnalyzedProduct): AiAnalyzedProduct {
  const step = (
    typeof raw.step === 'number' ? raw.step : parseInt(String(raw.step), 10)
  ) as SkincareStep;
  return {
    ...raw,
    step: ([1, 2, 3, 4, 5, 6, 7] as SkincareStep[]).includes(step) ? step : 4,
    cleanserType: step === 1 ? (raw.cleanserType ?? 'foam') : undefined,
    subCategory: step === 6 ? (raw.subCategory ?? 'general') : undefined,
    packType: step === 7 ? normalizePackType(raw.packType) : undefined,
    weight: raw.weight ?? 'medium',
    keyIngredients: raw.keyIngredients ?? [],
    cautionIngredients: raw.cautionIngredients ?? [],
  };
}

/**
 * 제품명 또는 이미지로 제품 정보를 AI 분석.
 *
 * @param existingBrands 인벤토리에 이미 있는 브랜드 목록. 전달하면 AI가 동일 브랜드를
 *                       기존 표기로 통일해서 반환한다 (라메르 ↔ LA MER 같은 변형 흡수).
 */
export async function analyzeProduct(args: {
  input: string;
  imageBase64?: string;
  imageMime?: string;
  apiKey: string;
  existingBrands?: string[];
}): Promise<AiAnalyzedProduct> {
  const {
    input,
    imageBase64,
    imageMime = 'image/jpeg',
    apiKey,
    existingBrands = [],
  } = args;
  const promptText = buildAnalyzePrompt(existingBrands) + (input || '제품을 분석해주세요');
  const parts: GeminiPart[] = [{ text: promptText }];
  if (imageBase64) parts.push({ inlineData: { mimeType: imageMime, data: imageBase64 } });

  const responseText = await callGemini(
    { contents: [{ role: 'user', parts }] },
    apiKey,
  );
  const parsed = extractJsonFromText<AiAnalyzedProduct>(responseText);
  return sanitizeAiResult(parsed);
}

/**
 * 기존 제품(브랜드 + 이름)을 다시 분석.
 * 결과로 최신 분석 정보를 반환하므로 호출 측에서 inventory 업데이트.
 */
export async function reanalyzeProduct(args: {
  brand: string;
  name: string;
  apiKey: string;
  existingBrands?: string[];
}): Promise<AiAnalyzedProduct> {
  const { brand, name, apiKey, existingBrands } = args;
  return analyzeProduct({
    input: `${brand} ${name}`.trim(),
    apiKey,
    existingBrands,
  });
}

/**
 * 사전에 없는 미지 성분을 가장 잘 맞는 대표 카테고리에 매핑해서 학습.
 * 결과는 LearnedIngredients 객체(미지성분 → 카테고리명)로 반환.
 * 실패하면 빈 객체 반환 (조용히 무시).
 */
export async function learnIngredients(args: {
  ingredients: string[];
  apiKey: string;
  existingLearned: LearnedIngredients;
}): Promise<LearnedIngredients> {
  const { ingredients, apiKey, existingLearned } = args;
  const known = new Set(Object.keys(ingredientDict));
  const learnedKeys = new Set(Object.keys(existingLearned).map((k) => k.toLowerCase()));

  const unknowns = [...new Set(ingredients.map((s) => s.trim()))].filter((ing) => {
    const key = ing.toLowerCase();
    if (!key) return false;
    // 사전에 부분 매칭되는 게 있으면 known
    for (const dictKey of known) if (key.includes(dictKey)) return false;
    if (learnedKeys.has(key)) return false;
    return true;
  });

  if (unknowns.length === 0) return {};

  const prompt = `스킨케어 전문가로서 다음 미지 성분들을 가장 잘 맞는 대표 카테고리로 1:1 매핑해주세요. (반드시 아래 카테고리 중에서만 선택하세요)
[분류할 성분]: ${unknowns.join(', ')}
[선택할 카테고리]: AHA, BHA, Retinol, Vitamin C, Ceramide, Panthenol, Cica, Hyaluronic Acid, Peptides, Liposome, Exosome, Resveratrol, Cooling, Softening, Antiaging, Repair

[출력 양식 (오직 순수 JSON만)]
{"미지성분1": "카테고리명", "미지성분2": "카테고리명"}`;

  try {
    const responseText = await callGemini(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      apiKey,
    );
    return extractJsonFromText<LearnedIngredients>(responseText);
  } catch (e) {
    console.error('[gemini] 성분 학습 실패 (무시):', e);
    return {};
  }
}

/**
 * 저장된 루틴 기록에 대한 시너지 메커니즘 분석.
 * 각 제품이 앞 단계와 어떻게 시너지를 내는지, 종합 평가, 개선 권장사항 반환.
 */
export async function generateMechanismReport(args: {
  record: RoutineRecord;
  inventory: Product[];
  apiKey: string;
}): Promise<MechanismReport> {
  const { record, inventory, apiKey } = args;

  // step 순서대로 제품 정렬
  const orderedItems: { stepLabel: string; brand: string; name: string; keyIngredients: string[]; cautionIngredients: string[] }[] = [];
  for (const s of [1, 2, 3, 4, 5, 6, 7] as SkincareStep[]) {
    const ids = record.routine[s] ?? [];
    ids.forEach((id, idx) => {
      const p = inventory.find((i) => i.id === id);
      if (!p) return;
      const label = ids.length > 1 ? `S${s}-${idx + 1}` : `S${s}`;
      orderedItems.push({
        stepLabel: label,
        brand: p.brand,
        name: p.name,
        keyIngredients: p.keyIngredients ?? [],
        cautionIngredients: p.cautionIngredients ?? [],
      });
    });
  }

  if (orderedItems.length === 0) {
    throw new Error('분석할 제품이 없습니다.');
  }

  const timeLabel = record.timeOfDay === 'day' ? '아침/낮' : '저녁/밤';
  const themeText =
    record.timeOfDay === 'day' ? 'DAY DEFENSE MECHANISM' : 'NIGHT REPAIR MECHANISM';

  const prompt = `당신은 세계 최고의 피부과학 연구원입니다. 아래 저장된 스킨케어 루틴을 **시너지 메커니즘 중심**으로 분석합니다. 단순 제품 소개가 아니라, **앞 단계 제품이 만든 상태 위에 지금 단계가 어떻게 반응·상승작용·중화하는지**를 설명하세요.

[루틴 정보]
- 날짜: ${record.date}
- 시간대: ${timeLabel}
- 컨디션: ${record.condition}
- 케어 목표: ${record.goal}
- 기록 당시 점수: ${record.score}점
- 사용 제품 (Step 순서):
${orderedItems.map((it) => `  ${it.stepLabel}. ${it.brand} ${it.name} — 핵심성분: ${it.keyIngredients.join(', ') || '없음'} / 주의성분: ${it.cautionIngredients.join(', ') || '없음'}`).join('\n')}

[출력 JSON 스키마 — 오직 순수 JSON만, 마크다운 펜스 절대 금지]
{
  "title": "오늘의 ${timeLabel} 루틴 시너지 메커니즘 분석 (10자 이내 짧은 부제목 한 줄 추가)",
  "steps": [
    {
      "stepLabel": "S1 또는 S4-1 형식",
      "brand": "BRAND",
      "productName": "한국어 제품명",
      "role": "핵심 작용원리 3~7글자 (예: 지질막 보호 세정, 수분 자석, 표적 진정)",
      "body": "2~3문장으로 작용 메커니즘 설명. 첫 제품(S1)은 본인의 작용. 두 번째 이상은 반드시 앞 단계가 만든 상태(수분막/흡수로/진정상태)와 연결해서 시너지를 설명. 줄바꿈은 \\n으로.",
      "result": "이 단계 직후의 피부 상태 한 줄 (예: 수분 고속도로 개통, 유효성분 증발 차단)"
    }
  ],
  "conclusion": "3문단으로 평가: 1)이 루틴의 설계 철학, 2)주요 시너지 포인트, 3)전반 평가. 각 문단은 2~3문장. 문단 사이 줄바꿈 \\n\\n 으로 구분.",
  "improvements": "객관적 관점에서 발견된 문제점이 있으면 '⚠️ 개선 권장:' 헤더 후 구체적 문제·해결책을 작성. 사소한 개선만 있으면 '💡 참고:' 헤더로 가볍게. 정말 완벽하면 빈 문자열. 억지로 좋은 말 금지."
}

[엄격한 요구사항]
1. steps 배열은 "사용 제품" 순서 그대로 일대일 대응. 순서 변경 절대 금지.
2. 같은 step에 제품 2개 이상이면 stepLabel을 "S4-1", "S4-2"로 분리.
3. body는 단답형 2~3문장, 장황한 설명 금지.
4. 모든 줄바꿈은 실제 줄바꿈(\\n) 사용. <p>나 <br> 같은 HTML 태그 사용 금지.
5. JSON만 출력. 부가 설명·마크다운 펜스 일체 금지.
6. 부제: ${themeText} 가 영문 부제. title 안에 자연스럽게 녹여서 넣을 것.`;

  const responseText = await callGemini(
    { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
    apiKey,
  );
  const parsed = extractJsonFromText<Omit<MechanismReport, 'generatedAt'>>(responseText);

  if (!parsed.steps || !Array.isArray(parsed.steps)) {
    throw new Error('리포트 형식이 올바르지 않습니다.');
  }

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 파일을 base64 + MIME 타입으로 읽는다.
 * Gemini가 허용하는 MIME만 통과 (그 외엔 jpeg로 fallback).
 */
export function readImageAsBase64(
  file: File,
): Promise<{ base64: string; mime: string }> {
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const mime = ALLOWED.includes(file.type) ? file.type : 'image/jpeg';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('이미지 데이터를 읽을 수 없습니다.'));
        return;
      }
      const base64 = result.split(',')[1] ?? '';
      resolve({ base64, mime });
    };
    reader.readAsDataURL(file);
  });
}

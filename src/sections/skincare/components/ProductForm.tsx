import { useEffect, useMemo, useState } from 'react';
import type {
  CleanserType,
  PackType,
  Product,
  SkincareStep,
  Step6Sub,
  Weight,
} from '../types';
import {
  cleanserTypes,
  packTypes,
  step6Subs,
  stepMeta,
} from '../meta';
import { useSkincare } from '../useSkincare';
import { uniqueBrands } from '../brand';

interface ProductFormProps {
  initial?: Partial<Product>;
  /** 폼 데이터가 바뀔 때마다 호출 (저장 버튼은 부모에서 관리) */
  onChange: (data: ProductDraft) => void;
  /** 입력 유효성 — 부모가 저장 버튼 disabled 처리에 사용 */
  onValidity?: (valid: boolean) => void;
}

/** 폼이 다루는 드래프트 데이터 (id, createdAt 제외) */
export interface ProductDraft {
  brand: string;
  name: string;
  step: SkincareStep;
  cleanserType?: CleanserType;
  subCategory?: Step6Sub;
  packType?: PackType;
  weight: Weight;
  keyIngredients: string[];
  cautionIngredients: string[];
  description: string;
}

const WEIGHT_OPTS: { value: Weight; label: string }[] = [
  { value: 'light', label: '가벼움' },
  { value: 'medium', label: '중간' },
  { value: 'heavy', label: '무거움' },
];

/** 콤마/줄바꿈 구분 입력값을 배열로 변환 */
function parseList(s: string): string[] {
  return s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinList(arr: string[] | undefined): string {
  return (arr ?? []).join(', ');
}

export default function ProductForm({
  initial,
  onChange,
  onValidity,
}: ProductFormProps) {
  const { data } = useSkincare();
  // 기존 인벤토리 브랜드 목록 — datalist 자동완성에 사용 (오타·표기 분기 방지)
  const brandSuggestions = useMemo(() => uniqueBrands(data.inventory), [data.inventory]);

  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [step, setStep] = useState<SkincareStep>(initial?.step ?? 4);
  const [cleanserType, setCleanserType] = useState<CleanserType | undefined>(
    initial?.cleanserType,
  );
  const [subCategory, setSubCategory] = useState<Step6Sub | undefined>(
    initial?.subCategory ?? (initial?.step === 6 ? 'general' : undefined),
  );
  const [packType, setPackType] = useState<PackType | undefined>(initial?.packType);
  const [weight, setWeight] = useState<Weight>(initial?.weight ?? 'medium');
  const [keyIng, setKeyIng] = useState(joinList(initial?.keyIngredients));
  const [cauIng, setCauIng] = useState(joinList(initial?.cautionIngredients));
  const [description, setDescription] = useState(initial?.description ?? '');

  // step이 1/6/7 외로 바뀔 때 서브타입 정리
  useEffect(() => {
    if (step !== 1) setCleanserType(undefined);
    else if (!cleanserType) setCleanserType('foam');
    if (step !== 6) setSubCategory(undefined);
    else if (!subCategory) setSubCategory('general');
    if (step !== 7) setPackType(undefined);
    else if (!packType) setPackType('mask');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // 변경 시 부모에 알림
  useEffect(() => {
    const draft: ProductDraft = {
      brand: brand.trim(),
      name: name.trim(),
      step,
      cleanserType: step === 1 ? cleanserType : undefined,
      subCategory: step === 6 ? subCategory : undefined,
      packType: step === 7 ? packType : undefined,
      weight,
      keyIngredients: parseList(keyIng),
      cautionIngredients: parseList(cauIng),
      description: description.trim(),
    };
    onChange(draft);
    const valid = !!draft.brand && !!draft.name;
    onValidity?.(valid);
  }, [
    brand,
    name,
    step,
    cleanserType,
    subCategory,
    packType,
    weight,
    keyIng,
    cauIng,
    description,
    onChange,
    onValidity,
  ]);

  return (
    <div className="grid gap-4">
      {/* 브랜드 + 이름 */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="브랜드 *" className="col-span-1">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="예: VALMONT"
            list="brand-suggestions"
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
          />
          {/* 기존 브랜드 자동완성 — 입력 시 일치하는 항목이 드롭다운으로 나옴 */}
          <datalist id="brand-suggestions">
            {brandSuggestions.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="제품명 *" className="col-span-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 아토베리어 365 세럼"
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
          />
        </Field>
      </div>
      {brandSuggestions.length > 0 && (
        <div className="-mt-2 text-[11px] text-slate-400">
          💡 기존 등록 브랜드: {brandSuggestions.slice(0, 5).join(', ')}
          {brandSuggestions.length > 5 ? ` 외 ${brandSuggestions.length - 5}개` : ''}
          {' — '}동일 브랜드면 같은 표기를 사용해 주세요.
        </div>
      )}

      {/* 단계 선택 */}
      <Field label="단계 *">
        <div className="grid grid-cols-7 gap-1.5">
          {(Object.keys(stepMeta) as unknown as SkincareStep[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                step === s
                  ? 'bg-brand-ink text-brand-accent'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={stepMeta[s].label}
            >
              {stepMeta[s].short}
            </button>
          ))}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {stepMeta[step].label} — {stepMeta[step].desc}
        </div>
      </Field>

      {/* 서브타입: Step1 클렌저 */}
      {step === 1 && (
        <Field label="클렌저 종류">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(cleanserTypes) as CleanserType[]).map((k) => {
              const c = cleanserTypes[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCleanserType(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    cleanserType === k
                      ? 'bg-brand-ink text-brand-accent'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {/* 서브타입: Step6 일반/선크림 */}
      {step === 6 && (
        <Field label="크림 종류">
          <div className="flex gap-1.5">
            {(Object.keys(step6Subs) as Step6Sub[]).map((k) => {
              const s = step6Subs[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSubCategory(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    subCategory === k
                      ? 'bg-brand-ink text-brand-accent'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {/* 서브타입: Step7 팩 */}
      {step === 7 && (
        <Field label="스페셜 종류">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(packTypes) as PackType[]).map((k) => {
              const p = packTypes[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPackType(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    packType === k
                      ? 'bg-brand-ink text-brand-accent'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {/* 무게감 */}
      <Field label="제형 무게감">
        <div className="flex gap-1.5">
          {WEIGHT_OPTS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setWeight(w.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                weight === w.value
                  ? 'bg-brand-ink text-brand-accent'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </Field>

      {/* 핵심 성분 */}
      <Field label="핵심 성분 (쉼표로 구분)" hint="예: hyaluronic acid, panthenol, cica">
        <input
          value={keyIng}
          onChange={(e) => setKeyIng(e.target.value)}
          placeholder="hyaluronic acid, panthenol"
          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
        />
      </Field>

      {/* 주의 성분 */}
      <Field label="주의 성분 (선택)" hint="향료, 알코올, AHA 등">
        <input
          value={cauIng}
          onChange={(e) => setCauIng(e.target.value)}
          placeholder="fragrance, alcohol"
          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
        />
      </Field>

      {/* 설명 (선택) */}
      <Field label="메모 (선택)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="이 제품에 대해 기억할 만한 내용"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20 resize-none"
        />
      </Field>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={`block ${className ?? ''}`}>
      <div className="text-xs font-bold text-slate-700 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
    </label>
  );
}

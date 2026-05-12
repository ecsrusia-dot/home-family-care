import { useEffect, useState } from 'react';
import {
  Check,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  cleanserTypes,
  packTypes,
  step6Subs,
  stepMeta,
} from '../meta';
import { getIngredientDetails, getProductBadges } from '../utils';
import type {
  CleanserType,
  IngredientInfo,
  PackType,
  Product,
  SkincareStep,
  Step6Sub,
} from '../types';
import IngredientInfoModal from './IngredientInfoModal';
import StepMoveModal from './StepMoveModal';
import { reanalyzeProduct } from '../gemini';
import { useSkincare } from '../useSkincare';
import { uniqueBrands } from '../brand';

interface Props {
  product: Product | null;
  onClose: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

const WEIGHT_LABEL: Record<string, { icon: string; label: string }> = {
  light: { icon: '💧', label: '가벼움' },
  medium: { icon: '🧴', label: '중간' },
  heavy: { icon: '🍯', label: '무거움' },
};

const TIME_LABEL: Record<string, string> = {
  day: '☀️ 낮 전용',
  night: '🌙 밤 전용',
  all: '☀️/🌙 공용',
};

export default function ProductDetailModal({
  product: stale,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const { data, update } = useSkincare();
  const [nameEditMode, setNameEditMode] = useState(false);
  const [nameDraft, setNameDraft] = useState({ brand: '', name: '' });
  const [ingredientDetail, setIngredientDetail] =
    useState<IngredientInfo | null>(null);
  const [stepMoveOpen, setStepMoveOpen] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // 항상 inventory에서 최신 버전을 가져와 사용 (이름·step·재분석 후 즉시 반영)
  const product = stale
    ? (data.inventory.find((p) => p.id === stale.id) ?? stale)
    : null;

  // 모달 닫힐 때 인라인 편집 상태 초기화
  useEffect(() => {
    if (!product) setNameEditMode(false);
  }, [product]);

  // ESC로 닫기 (체인 모달 우선 닫음)
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (ingredientDetail) {
        setIngredientDetail(null);
        return;
      }
      if (stepMoveOpen || nameEditMode) return; // 서브 모달이 처리
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, ingredientDetail, stepMoveOpen, nameEditMode, onClose]);

  if (!product) return null;

  const startNameEdit = () => {
    setNameDraft({ brand: product.brand, name: product.name });
    setNameEditMode(true);
  };

  const saveNameEdit = async () => {
    const brand = nameDraft.brand.trim();
    const name = nameDraft.name.trim();
    if (!brand || !name) return;
    const next = data.inventory.map((p) =>
      p.id === product.id ? { ...p, brand, name } : p,
    );
    await update({ inventory: next });
    setNameEditMode(false);
  };

  const applyStepMove = async (next: {
    step: SkincareStep;
    cleanserType?: CleanserType;
    subCategory?: Step6Sub;
    packType?: PackType;
  }) => {
    const updated: Product = {
      ...product,
      step: next.step,
      cleanserType: next.cleanserType,
      subCategory: next.subCategory,
      packType: next.packType,
    };
    const nextInventory = data.inventory.map((p) =>
      p.id === product.id ? updated : p,
    );
    await update({ inventory: nextInventory });
  };

  const onReanalyze = async () => {
    if (!data.profile.apiKey?.trim()) {
      alert(
        'AI 재분석을 사용하려면 [내 정보]에서 Gemini API 키를 입력해주세요.',
      );
      return;
    }
    if (
      !confirm(
        '이 제품의 정보를 AI로 다시 분석할까요?\n브랜드와 제품명을 기준으로 분석하며, 결과는 자동 저장됩니다.',
      )
    )
      return;

    setReanalyzing(true);
    try {
      const result = await reanalyzeProduct({
        brand: product.brand,
        name: product.name,
        apiKey: data.profile.apiKey,
        existingBrands: uniqueBrands(data.inventory),
      });
      const updated: Product = {
        ...product,
        ...result,
        // 사용자가 손으로 바꿔둔 브랜드/이름은 유지 (재분석으로 안 덮어씀)
        brand: product.brand,
        name: product.name,
      };
      const next = data.inventory.map((p) =>
        p.id === product.id ? updated : p,
      );
      await update({ inventory: next });
      alert('AI 재분석이 완료되어 정보가 업데이트되었습니다.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'AI 재분석 실패');
    } finally {
      setReanalyzing(false);
    }
  };

  const badges = getProductBadges(product);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white w-full md:max-w-md max-h-[92vh] rounded-t-3xl md:rounded-3xl overflow-y-auto shadow-2xl relative hide-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 닫기 버튼 (히어로 위에) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/15 hover:bg-white/30 text-white p-2 rounded-full z-10 transition"
            aria-label="닫기"
          >
            <X size={18} />
          </button>

          {/* 히어로 헤더 (다크 그라데이션) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-7 pt-10 pb-9">
            {nameEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1.5">
                    브랜드
                  </label>
                  <input
                    value={nameDraft.brand}
                    onChange={(e) =>
                      setNameDraft((d) => ({ ...d, brand: e.target.value }))
                    }
                    placeholder="브랜드명"
                    className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1.5">
                    제품명
                  </label>
                  <input
                    value={nameDraft.name}
                    onChange={(e) =>
                      setNameDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    placeholder="제품명"
                    className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-lg px-3 py-2 text-base font-bold focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveNameEdit}
                    className="flex-1 bg-yellow-400 text-slate-900 font-bold py-2.5 rounded-lg hover:bg-yellow-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <Check size={14} /> 저장
                  </button>
                  <button
                    onClick={() => setNameEditMode(false)}
                    className="flex-1 bg-white/10 text-white font-bold py-2.5 rounded-lg hover:bg-white/20 border border-white/20 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-yellow-400 text-xs font-bold mb-2 tracking-widest uppercase pr-10">
                  {product.brand}
                </div>
                <h3 className="text-white text-xl font-bold leading-snug break-keep">
                  {product.name}
                </h3>
                <button
                  onClick={startNameEdit}
                  className="mt-3 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/25 text-yellow-400 px-3 py-1.5 rounded-lg border border-white/20 text-[11px] font-bold transition"
                  title="브랜드와 제품명을 수정합니다"
                >
                  <Pencil size={11} /> 이름 수정
                </button>
              </div>
            )}
          </div>

          {/* 본문 */}
          <div className="p-6 space-y-6">
            {/* 뱃지 행: step 이동 버튼 + 서브타입 + 시간대 + 무게감 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStepMoveOpen(true)}
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-300 flex items-center gap-1.5 transition"
                title="제품군 변경"
              >
                Step {product.step} · {stepMeta[product.step].label}
                <Sliders size={11} />
              </button>

              {product.step === 1 && product.cleanserType && (
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-200">
                  {cleanserTypes[product.cleanserType].icon}{' '}
                  {cleanserTypes[product.cleanserType].label}
                </span>
              )}
              {product.step === 6 && product.subCategory && (
                <span className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-pink-200">
                  {step6Subs[product.subCategory].icon}{' '}
                  {step6Subs[product.subCategory].label}
                </span>
              )}
              {product.step === 7 && product.packType && (
                <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-200">
                  {packTypes[product.packType].icon}{' '}
                  {packTypes[product.packType].label}
                </span>
              )}

              {product.time && (
                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                  {TIME_LABEL[product.time] ?? product.time}
                </span>
              )}
              {product.weight && WEIGHT_LABEL[product.weight] && (
                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                  {WEIGHT_LABEL[product.weight].icon}{' '}
                  {WEIGHT_LABEL[product.weight].label}
                </span>
              )}
            </div>

            {/* 기능 태그 (자동 생성된 뱃지) */}
            {badges.length > 0 && (
              <Section title="기능 태그">
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <span
                      key={b.key}
                      className={`text-xs px-2.5 py-1 rounded font-bold border ${b.color}`}
                    >
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* 핵심 성분 (칩 + 클릭 팝업) */}
            {product.keyIngredients && product.keyIngredients.length > 0 && (
              <Section
                title="핵심 성분"
                hint="(클릭하여 기능 확인)"
              >
                <div className="flex flex-wrap gap-2">
                  {product.keyIngredients.map((ing) => (
                    <button
                      key={ing}
                      onClick={() =>
                        setIngredientDetail(getIngredientDetails(ing, 'pro'))
                      }
                      className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition"
                    >
                      {ing}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* 주의 성분 */}
            {product.cautionIngredients &&
              product.cautionIngredients.length > 0 && (
                <Section
                  title={
                    <span className="flex items-center gap-1.5 text-red-400">
                      <ShieldAlert size={12} /> 주의 성분
                    </span>
                  }
                  hint="(클릭하여 기능 확인)"
                >
                  <div className="flex flex-wrap gap-2">
                    {product.cautionIngredients.map((ing) => (
                      <button
                        key={ing}
                        onClick={() =>
                          setIngredientDetail(
                            getIngredientDetails(ing, 'caution'),
                          )
                        }
                        className="bg-red-50 text-red-700 px-2.5 py-1 rounded text-xs font-bold border border-red-100 hover:bg-red-100 transition"
                      >
                        {ing}
                      </button>
                    ))}
                  </div>
                </Section>
              )}

            {/* 기능 및 특징 (description) */}
            {product.description && (
              <Section title="기능 및 특징">
                <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap break-keep">
                  {product.description}
                </p>
              </Section>
            )}

            {/* 권장 사용법 (yellow box) — AI가 "1) ... 2) ..." 단계별로 작성, 줄바꿈 보존 */}
            {product.usage && (
              <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100">
                <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Zap size={12} /> 권장 사용법
                </h4>
                <p className="text-sm text-yellow-900 leading-relaxed break-keep whitespace-pre-line">
                  {product.usage}
                </p>
              </div>
            )}

            {/* 전문가 주의사항 (red box) */}
            {product.precautions && (
              <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ShieldAlert size={12} /> 전문가 주의사항
                </h4>
                <p className="text-sm text-red-900 leading-relaxed break-keep">
                  {product.precautions}
                </p>
              </div>
            )}

            {/* AI 재분석 버튼 */}
            <div className="pt-2">
              <button
                onClick={onReanalyze}
                disabled={reanalyzing}
                className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-60 border border-indigo-200 font-bold py-3 rounded-xl transition"
              >
                <RefreshCw size={14} className={reanalyzing ? 'animate-spin' : ''} />
                {reanalyzing ? 'AI 재분석 중…' : 'AI로 이 제품 다시 분석하기'}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
                제품 정보가 부정확하거나 더 나은 분석이 필요할 때만 사용하세요
              </p>
            </div>

            {/* 수정 / 삭제 액션 */}
            <div className="pt-1 flex gap-2">
              <button
                onClick={() => onDelete(product)}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 border border-red-100 flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 size={14} /> 삭제
              </button>
              <button
                onClick={() => onEdit(product)}
                className="flex-1 h-11 rounded-xl bg-brand-ink text-brand-accent text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <Pencil size={14} /> 상세 수정
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 성분 상세 미니 모달 */}
      <IngredientInfoModal
        ingredient={ingredientDetail}
        onClose={() => setIngredientDetail(null)}
      />

      {/* 제품군 이동 모달 */}
      <StepMoveModal
        product={stepMoveOpen ? product : null}
        onClose={() => setStepMoveOpen(false)}
        onApply={applyStepMove}
      />
    </>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        {title}
        {hint && (
          <span className="font-normal text-[10px] ml-1 normal-case tracking-normal">
            {hint}
          </span>
        )}
      </h4>
      {children}
    </div>
  );
}

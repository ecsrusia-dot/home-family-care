import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { cleanserTypes, packTypes, step6Subs, stepMeta } from '../meta';
import type {
  CleanserType,
  PackType,
  Product,
  SkincareStep,
  Step6Sub,
} from '../types';

interface Props {
  product: Product | null;
  onClose: () => void;
  onApply: (next: {
    step: SkincareStep;
    cleanserType?: CleanserType;
    subCategory?: Step6Sub;
    packType?: PackType;
  }) => Promise<void> | void;
}

/**
 * 제품군(Step) 이동 모달.
 * - Step 1: 클렌저 서브타입 선택
 * - Step 6: 일반/선크림 서브타입
 * - Step 7: 스페셜 타입
 * - 그 외: Step만 변경
 */
export default function StepMoveModal({ product, onClose, onApply }: Props) {
  const [step, setStep] = useState<SkincareStep>(1);
  const [cleanserType, setCleanserType] = useState<CleanserType>('foam');
  const [subCategory, setSubCategory] = useState<Step6Sub>('general');
  const [packType, setPackType] = useState<PackType>('mask');
  const [busy, setBusy] = useState(false);

  // 모달 열릴 때 product 기준으로 초기화
  useEffect(() => {
    if (product) {
      setStep(product.step);
      setCleanserType(product.cleanserType ?? 'foam');
      setSubCategory(product.subCategory ?? 'general');
      setPackType(product.packType ?? 'mask');
      setBusy(false);
    }
  }, [product]);

  if (!product) return null;

  const apply = async () => {
    setBusy(true);
    try {
      await onApply({
        step,
        cleanserType: step === 1 ? cleanserType : undefined,
        subCategory: step === 6 ? subCategory : undefined,
        packType: step === 7 ? packType : undefined,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="제품군 이동"
      size="sm"
      footer={
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm"
          >
            취소
          </button>
          <button
            onClick={apply}
            disabled={busy}
            className="flex-1 h-11 rounded-lg bg-brand-ink text-brand-accent font-bold text-sm disabled:opacity-60"
          >
            {busy ? '이동 중…' : '이동 적용'}
          </button>
        </div>
      }
    >
      <div className="mb-4">
        <div className="text-xs font-bold text-indigo-600">{product.brand}</div>
        <div className="text-sm font-bold text-slate-900 truncate">{product.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">
          현재: Step {product.step} · {stepMeta[product.step].label}
        </div>
      </div>

      <div className="grid gap-3">
        <label className="block">
          <div className="text-xs font-bold text-slate-500 mb-1.5">새 Step</div>
          <select
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value, 10) as SkincareStep)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-ink/20 outline-none"
          >
            {([1, 2, 3, 4, 5, 6, 7] as SkincareStep[]).map((s) => (
              <option key={s} value={s}>
                Step {s} · {stepMeta[s].label}
              </option>
            ))}
          </select>
        </label>

        {step === 1 && (
          <label className="block">
            <div className="text-xs font-bold text-slate-500 mb-1.5">클렌저 타입</div>
            <select
              value={cleanserType}
              onChange={(e) => setCleanserType(e.target.value as CleanserType)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-ink/20 outline-none"
            >
              {(Object.entries(cleanserTypes) as [CleanserType, { icon: string; label: string }][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.icon} {v.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {step === 6 && (
          <label className="block">
            <div className="text-xs font-bold text-slate-500 mb-1.5">서브 카테고리</div>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value as Step6Sub)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-ink/20 outline-none"
            >
              {(Object.entries(step6Subs) as [Step6Sub, { icon: string; label: string }][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.icon} {v.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {step === 7 && (
          <label className="block">
            <div className="text-xs font-bold text-slate-500 mb-1.5">제품 타입</div>
            <select
              value={packType}
              onChange={(e) => setPackType(e.target.value as PackType)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-ink/20 outline-none"
            >
              {(Object.entries(packTypes) as [PackType, { icon: string; label: string }][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.icon} {v.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-[11px] text-yellow-800 leading-relaxed">
          💡 제품군 이동 시 향후 저장된 루틴 기록에서 해당 제품은 새 단계에 위치합니다.
        </div>
      </div>
    </Modal>
  );
}

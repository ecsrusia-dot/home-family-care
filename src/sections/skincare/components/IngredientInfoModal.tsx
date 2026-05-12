import { CheckCircle2, ShieldAlert, X } from 'lucide-react';
import type { IngredientInfo } from '../types';

interface Props {
  ingredient: IngredientInfo | null;
  onClose: () => void;
}

/**
 * 성분 칩 클릭 시 뜨는 작은 정보 팝업.
 * 레거시의 selectedIngData 미니 모달과 동일한 UX.
 */
export default function IngredientInfoModal({ ingredient, onClose }: Props) {
  if (!ingredient) return null;
  const isPro = ingredient.type === 'pro';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1.5 transition"
          aria-label="닫기"
        >
          <X size={14} />
        </button>
        <div className="flex flex-col items-center text-center mt-2">
          {isPro ? (
            <CheckCircle2 size={36} className="text-indigo-500 mb-3" />
          ) : (
            <ShieldAlert size={36} className="text-red-500 mb-3" />
          )}
          <h3
            className={`text-lg font-bold mb-3 ${
              isPro ? 'text-indigo-700' : 'text-red-700'
            }`}
          >
            {ingredient.name}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed break-keep">
            {ingredient.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

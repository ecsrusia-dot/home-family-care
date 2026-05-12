import { Plus, X } from 'lucide-react';
import { cleanserTypes, packTypes, step6Subs, stepMeta } from '../meta';
import type { Product, SkincareStep } from '../types';

interface Props {
  step: SkincareStep;
  selectedIds: string[];
  inventory: Product[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

/**
 * 시뮬레이터·편집 모달에서 공통으로 사용하는 단계 한 줄.
 * - 좌측에 S{N} 동그라미
 * - 선택된 제품들을 노란 테두리 카드로 표시
 * - S4(세럼)는 자동으로 1, 2 순서 번호 표시
 * - 하단에 추가 버튼
 */
export default function RoutineStepRow({
  step,
  selectedIds,
  inventory,
  onAdd,
  onRemove,
}: Props) {
  const meta = stepMeta[step];
  const selectedItems = selectedIds
    .map((id) => inventory.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  return (
    <div className="relative pl-10">
      {/* 스텝 뱃지 */}
      <div className="absolute left-0 top-0.5 w-8 h-8 bg-slate-900 text-yellow-400 rounded-full flex items-center justify-center font-bold text-[11px] shadow-md">
        S{step}
      </div>

      <div className="text-xs font-bold text-slate-500 mb-1.5">{meta.label}</div>

      {/* 선택된 제품 카드들 */}
      <div className="grid gap-1.5 mb-1.5">
        {selectedItems.map((item, idx) => {
          const sub =
            item.step === 1 && item.cleanserType
              ? cleanserTypes[item.cleanserType]
              : item.step === 6 && item.subCategory
                ? step6Subs[item.subCategory]
                : item.step === 7 && item.packType
                  ? packTypes[item.packType]
                  : null;
          return (
            <div
              key={item.id}
              className="p-2.5 border-2 border-yellow-400 bg-white rounded-lg shadow-sm flex items-center gap-2"
            >
              {step === 4 && (
                <div className="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded font-bold">
                    {item.brand}
                  </span>
                  {sub && (
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                      {sub.icon} {sub.label}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                  {item.name}
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="shrink-0 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                title="제거"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* 추가 버튼 */}
      <button
        onClick={onAdd}
        className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
      >
        <Plus size={14} />
        {selectedItems.length === 0 ? `${meta.label} 추가` : '더 추가'}
      </button>
    </div>
  );
}

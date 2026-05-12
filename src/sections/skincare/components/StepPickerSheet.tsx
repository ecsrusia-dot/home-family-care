import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import {
  cleanserTypes,
  packTypes,
  step6Subs,
  stepMeta,
} from '../meta';
import type { Product, SkincareStep } from '../types';
import { getProductBadges } from '../utils';

interface Props {
  step: SkincareStep | null;
  inventory: Product[];
  selectedIds: string[];
  onClose: () => void;
  /** 토글: 이미 선택돼 있으면 해제, 없으면 추가 */
  onToggle: (id: string) => void;
  /** AI 등록 모달을 띄울 때 사용 (선택적) */
  onAiRegister?: () => void;
}

/**
 * 단계별 제품 선택 바텀시트.
 * - 해당 step에 속하는 제품만 표시
 * - 검색으로 좁히기
 * - 다중 선택 가능 (S4 세럼 등)
 */
export default function StepPickerSheet({
  step,
  inventory,
  selectedIds,
  onClose,
  onToggle,
  onAiRegister,
}: Props) {
  const [search, setSearch] = useState('');

  const candidates = useMemo(() => {
    if (step === null) return [];
    const s = search.trim().toLowerCase();
    return inventory.filter((p) => {
      if (p.step !== step) return false;
      if (!s) return true;
      const hay = `${p.brand} ${p.name} ${(p.keyIngredients ?? []).join(' ')}`.toLowerCase();
      return hay.includes(s);
    });
  }, [step, inventory, search]);

  if (step === null) return null;
  const meta = stepMeta[step];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-md max-h-[85vh] rounded-t-3xl md:rounded-3xl flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="text-xs font-bold text-yellow-600">STEP {step}</div>
            <div className="text-lg font-bold text-slate-900">{meta.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{meta.desc}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onAiRegister && (
              <button
                onClick={onAiRegister}
                className="bg-yellow-400 text-slate-900 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:bg-yellow-500 transition"
                title="AI로 새 제품 등록"
              >
                <Plus size={14} /> AI 등록
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제품·브랜드·성분 검색"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
            />
          </div>
        </div>

        {/* 후보 목록 */}
        <div className="flex-1 overflow-y-auto px-5 py-2 hide-scrollbar">
          {candidates.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              {inventory.filter((p) => p.step === step).length === 0
                ? '이 단계에 등록된 제품이 없습니다.'
                : '검색 결과가 없습니다.'}
            </div>
          ) : (
            <ul className="grid gap-1.5">
              {candidates.map((p) => {
                const selected = selectedIds.includes(p.id);
                const badges = getProductBadges(p);
                const sub =
                  p.step === 1 && p.cleanserType
                    ? cleanserTypes[p.cleanserType]
                    : p.step === 6 && p.subCategory
                      ? step6Subs[p.subCategory]
                      : p.step === 7 && p.packType
                        ? packTypes[p.packType]
                        : null;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => onToggle(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border-2 ${
                        selected
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-slate-50 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition ${
                          selected
                            ? 'bg-yellow-400 text-slate-900'
                            : 'bg-white border-2 border-slate-200'
                        }`}
                      >
                        {selected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded font-bold">
                            {p.brand}
                          </span>
                          {sub && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                              {sub.icon} {sub.label}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                          {p.name}
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {badges.slice(0, 2).map((b) => (
                          <span
                            key={b.key}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] border ${b.color}`}
                            title={b.label}
                          >
                            {b.icon}
                          </span>
                        ))}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 하단 적용 버튼 */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-brand-ink text-brand-accent font-bold text-sm"
          >
            완료 ({selectedIds.length}개 선택됨)
          </button>
        </div>
      </div>
    </div>
  );
}

import { Package, Construction } from 'lucide-react';
import { useSkincare } from '../useSkincare';
import { stepMeta } from '../meta';
import type { Product, SkincareStep } from '../types';
import { getProductBadges } from '../utils';

/**
 * 인벤토리 탭 — Phase 2b에서 본격 구현 (제품 추가/수정/삭제 + AI 등록).
 * 지금은 단계별로 등록된 제품을 그룹화해서 읽기 전용으로 보여주는 단계.
 */
export default function InventoryTab() {
  const { data } = useSkincare();
  const grouped = groupByStep(data.inventory);

  return (
    <div className="grid gap-4">
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-start gap-3">
          <Construction size={22} className="text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-slate-900">인벤토리</h2>
            <p className="text-sm text-slate-500 mt-1">
              Phase 2b에서 제품 추가/수정/삭제와 AI 자동 분석 등록 기능이 들어옵니다.
              지금은 현재 등록된 제품을 단계별로 읽기만 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {data.inventory.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center text-slate-400">
          <Package size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">등록된 제품이 없습니다.</p>
          <p className="text-xs mt-1">Phase 2b부터 추가할 수 있게 됩니다.</p>
          <p className="text-xs mt-3 text-slate-500">
            기존 데이터는 Phase 2d의 "가져오기" 기능으로 옮겨올 예정입니다.
          </p>
        </div>
      ) : (
        (Object.keys(stepMeta) as unknown as SkincareStep[])
          .filter((s) => grouped[s] && grouped[s].length > 0)
          .map((s) => (
            <div key={s} className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-ink text-brand-accent font-bold text-xs flex items-center justify-center">
                  {stepMeta[s].short}
                </span>
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    {stepMeta[s].label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {grouped[s].length}개 제품
                  </div>
                </div>
              </div>
              <ul className="grid gap-2">
                {grouped[s].map((p) => {
                  const badges = getProductBadges(p);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-500 truncate">
                          {p.brand}
                        </div>
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {p.name}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {badges.map((b) => (
                          <span
                            key={b.key}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] border ${b.color}`}
                            title={b.label}
                          >
                            {b.icon}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
      )}
    </div>
  );
}

function groupByStep(items: Product[]): Record<SkincareStep, Product[]> {
  const map: Record<SkincareStep, Product[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  };
  for (const it of items) {
    if (map[it.step]) map[it.step].push(it);
  }
  return map;
}

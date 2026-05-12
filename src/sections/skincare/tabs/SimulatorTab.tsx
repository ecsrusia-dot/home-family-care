import { Construction } from 'lucide-react';
import { useSkincare } from '../useSkincare';
import { stepMeta } from '../meta';

/**
 * 시뮬레이터 탭 — Phase 2c에서 본격 구현.
 * 지금은 Phase 2a 단계의 플레이스홀더로, 단계별 구조와 현재 인벤토리 개수를 보여준다.
 */
export default function SimulatorTab() {
  const { data } = useSkincare();
  const inventoryCount = data.inventory.length;

  return (
    <div className="grid gap-4">
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-start gap-3">
          <Construction size={22} className="text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-slate-900">루틴 시뮬레이터</h2>
            <p className="text-sm text-slate-500 mt-1">
              Phase 2c에서 본격 구현됩니다. 단계별 제품을 선택해 즉시 점수와 피드백을 받는
              핵심 기능입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-bold text-slate-800 text-sm mb-3">스킨케어 7단계 구조</h3>
        <ul className="grid gap-2">
          {(Object.keys(stepMeta) as unknown as (keyof typeof stepMeta)[]).map((k) => {
            const m = stepMeta[k];
            return (
              <li
                key={k}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-ink text-brand-accent font-bold text-sm flex items-center justify-center shrink-0">
                  {m.short}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900">{m.label}</div>
                  <div className="text-xs text-slate-500">{m.desc}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-bold text-slate-800 text-sm">현재 데이터 상태</h3>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="등록 제품" value={inventoryCount} />
          <Stat label="루틴 기록" value={data.history.length} />
          <Stat label="컨디션 기록" value={data.conditionHistory.length} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-2xl font-black text-brand-ink">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

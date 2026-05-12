import { Construction } from 'lucide-react';
import { useSkincare } from '../useSkincare';
import { conditionOptions } from '../meta';

/**
 * 트래커 탭 — Phase 2c에서 본격 구현.
 * 지금은 컨디션 기록 누적 갯수와 옵션을 보여주는 플레이스홀더.
 */
export default function TrackerTab() {
  const { data } = useSkincare();

  return (
    <div className="grid gap-4">
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-start gap-3">
          <Construction size={22} className="text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-slate-900">트래커 & 추천</h2>
            <p className="text-sm text-slate-500 mt-1">
              Phase 2c에서 본격 구현됩니다. 매일 피부 컨디션을 기록하고, 시뮬레이터에서
              저장한 루틴 분석 결과를 누적으로 보는 곳입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-bold text-slate-800 text-sm mb-3">
          오늘 피부 컨디션은? (선택지 예고)
        </h3>
        <div className="flex flex-wrap gap-2">
          {conditionOptions.map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-bold text-slate-800 text-sm">누적 기록</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center">
          <Stat label="루틴 기록 (히스토리)" value={data.history.length} />
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

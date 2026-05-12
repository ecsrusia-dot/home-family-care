import { useMemo, useState } from 'react';
import {
  Bot,
  Calendar,
  History,
  Moon,
  Sun,
  Trash2,
} from 'lucide-react';
import { useSkincare } from '../useSkincare';
import type { RoutineRecord } from '../types';
import ConditionQuickRecord from '../components/ConditionQuickRecord';
import RoutineDetailModal from '../components/RoutineDetailModal';
import RoutineEditModal from '../components/RoutineEditModal';
import HistoryTrashModal from '../components/HistoryTrashModal';

type TimeFilter = 'all' | 'day' | 'night';

const scoreColor = (s: number) =>
  s >= 90
    ? 'bg-emerald-100 text-emerald-700'
    : s >= 70
      ? 'bg-blue-100 text-blue-700'
      : s >= 50
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';

export default function TrackerTab() {
  const { data, update } = useSkincare();
  const [detail, setDetail] = useState<RoutineRecord | null>(null);
  const [editing, setEditing] = useState<RoutineRecord | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const filtered = useMemo(() => {
    if (timeFilter === 'all') return data.history;
    return data.history.filter((r) => r.timeOfDay === timeFilter);
  }, [data.history, timeFilter]);

  const onDelete = async (r: RoutineRecord) => {
    if (!confirm(`${r.date} 기록을 휴지통으로 이동할까요?`)) return;
    const nextHistory = data.history.filter((it) => it.id !== r.id);
    const nextTrash = [
      ...data.historyTrash,
      { ...r, deletedAt: new Date().toISOString() },
    ];
    await update({ history: nextHistory, historyTrash: nextTrash });
    setDetail(null);
  };

  const trashCount = data.historyTrash.length;

  return (
    <div className="grid gap-4">
      {/* 오늘 컨디션 빠른 기록 */}
      <ConditionQuickRecord />

      {/* 컨디션 이력 (간단) */}
      {data.conditionHistory.length > 1 && (
        <ConditionHistoryStrip
          history={data.conditionHistory}
        />
      )}

      {/* 트래커 헤더 (필터 + 휴지통) */}
      <div className="bg-white rounded-2xl shadow-card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <History size={14} /> 저장된 루틴 ({filtered.length})
          </h3>
          <button
            onClick={() => setTrashOpen(true)}
            className="relative h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center"
            title="기록 휴지통"
          >
            <Trash2 size={16} />
            {trashCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {trashCount > 9 ? '9+' : trashCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-1.5">
          {(['all', 'day', 'night'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 ${
                timeFilter === f
                  ? 'bg-brand-ink text-brand-accent'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {f === 'day' && <Sun size={12} />}
              {f === 'night' && <Moon size={12} />}
              {f === 'all' ? '전체' : f === 'day' ? '아침/낮' : '저녁/밤'}
            </button>
          ))}
        </div>
      </div>

      {/* 저장된 루틴 리스트 */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center text-slate-400">
          <Calendar size={28} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">아직 저장된 루틴이 없습니다.</p>
          <p className="text-xs mt-1">
            시뮬레이터 탭에서 루틴을 구성하고 "트래커에 기록하기"를 눌러보세요.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setDetail(r)}
                className="w-full bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 text-left hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  {r.timeOfDay === 'day' ? (
                    <Sun size={22} className="text-blue-500" />
                  ) : (
                    <Moon size={22} className="text-purple-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-900">{r.date}</div>
                  <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                    <span>{r.condition}</span>
                    <span>·</span>
                    <span>{countProducts(r)}개 제품</span>
                    {r.mechanismReport && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                          <Bot size={11} /> AI 분석됨
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg font-bold text-lg shrink-0 ${scoreColor(r.score)}`}
                >
                  {r.score}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 모달들 */}
      <RoutineDetailModal
        record={detail}
        onClose={() => setDetail(null)}
        onEdit={(r) => {
          setDetail(null);
          setEditing(r);
        }}
        onDelete={onDelete}
      />
      <RoutineEditModal
        record={editing}
        onClose={() => setEditing(null)}
      />
      <HistoryTrashModal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
      />
    </div>
  );
}

function countProducts(r: RoutineRecord): number {
  return ([1, 2, 3, 4, 5, 6, 7] as const).reduce(
    (acc, s) => acc + (r.routine[s]?.length ?? 0),
    0,
  );
}

/** 최근 7일 컨디션을 가로 스트립으로 표시 */
function ConditionHistoryStrip({
  history,
}: {
  history: { date: string; condition: string }[];
}) {
  // 최신 7건만 표시 (날짜 내림차순)
  const items = [...history]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7)
    .reverse();
  return (
    <div className="bg-white rounded-2xl shadow-card p-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        최근 컨디션 기록
      </h4>
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        {items.map((c) => (
          <div
            key={c.date}
            className="shrink-0 bg-slate-50 rounded-lg px-2.5 py-1.5 text-center min-w-[64px]"
          >
            <div className="text-[10px] text-slate-400 font-bold">
              {c.date.slice(5)}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {c.condition}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


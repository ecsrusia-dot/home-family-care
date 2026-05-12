import { Calendar, Check } from 'lucide-react';
import { useState } from 'react';
import { useSkincare } from '../useSkincare';
import { conditionOptions } from '../meta';
import { getTodayDateString } from '../utils';
import type { SkinCondition } from '../types';

/**
 * 트래커 상단에 표시되는 "오늘 컨디션" 빠른 기록.
 * - 오늘 이미 기록이 있으면 그 값을 표시
 * - 새 컨디션 선택 시 즉시 저장
 */
export default function ConditionQuickRecord() {
  const { data, update } = useSkincare();
  const today = getTodayDateString();
  const todayRecord = data.conditionHistory.find((c) => c.date === today);
  const [saving, setSaving] = useState(false);

  const onPick = async (c: SkinCondition) => {
    setSaving(true);
    try {
      // 같은 날짜 기록은 덮어쓰기, 다른 날짜는 그대로 보존
      const others = data.conditionHistory.filter((rec) => rec.date !== today);
      const nextList = [{ date: today, condition: c }, ...others];
      await update({ conditionHistory: nextList });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar size={14} /> 오늘 피부 컨디션
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {today} 기준 · {todayRecord ? '기록됨' : '아직 기록 안 함'}
          </p>
        </div>
        {todayRecord && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
            <Check size={12} /> {todayRecord.condition}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {conditionOptions.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            disabled={saving}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-60 ${
              todayRecord?.condition === c
                ? 'bg-brand-ink text-brand-accent'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Moon, Save, Sun } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useSkincare } from '../useSkincare';
import {
  conditionOptions,
  goalOptions,
  stepMeta,
} from '../meta';
import type {
  RoutineRecord,
  RoutineSelection,
  SkinCondition,
  SkincareStep,
} from '../types';
import { computeAnalysis } from '../analysis';
import RoutineStepRow from './RoutineStepRow';
import StepPickerSheet from './StepPickerSheet';
import AnalysisCard from './AnalysisCard';

interface Props {
  record: RoutineRecord | null;
  onClose: () => void;
}

/** 저장된 루틴 기록의 편집 모달 (시뮬레이터를 닮은 폼). */
export default function RoutineEditModal({ record, onClose }: Props) {
  const { data, update } = useSkincare();
  const [date, setDate] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [condition, setCondition] = useState<SkinCondition>('정상');
  const [goal, setGoal] = useState<string>(goalOptions[0].value);
  const [routine, setRoutine] = useState<RoutineSelection>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  });
  const [pickerStep, setPickerStep] = useState<SkincareStep | null>(null);
  const [saving, setSaving] = useState(false);

  // 모달이 열릴 때 record로 초기화
  useEffect(() => {
    if (record) {
      setDate(record.date);
      setTimeOfDay(record.timeOfDay);
      setCondition(record.condition);
      setGoal(record.goal);
      setRoutine(record.routine);
    }
  }, [record]);

  const analysis = useMemo(
    () =>
      computeAnalysis({
        routine,
        timeOfDay,
        inventory: data.inventory,
        profile: data.profile,
        condition,
        learnedIngredients: data.learnedIngredients,
      }),
    [routine, timeOfDay, data.inventory, data.profile, condition, data.learnedIngredients],
  );

  const toggleProduct = (step: SkincareStep, id: string) => {
    setRoutine((prev) => {
      const arr = prev[step] ?? [];
      return {
        ...prev,
        [step]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });
  };

  const removeFromStep = (step: SkincareStep, id: string) => {
    setRoutine((prev) => ({ ...prev, [step]: (prev[step] ?? []).filter((x) => x !== id) }));
  };

  const onSave = async () => {
    if (!record || !analysis) return;
    setSaving(true);
    try {
      const updated: RoutineRecord = {
        ...record,
        date,
        timeOfDay,
        routine,
        condition,
        goal,
        score: analysis.score,
        feedback: Object.values(analysis.stepFeedback).flat(),
        // 메커니즘 리포트는 루틴이 바뀌었으니 무효화 (다시 생성 가능)
        mechanismReport: undefined,
      };
      const next = data.history.map((r) => (r.id === record.id ? updated : r));
      await update({ history: next });
      onClose();
    } catch (e) {
      alert('저장 실패: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setSaving(false);
    }
  };

  if (!record) return null;

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      size="xl"
      title="루틴 기록 수정"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={!analysis || saving}
            className="px-4 h-10 rounded-lg bg-brand-ink text-brand-accent text-sm font-bold disabled:opacity-60 flex items-center gap-1.5"
          >
            <Save size={14} />
            {saving ? '저장 중…' : '변경 저장'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* 날짜 + 시간대 */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-xs font-bold text-slate-700 mb-1">날짜</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
            />
          </label>
          <div>
            <div className="text-xs font-bold text-slate-700 mb-1">시간대</div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setTimeOfDay('day')}
                className={`h-10 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition ${
                  timeOfDay === 'day'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Sun size={14} /> 낮
              </button>
              <button
                onClick={() => setTimeOfDay('night')}
                className={`h-10 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition ${
                  timeOfDay === 'night'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Moon size={14} /> 밤
              </button>
            </div>
          </div>
        </div>

        {/* 컨디션 + 목표 */}
        <div>
          <div className="text-xs font-bold text-slate-700 mb-1.5">오늘 피부 컨디션</div>
          <div className="flex flex-wrap gap-1.5">
            {conditionOptions.map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  condition === c
                    ? 'bg-brand-ink text-brand-accent'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-700 mb-1.5">케어 목표</div>
          <div className="flex flex-wrap gap-1.5">
            {goalOptions.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  goal === g.value
                    ? 'bg-brand-ink text-brand-accent'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 7단계 빌더 */}
        <div className="bg-slate-50 rounded-xl p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-3">스텝별 제품</h3>
          <div className="grid gap-3">
            {(Object.keys(stepMeta) as unknown as SkincareStep[]).map((s) => (
              <RoutineStepRow
                key={s}
                step={s}
                selectedIds={routine[s] ?? []}
                inventory={data.inventory}
                onAdd={() => setPickerStep(s)}
                onRemove={(id) => removeFromStep(s, id)}
              />
            ))}
          </div>
        </div>

        {/* 분석 */}
        <AnalysisCard analysis={analysis} />
      </div>

      {/* 제품 선택 시트 */}
      <StepPickerSheet
        step={pickerStep}
        inventory={data.inventory}
        selectedIds={pickerStep !== null ? (routine[pickerStep] ?? []) : []}
        onClose={() => setPickerStep(null)}
        onToggle={(id) => {
          if (pickerStep !== null) toggleProduct(pickerStep, id);
        }}
      />
    </Modal>
  );
}

import { useMemo, useState } from 'react';
import { Moon, Plus, Save, Sun, X } from 'lucide-react';
import { useSkincare } from '../useSkincare';
import {
  cleanserTypes,
  conditionOptions,
  goalOptions,
  packTypes,
  step6Subs,
  stepMeta,
} from '../meta';
import type {
  RoutineRecord,
  RoutineSelection,
  SkinCondition,
  SkincareStep,
  Product,
} from '../types';
import { EMPTY_ROUTINE } from '../types';
import { computeAnalysis } from '../analysis';
import { getTodayDateString, newRecordId } from '../utils';
import StepPickerSheet from '../components/StepPickerSheet';
import AnalysisCard from '../components/AnalysisCard';

export default function SimulatorTab() {
  const { data, update } = useSkincare();

  // 로컬 상태 (저장 전까지는 Firestore에 안 올림)
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [condition, setCondition] = useState<SkinCondition>('정상');
  const [goal, setGoal] = useState<string>(goalOptions[0].value);
  const [routine, setRoutine] = useState<RoutineSelection>(EMPTY_ROUTINE);
  const [pickerStep, setPickerStep] = useState<SkincareStep | null>(null);
  const [saving, setSaving] = useState(false);

  // 실시간 분석
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
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...prev, [step]: next };
    });
  };

  const removeFromStep = (step: SkincareStep, id: string) => {
    setRoutine((prev) => ({
      ...prev,
      [step]: (prev[step] ?? []).filter((x) => x !== id),
    }));
  };

  const reset = () => {
    if (!confirm('현재 시뮬레이션을 초기화할까요?')) return;
    setRoutine(EMPTY_ROUTINE);
  };

  const saveToTracker = async () => {
    if (!analysis) {
      alert('제품을 한 개 이상 선택해야 저장할 수 있습니다.');
      return;
    }
    if (analysis.score < 50) {
      if (!confirm(`점수가 ${analysis.score}점으로 낮습니다. 그래도 저장할까요?`)) return;
    }
    setSaving(true);
    try {
      const record: RoutineRecord = {
        id: newRecordId(),
        date: getTodayDateString(),
        timeOfDay,
        routine,
        condition,
        goal,
        score: analysis.score,
        feedback: Object.values(analysis.stepFeedback).flat(),
        createdAt: new Date().toISOString(),
      };
      await update({ history: [record, ...data.history] });
      alert('트래커에 기록이 저장되었습니다.');
    } catch (e) {
      alert('저장 실패: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setSaving(false);
    }
  };

  const totalSelected = Object.values(routine).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );

  const inventoryHasNothing = data.inventory.length === 0;

  return (
    <div className="grid gap-4">
      {/* 시간대 토글 */}
      <div className="bg-white rounded-2xl shadow-card p-3 grid grid-cols-2 gap-2">
        <TimeButton
          active={timeOfDay === 'day'}
          onClick={() => setTimeOfDay('day')}
          icon={<Sun size={20} />}
          label="아침/외출 전"
          activeClass="bg-blue-500 text-white"
        />
        <TimeButton
          active={timeOfDay === 'night'}
          onClick={() => setTimeOfDay('night')}
          icon={<Moon size={20} />}
          label="저녁/세안 후"
          activeClass="bg-purple-600 text-white"
        />
      </div>

      {/* 컨디션 + 목표 */}
      <div className="bg-white rounded-2xl shadow-card p-4 grid gap-3">
        <div>
          <div className="text-xs font-bold text-slate-700 mb-1.5">
            오늘 피부 컨디션
          </div>
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
      </div>

      {/* 인벤토리 비어있으면 안내 */}
      {inventoryHasNothing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center text-sm text-yellow-800">
          ⚠️ 아직 등록된 제품이 없습니다.
          <br />
          <span className="text-xs text-yellow-700">
            "인벤토리" 탭에서 제품을 먼저 등록한 뒤 시뮬레이션해 보세요.
          </span>
        </div>
      )}

      {/* 7단계 루틴 빌더 */}
      {!inventoryHasNothing && (
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">스텝별 제품 선택</h3>
            {totalSelected > 0 && (
              <button
                onClick={reset}
                className="text-xs text-slate-400 hover:text-red-500 transition"
              >
                초기화
              </button>
            )}
          </div>
          <div className="grid gap-3">
            {(Object.keys(stepMeta) as unknown as SkincareStep[]).map((s) => (
              <StepRow
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
      )}

      {/* 분석 카드 */}
      {!inventoryHasNothing && <AnalysisCard analysis={analysis} />}

      {/* 저장 버튼 */}
      {!inventoryHasNothing && analysis && (
        <button
          onClick={saveToTracker}
          disabled={saving}
          className="w-full h-12 rounded-2xl bg-brand-ink text-brand-accent font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? '저장 중…' : '현재 세팅을 트래커에 기록하기'}
        </button>
      )}

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
    </div>
  );
}

interface TimeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
}

function TimeButton({
  active,
  onClick,
  icon,
  label,
  activeClass,
}: TimeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition ${
        active ? activeClass + ' shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface StepRowProps {
  step: SkincareStep;
  selectedIds: string[];
  inventory: Product[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

function StepRow({ step, selectedIds, inventory, onAdd, onRemove }: StepRowProps) {
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

import { useState } from 'react';
import {
  Bot,
  Moon,
  Pencil,
  RefreshCw,
  Sun,
  Trash2,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { stepMeta } from '../meta';
import type {
  MechanismReport,
  Product,
  RoutineRecord,
  SkincareStep,
} from '../types';
import { useSkincare } from '../useSkincare';
import { generateMechanismReport } from '../gemini';

interface Props {
  record: RoutineRecord | null;
  onClose: () => void;
  onEdit: (r: RoutineRecord) => void;
  onDelete: (r: RoutineRecord) => void;
}

const scoreClass = (score: number) =>
  score >= 90
    ? 'text-emerald-600'
    : score >= 70
      ? 'text-blue-600'
      : score >= 50
        ? 'text-amber-600'
        : 'text-red-600';

export default function RoutineDetailModal({
  record: stale,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const { data, update } = useSkincare();
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // 최신 버전 사용 (mechanismReport 새로 생성된 직후 반영)
  const record = stale
    ? (data.history.find((r) => r.id === stale.id) ?? stale)
    : null;

  if (!record) return null;

  const productsByStep = ([1, 2, 3, 4, 5, 6, 7] as SkincareStep[]).map((s) => ({
    step: s,
    items: (record.routine[s] ?? [])
      .map((id) => data.inventory.find((p) => p.id === id))
      .filter((p): p is Product => !!p),
  }));

  const onGenerateReport = async () => {
    if (!data.profile.apiKey?.trim()) {
      alert('AI 메커니즘 분석을 사용하려면 [내 정보]에서 Gemini API 키를 입력해주세요.');
      return;
    }
    setReportError(null);
    setGenerating(true);
    try {
      const report = await generateMechanismReport({
        record,
        inventory: data.inventory,
        apiKey: data.profile.apiKey,
      });
      const nextHistory = data.history.map((r) =>
        r.id === record.id ? { ...r, mechanismReport: report } : r,
      );
      await update({ history: nextHistory });
    } catch (e) {
      setReportError(e instanceof Error ? e.message : '리포트 생성 실패');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal open={!!stale} onClose={onClose} size="xl" title="루틴 기록 상세">
      <div className="grid gap-5">
        {/* 헤더 정보 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
              {record.timeOfDay === 'day' ? (
                <>
                  <Sun size={12} /> 아침/낮
                </>
              ) : (
                <>
                  <Moon size={12} /> 저녁/밤
                </>
              )}
            </div>
            <div className={`text-2xl font-black ${scoreClass(record.score)} bg-white px-3 py-0.5 rounded-full`}>
              {record.score}
              <span className="text-[10px] font-bold text-slate-400"> /100</span>
            </div>
          </div>
          <div className="text-lg font-bold">{record.date}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[11px] bg-white/15 text-yellow-200 px-2 py-0.5 rounded font-bold">
              {record.condition}
            </span>
            <span className="text-[11px] bg-white/15 text-yellow-200 px-2 py-0.5 rounded font-bold">
              목표: {record.goal}
            </span>
          </div>
        </div>

        {/* 단계별 사용 제품 */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            사용한 제품
          </h4>
          <div className="grid gap-2">
            {productsByStep
              .filter((g) => g.items.length > 0)
              .map(({ step, items }) => (
                <div key={step} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-brand-ink text-brand-accent font-bold text-[10px] flex items-center justify-center">
                      S{step}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {stepMeta[step].label}
                    </span>
                  </div>
                  <ul className="grid gap-1 pl-1">
                    {items.map((it, idx) => (
                      <li
                        key={it.id}
                        className="text-sm text-slate-800 flex items-center gap-2"
                      >
                        {step === 4 && items.length > 1 && (
                          <span className="w-4 h-4 bg-yellow-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                            {idx + 1}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 font-bold">
                          {it.brand}
                        </span>
                        <span className="font-medium truncate">{it.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        {/* AI 메커니즘 리포트 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Bot size={12} /> AI 메커니즘 분석
            </h4>
            {record.mechanismReport && (
              <button
                onClick={onGenerateReport}
                disabled={generating}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-60"
              >
                <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
                다시 생성
              </button>
            )}
          </div>

          {!record.mechanismReport ? (
            <div>
              <button
                onClick={onGenerateReport}
                disabled={generating}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition"
              >
                {generating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    분석 중…
                  </>
                ) : (
                  <>
                    <Bot size={14} />
                    이 루틴 시너지 메커니즘 분석 받기
                  </>
                )}
              </button>
              {reportError && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 whitespace-pre-line">
                  {reportError}
                </div>
              )}
            </div>
          ) : (
            <MechanismReportView report={record.mechanismReport} />
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => onDelete(record)}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 border border-red-100 flex items-center justify-center gap-1.5 transition"
          >
            <Trash2 size={14} /> 휴지통으로
          </button>
          <button
            onClick={() => onEdit(record)}
            className="flex-1 h-11 rounded-xl bg-brand-ink text-brand-accent text-sm font-bold flex items-center justify-center gap-1.5"
          >
            <Pencil size={14} /> 수정
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MechanismReportView({ report }: { report: MechanismReport }) {
  return (
    <div className="grid gap-3">
      <div className="bg-slate-50 rounded-xl p-4">
        <h3 className="font-bold text-slate-900 text-base leading-snug">
          {report.title}
        </h3>
      </div>

      {/* 단계별 분석 */}
      <div className="grid gap-2">
        {report.steps.map((s, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-yellow-400 text-[10px] font-bold">
                {s.stepLabel}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                {s.brand}
              </span>
            </div>
            <div className="font-bold text-sm text-slate-900 leading-snug mb-1">
              {s.productName}
            </div>
            <div className="text-xs font-bold text-indigo-600 mb-2">
              ⚙️ {s.role}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-keep">
              {s.body}
            </p>
            <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1.5">
              → {s.result}
            </div>
          </div>
        ))}
      </div>

      {/* 종합 결론 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-2">
          🏆 종합 평가
        </h4>
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line break-keep">
          {report.conclusion}
        </p>
      </div>

      {/* 개선 권장 */}
      {report.improvements.trim() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line break-keep">
            {report.improvements}
          </p>
        </div>
      )}

      <div className="text-[10px] text-slate-400 text-right">
        생성: {new Date(report.generatedAt).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}

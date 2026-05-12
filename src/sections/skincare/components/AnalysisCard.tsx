import { CheckCircle2, Info, ShieldAlert, Sparkles } from 'lucide-react';
import type { AnalysisResult, Feedback } from '../analysis';
import { stepMeta } from '../meta';
import type { SkincareStep } from '../types';

interface Props {
  analysis: AnalysisResult | null;
}

const scoreColors = (score: number) => {
  if (score >= 90) return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', ring: 'text-emerald-500' };
  if (score >= 70) return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', ring: 'text-blue-500' };
  if (score >= 50) return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', ring: 'text-amber-500' };
  return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', ring: 'text-red-500' };
};

export default function AnalysisCard({ analysis }: Props) {
  if (!analysis) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 text-center text-slate-400 text-sm">
        <Sparkles size={20} className="mx-auto mb-2 opacity-50" />
        제품을 하나 이상 선택하면 자동으로 분석됩니다.
      </div>
    );
  }

  const c = scoreColors(analysis.score);
  const generalFeedback = analysis.stepFeedback.general;

  return (
    <div className="grid gap-3">
      {/* 점수 카드 */}
      <div className={`rounded-2xl border-2 ${c.bg} ${c.border} p-5 flex items-center justify-between`}>
        <div>
          <div className="text-xs font-bold text-slate-500">루틴 분석 점수</div>
          <div className={`font-bold text-sm mt-1 ${c.text}`}>{analysis.grade}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            선택 제품 {analysis.selectedCount}개
          </div>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-black ${c.text}`}>{analysis.score}</span>
          <span className="text-xs font-bold text-slate-500"> / 100</span>
        </div>
      </div>

      {/* 전반 피드백 */}
      {generalFeedback.length > 0 && (
        <FeedbackList title="전반 피드백" feedbacks={generalFeedback} />
      )}

      {/* 단계별 피드백 */}
      {(Object.keys(stepMeta) as unknown as SkincareStep[])
        .filter((s) => analysis.stepFeedback[s].length > 0)
        .map((s) => (
          <FeedbackList
            key={s}
            title={`${stepMeta[s].short} · ${stepMeta[s].label}`}
            feedbacks={analysis.stepFeedback[s]}
          />
        ))}
    </div>
  );
}

function FeedbackList({
  title,
  feedbacks,
}: {
  title: string;
  feedbacks: Feedback[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        {title}
      </h4>
      <ul className="grid gap-1.5">
        {feedbacks.map((f, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 text-sm leading-snug break-keep ${
              f.type === 'pro'
                ? 'text-emerald-700'
                : f.type === 'con'
                  ? 'text-red-700'
                  : 'text-slate-600'
            }`}
          >
            {f.type === 'pro' ? (
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            ) : f.type === 'con' ? (
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            ) : (
              <Info size={14} className="shrink-0 mt-0.5" />
            )}
            <span>{f.msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

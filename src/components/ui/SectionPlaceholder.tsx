import type { ReactNode } from 'react';

interface Props {
  title: string;
  emoji: string;
  phase: string;
  description: ReactNode;
  todo: string[];
}

export default function SectionPlaceholder({ title, emoji, phase, description, todo }: Props) {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {emoji}
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{phase}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed break-keep">{description}</p>

        <div className="mt-6">
          <h2 className="text-sm font-bold text-slate-700">예정된 기능</h2>
          <ul className="mt-2 space-y-1.5">
            {todo.map((t) => (
              <li key={t} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

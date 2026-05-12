import { NavLink } from 'react-router-dom';
import { Sparkles, NotebookPen, Cat, Home } from 'lucide-react';
import type { ComponentType } from 'react';

interface Tab {
  to: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

const TABS: Tab[] = [
  { to: '/skincare', label: '스킨케어', Icon: Sparkles },
  { to: '/memo', label: '가족메모', Icon: NotebookPen },
  { to: '/cats', label: '반려묘', Icon: Cat },
  { to: '/home', label: '우리집', Icon: Home },
];

export default function BottomTabs() {
  return (
    <>
      {/* 모바일: 하단 고정 탭바 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-1px_3px_rgba(15,23,42,0.04)]">
        <ul className="grid grid-cols-4 h-16">
          {TABS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `h-full flex flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                    isActive ? 'text-brand-ink' : 'text-slate-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={22} className={isActive ? 'text-brand-ink' : 'text-slate-400'} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 데스크톱: 좌측 사이드바 */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 z-40 bg-brand-ink text-white flex-col p-4 gap-2">
        <div className="px-2 py-3 mb-2">
          <div className="text-brand-accent font-black text-lg leading-tight">우리집</div>
          <div className="text-slate-400 text-sm">가족 종합 케어</div>
        </div>
        <ul className="flex flex-col gap-1">
          {TABS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-white/10 text-brand-accent'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}

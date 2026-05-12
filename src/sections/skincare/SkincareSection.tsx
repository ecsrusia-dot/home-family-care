import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Sliders, Activity, Package, Sparkles, Lock, type LucideIcon } from 'lucide-react';
import { useSkincare } from './useSkincare';
import SimulatorTab from './tabs/SimulatorTab';
import TrackerTab from './tabs/TrackerTab';
import InventoryTab from './tabs/InventoryTab';

/**
 * 스킨케어 섹션 — 3개 서브탭(시뮬레이터/트래커/인벤토리).
 *
 * 데이터는 users/{uid}/skincare/main 에 저장된다 (개인 전용, 가족 공유 안 함).
 */
export default function SkincareSection() {
  const { data, loading, uid } = useSkincare();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-slate-400 text-sm">
          스킨케어 데이터를 불러오는 중…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* 섹션 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Sparkles size={26} className="text-yellow-500" />
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">
              스킨케어 시스템
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Lock size={11} /> 개인 전용 · 가족과 공유되지 않습니다
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>{data.profile.nickname}</div>
          <div className="font-mono">{uid ? uid.slice(0, 6) + '…' : ''}</div>
        </div>
      </div>

      {/* 서브탭 바 */}
      <div className="bg-white rounded-2xl shadow-card p-2 mb-4 flex gap-1">
        <SubTab to="simulator" Icon={Sliders} label="시뮬레이터" />
        <SubTab to="tracker" Icon={Activity} label="트래커" />
        <SubTab to="inventory" Icon={Package} label="인벤토리" />
      </div>

      {/* 탭 콘텐츠 */}
      <Routes>
        <Route index element={<Navigate to="simulator" replace />} />
        <Route path="simulator" element={<SimulatorTab />} />
        <Route path="tracker" element={<TrackerTab />} />
        <Route path="inventory" element={<InventoryTab />} />
        <Route path="*" element={<Navigate to="simulator" replace />} />
      </Routes>
    </div>
  );
}

interface SubTabProps {
  to: string;
  Icon: LucideIcon;
  label: string;
}

function SubTab({ to, Icon, label }: SubTabProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
          isActive
            ? 'bg-brand-ink text-brand-accent shadow-sm'
            : 'text-slate-500 hover:bg-slate-50'
        }`
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

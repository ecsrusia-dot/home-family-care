import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { useFamily } from './lib/family';
import TopBar from './components/shell/TopBar';
import BottomTabs from './components/shell/BottomTabs';
import AuthGate from './components/shell/AuthGate';
import FamilyGate from './components/shell/FamilyGate';
import SkincareSection from './sections/skincare/SkincareSection';
import MemoSection from './sections/memo/MemoSection';
import CatsSection from './sections/cats/CatsSection';
import HomeSection from './sections/home/HomeSection';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { family, loading: familyLoading } = useFamily();

  if (authLoading || (user && familyLoading)) {
    return <FullScreenSpinner label="불러오는 중…" />;
  }

  if (!user) return <AuthGate />;
  if (!family) return <FamilyGate />;

  return (
    <div className="min-h-full flex flex-col bg-brand-surface">
      <TopBar />
      <main className="flex-1 pb-20 md:pb-6 md:pl-60">
        <Routes>
          <Route path="/" element={<Navigate to="/skincare" replace />} />
          <Route path="/skincare/*" element={<SkincareSection />} />
          <Route path="/memo/*" element={<MemoSection />} />
          <Route path="/cats/*" element={<CatsSection />} />
          <Route path="/home/*" element={<HomeSection />} />
          <Route path="*" element={<Navigate to="/skincare" replace />} />
        </Routes>
      </main>
      <BottomTabs />
    </div>
  );
}

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-full flex items-center justify-center bg-brand-surface text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-brand-ink rounded-full animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

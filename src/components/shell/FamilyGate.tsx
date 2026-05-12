import { useState } from 'react';
import { useFamily } from '../../lib/family';
import { useAuth } from '../../lib/auth';

type Mode = 'pick' | 'create' | 'join';

export default function FamilyGate() {
  const { user, signOut } = useAuth();
  const { createFamily, joinByCode } = useFamily();
  const [mode, setMode] = useState<Mode>('pick');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-brand-surface px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-7">
        <div className="text-sm text-slate-500">
          {user?.displayName ?? user?.email} 님, 환영합니다
        </div>
        <h1 className="mt-1 text-xl font-bold text-slate-900">가족 그룹을 선택해주세요</h1>
        <p className="mt-1 text-sm text-slate-500">
          한 가족 안의 모든 멤버는 같은 메모·일정·반려묘·집 관리 데이터를 공유합니다.
        </p>

        {mode === 'pick' && (
          <div className="mt-6 grid gap-3">
            <button
              onClick={() => setMode('create')}
              className="h-12 rounded-xl bg-brand-ink text-brand-accent font-bold"
            >
              새 가족 그룹 만들기
            </button>
            <button
              onClick={() => setMode('join')}
              className="h-12 rounded-xl bg-slate-100 text-slate-800 font-bold"
            >
              초대 코드로 합류하기
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="mt-6 grid gap-3">
            <label className="text-sm text-slate-700">
              가족 이름
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김씨 가족"
                className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
              />
            </label>
            <button
              disabled={busy}
              onClick={() => void wrap(() => createFamily(name.trim() || undefined))}
              className="h-11 rounded-xl bg-brand-ink text-brand-accent font-bold disabled:opacity-60"
            >
              {busy ? '만드는 중…' : '만들기'}
            </button>
            <button onClick={() => setMode('pick')} className="text-sm text-slate-500">
              뒤로
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="mt-6 grid gap-3">
            <label className="text-sm text-slate-700">
              초대 코드 (6자리)
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="A1B2C3"
                className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
              />
            </label>
            <button
              disabled={busy || code.length < 4}
              onClick={() => void wrap(() => joinByCode(code))}
              className="h-11 rounded-xl bg-brand-ink text-brand-accent font-bold disabled:opacity-60"
            >
              {busy ? '합류 중…' : '합류하기'}
            </button>
            <button onClick={() => setMode('pick')} className="text-sm text-slate-500">
              뒤로
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-500 break-keep">{error}</p>}

        <button
          onClick={() => void signOut()}
          className="mt-6 text-xs text-slate-400 hover:text-slate-600"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../../lib/auth';

export default function AuthGate() {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-brand-surface px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-ink text-brand-accent text-xl font-black mb-4">
          家
        </div>
        <h1 className="text-xl font-bold text-slate-900">우리집·가족 케어</h1>
        <p className="mt-2 text-sm text-slate-500">
          스킨케어 · 가족 메모 · 반려묘 · 우리집 관리를
          <br />한 화면에서 가족과 함께 관리하세요.
        </p>

        <button
          onClick={onClick}
          disabled={busy}
          className="mt-6 w-full h-11 rounded-xl bg-brand-ink text-brand-accent font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? '로그인 중…' : 'Google 계정으로 시작'}
        </button>

        {error && (
          <p className="mt-3 text-xs text-red-500 break-keep">{error}</p>
        )}
      </div>
    </div>
  );
}

import { LogOut, Users } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useFamily } from '../../lib/family';

export default function TopBar() {
  const { user, signOut } = useAuth();
  const { family } = useFamily();

  return (
    <header className="sticky top-0 z-30 bg-brand-ink text-white shadow-sm md:ml-60">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={18} className="text-brand-accent shrink-0" />
          <span className="font-bold truncate">{family?.name ?? '우리 가족'}</span>
          {family && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10 text-brand-accent font-mono">
              {family.inviteCode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className="w-7 h-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20" />
          )}
          <button
            onClick={() => void signOut()}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
            title="로그아웃"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}

import { Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useSkincare } from '../useSkincare';
import type { RoutineRecord } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * 루틴 기록 휴지통.
 * - 7일 보관 후 자동 정리
 * - 복원하면 history로, 영구삭제는 즉시 제거
 */
export default function HistoryTrashModal({ open, onClose }: Props) {
  const { data, update } = useSkincare();
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  const fresh = data.historyTrash.filter((t) => {
    const d = new Date(t.deletedAt).getTime();
    return !isNaN(d) && now - d < WEEK;
  });

  const restore = async (item: RoutineRecord & { deletedAt: string }) => {
    const { deletedAt: _omit, ...record } = item;
    void _omit;
    const nextHistory = [record, ...data.history];
    const nextTrash = data.historyTrash.filter((t) => t.id !== item.id);
    await update({ history: nextHistory, historyTrash: nextTrash });
  };

  const permanentDelete = async (item: RoutineRecord & { deletedAt: string }) => {
    if (!confirm(`${item.date} 기록을 영구 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const next = data.historyTrash.filter((t) => t.id !== item.id);
    await update({ historyTrash: next });
  };

  return (
    <Modal open={open} onClose={onClose} title="기록 휴지통" size="lg">
      <div className="mb-3 text-xs text-slate-500">
        삭제된 루틴 기록은 7일간 보관됩니다. 복원하면 트래커로 돌아갑니다.
      </div>

      {fresh.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          기록 휴지통이 비어 있습니다.
        </div>
      ) : (
        <ul className="grid gap-2">
          {fresh.map((item) => {
            const daysLeft = Math.max(
              0,
              Math.ceil(
                (new Date(item.deletedAt).getTime() + WEEK - now) /
                  (24 * 60 * 60 * 1000),
              ),
            );
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50"
              >
                <span className="w-9 h-9 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  {item.timeOfDay === 'day' ? <Sun size={16} /> : <Moon size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900">{item.date}</div>
                  <div className="text-xs text-slate-500">
                    {item.score}점 · {item.condition}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {daysLeft}일 후 영구 삭제됨
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => restore(item)}
                    className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"
                    title="복원"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => permanentDelete(item)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                    title="영구 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

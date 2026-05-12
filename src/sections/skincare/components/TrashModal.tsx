import { RotateCcw, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useSkincare } from '../useSkincare';
import { stepMeta } from '../meta';
import type { Product } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * 휴지통 모달.
 * - 삭제된 제품은 7일 보관 후 자동 정리 (열 때마다 prune).
 * - 복원하면 인벤토리로, 영구삭제 누르면 즉시 제거.
 */
export default function TrashModal({ open, onClose }: Props) {
  const { data, update } = useSkincare();
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  // 7일 지난 항목 자동 정리
  const fresh = data.trash.filter((t) => {
    const d = new Date(t.deletedAt).getTime();
    return !isNaN(d) && now - d < WEEK;
  });

  const restore = async (item: Product & { deletedAt: string }) => {
    const { deletedAt: _omit, ...prod } = item;
    void _omit;
    const nextInventory = [...data.inventory, prod];
    const nextTrash = data.trash.filter((t) => t.id !== item.id);
    await update({ inventory: nextInventory, trash: nextTrash });
  };

  const permanentDelete = async (item: Product & { deletedAt: string }) => {
    if (!confirm(`"${item.name}"을(를) 영구 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const nextTrash = data.trash.filter((t) => t.id !== item.id);
    await update({ trash: nextTrash });
  };

  return (
    <Modal open={open} onClose={onClose} title="휴지통" size="lg">
      <div className="mb-3 text-xs text-slate-500">
        삭제된 제품은 7일간 보관되며 이후 자동 정리됩니다. 복원하면 인벤토리로 돌아갑니다.
      </div>

      {fresh.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          휴지통이 비어 있습니다.
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
                <span className="w-9 h-9 rounded-lg bg-brand-ink text-brand-accent font-bold text-xs flex items-center justify-center shrink-0">
                  {stepMeta[item.step].short}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 truncate">{item.brand}</div>
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {daysLeft}일 후 영구 삭제됨
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => restore(item)}
                    className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                    title="복원"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => permanentDelete(item)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
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

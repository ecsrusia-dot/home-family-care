import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** "sm" | "md" | "lg" | "xl" */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  /** ESC 키와 배경 클릭으로 닫기를 막을 때 true */
  preventClose?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

/**
 * 재사용 가능한 모달 베이스.
 * - 배경 오버레이 + 중앙 정렬 카드
 * - ESC 키로 닫기
 * - 배경 클릭으로 닫기 (preventClose가 true면 막힘)
 */
export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  preventClose = false,
}: ModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open || preventClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, preventClose, onClose]);

  // 모달 열려 있을 때 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 animate-in fade-in"
      onClick={preventClose ? undefined : onClose}
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} bg-white rounded-t-2xl md:rounded-2xl shadow-xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <h2 className="font-bold text-slate-900">{title}</h2>
            {!preventClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* 푸터 */}
        {footer && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

import { Pencil, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { stepMeta, cleanserTypes, step6Subs, packTypes } from '../meta';
import { getIngredientDetails, getProductBadges } from '../utils';
import type { Product } from '../types';

interface Props {
  product: Product | null;
  onClose: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

const WEIGHT_LABEL: Record<string, string> = {
  light: '가벼움',
  medium: '중간',
  heavy: '무거움',
};

export default function ProductDetailModal({
  product,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  if (!product) return null;

  const badges = getProductBadges(product);
  const meta = stepMeta[product.step];
  const sub =
    product.step === 1 && product.cleanserType
      ? cleanserTypes[product.cleanserType]
      : product.step === 6 && product.subCategory
        ? step6Subs[product.subCategory]
        : product.step === 7 && product.packType
          ? packTypes[product.packType]
          : null;

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title={`${meta.short} · ${meta.label}`}
      size="lg"
      footer={
        <div className="flex justify-between gap-2">
          <button
            onClick={() => onDelete(product)}
            className="px-4 h-10 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition flex items-center gap-1.5"
          >
            <Trash2 size={14} /> 삭제
          </button>
          <button
            onClick={() => onEdit(product)}
            className="px-4 h-10 rounded-lg bg-brand-ink text-brand-accent text-sm font-bold flex items-center gap-1.5"
          >
            <Pencil size={14} /> 수정
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* 헤더 */}
        <div>
          <div className="text-sm text-slate-500">{product.brand}</div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            {product.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sub && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                {sub.icon} {sub.label}
              </span>
            )}
            {product.weight && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                {WEIGHT_LABEL[product.weight] ?? product.weight}
              </span>
            )}
            {badges.map((b) => (
              <span
                key={b.key}
                className={`px-2 py-0.5 rounded-md text-xs font-medium border ${b.color}`}
              >
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* 핵심 성분 */}
        {product.keyIngredients && product.keyIngredients.length > 0 && (
          <Section title="핵심 성분">
            <ul className="grid gap-2">
              {product.keyIngredients.map((ing, i) => {
                const info = getIngredientDetails(ing, 'pro');
                return (
                  <li
                    key={i}
                    className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2"
                  >
                    <div className="text-sm font-bold text-emerald-900">
                      {info.name}
                    </div>
                    <div className="text-xs text-emerald-700 mt-0.5 leading-snug">
                      {info.desc}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {/* 주의 성분 */}
        {product.cautionIngredients && product.cautionIngredients.length > 0 && (
          <Section title="주의 성분">
            <ul className="grid gap-2">
              {product.cautionIngredients.map((ing, i) => {
                const info = getIngredientDetails(ing, 'caution');
                return (
                  <li
                    key={i}
                    className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2"
                  >
                    <div className="text-sm font-bold text-amber-900">
                      {info.name}
                    </div>
                    <div className="text-xs text-amber-700 mt-0.5 leading-snug">
                      {info.desc}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {/* 메모 */}
        {product.description && (
          <Section title="메모">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </Section>
        )}
      </div>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-500 mb-2">{title}</h4>
      {children}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Plus, Search, Package, Sparkles } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import ProductForm, {
  type ProductDraft,
} from '../components/ProductForm';
import ProductDetailModal from '../components/ProductDetailModal';
import AiRegisterModal from '../components/AiRegisterModal';
import { ALL_STEPS, stepMeta } from '../meta';
import type { Product, SkincareStep } from '../types';
import { getProductBadges, newProductId } from '../utils';
import { useSkincare } from '../useSkincare';
import { canonicalizeBrand, uniqueBrands } from '../brand';

interface InventoryTabProps {
  /** AI 등록 모달에서 "내 정보 열기" 트리거를 위해 부모로 위임 */
  onOpenProfile: () => void;
}

export default function InventoryTab({ onOpenProfile }: InventoryTabProps) {
  const { data, update } = useSkincare();
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stepFilter, setStepFilter] = useState<SkincareStep | 'all'>('all');

  // 모달 상태
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [formValid, setFormValid] = useState(false);
  const [saving, setSaving] = useState(false);

  // 브랜드 목록 (필터용)
  const brands = useMemo(() => {
    const set = new Set<string>();
    data.inventory.forEach((p) => p.brand && set.add(p.brand));
    return [...set].sort();
  }, [data.inventory]);

  // 필터링된 목록
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return data.inventory.filter((p) => {
      if (brandFilter && p.brand !== brandFilter) return false;
      if (stepFilter !== 'all' && p.step !== stepFilter) return false;
      if (s) {
        const hay = `${p.brand} ${p.name} ${(p.keyIngredients || []).join(' ')}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [data.inventory, search, brandFilter, stepFilter]);

  const grouped = useMemo(() => groupByStep(filtered), [filtered]);

  const onSaveAdd = async () => {
    if (!draft || !formValid) return;
    setSaving(true);
    try {
      const canonicalBrand = canonicalizeBrand(
        draft.brand,
        uniqueBrands(data.inventory),
      );
      const product: Product = {
        id: newProductId(),
        createdAt: new Date().toISOString(),
        ...draft,
        brand: canonicalBrand,
      };
      await update({ inventory: [...data.inventory, product] });
      setAdding(false);
      setDraft(null);
    } catch (e) {
      alert('저장 실패: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setSaving(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editing || !draft || !formValid) return;
    setSaving(true);
    try {
      // 수정 시에는 자기 자신을 제외한 다른 브랜드들과만 비교 (자기 자신 표기 보존)
      const others = data.inventory.filter((p) => p.id !== editing.id);
      const canonicalBrand = canonicalizeBrand(draft.brand, uniqueBrands(others));
      const updated: Product = {
        ...editing,
        ...draft,
        brand: canonicalBrand,
      };
      const next = data.inventory.map((p) => (p.id === editing.id ? updated : p));
      await update({ inventory: next });
      setEditing(null);
      setDraft(null);
      setDetail(null);
    } catch (e) {
      alert('저장 실패: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p: Product) => {
    if (!confirm(`"${p.name}"을(를) 휴지통으로 이동할까요?`)) return;
    const next = data.inventory.filter((it) => it.id !== p.id);
    const trash = [
      ...data.trash,
      { ...p, deletedAt: new Date().toISOString() },
    ];
    await update({ inventory: next, trash });
    setDetail(null);
  };

  const inventoryEmpty = data.inventory.length === 0;

  return (
    <div className="grid gap-4">
      {/* 검색/필터 + 추가 버튼 */}
      <div className="bg-white rounded-2xl shadow-card p-3 space-y-2">
        {/* Row 1: 검색바 + 액션 버튼들 (좁은 화면에서도 항상 한 줄) */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
            />
          </div>
          <button
            onClick={() => setAiOpen(true)}
            className="h-10 w-10 sm:w-auto sm:px-3 rounded-lg bg-yellow-400 text-slate-900 text-sm font-bold flex items-center justify-center gap-1 shrink-0 hover:bg-yellow-500 transition"
            title="AI 스마트 등록"
            aria-label="AI 등록"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">AI 등록</span>
          </button>
          <button
            onClick={() => {
              setAdding(true);
              setDraft(null);
            }}
            className="h-10 w-10 sm:w-auto sm:px-3 rounded-lg bg-brand-ink text-brand-accent text-sm font-bold flex items-center justify-center gap-1 shrink-0"
            title="제품 직접 추가"
            aria-label="제품 추가"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">제품 추가</span>
          </button>
        </div>

        {/* Row 2: 단계 필터 (좁은 화면에선 가로 스크롤) */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
          <button
            onClick={() => setStepFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${
              stepFilter === 'all'
                ? 'bg-brand-ink text-brand-accent'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            전체
          </button>
          {ALL_STEPS.map((s) => (
            <button
              key={s}
              onClick={() => setStepFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${
                stepFilter === s
                  ? 'bg-brand-ink text-brand-accent'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title={stepMeta[s].label}
            >
              {stepMeta[s].short}
            </button>
          ))}
        </div>

        {/* Row 3: 브랜드 필터 (별도 줄, 좁은 화면에서도 풀폭) */}
        {brands.length > 0 && (
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-md bg-slate-50 text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
          >
            <option value="">브랜드 전체 ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 빈 상태 안내 */}
      {inventoryEmpty && (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center text-slate-400">
          <Package size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">등록된 제품이 없습니다.</p>
          <p className="text-xs mt-1">우측 상단 "제품 추가"로 시작해 보세요.</p>
          <p className="text-xs mt-3 text-slate-500">
            기존 데이터는 Phase 2d의 "가져오기" 기능으로 옮겨올 예정입니다.
          </p>
        </div>
      )}

      {/* 단계별 그룹 */}
      {!inventoryEmpty &&
        ALL_STEPS
          .filter((s) => grouped[s] && grouped[s].length > 0)
          .map((s) => (
            <div key={s} className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-ink text-brand-accent font-bold text-xs flex items-center justify-center">
                  {stepMeta[s].short}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900">
                    {stepMeta[s].label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {grouped[s].length}개 제품
                  </div>
                </div>
              </div>
              <ul className="grid gap-2">
                {grouped[s].map((p) => {
                  const badges = getProductBadges(p);
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setDetail(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-500 truncate">
                            {p.brand}
                          </div>
                          <div className="font-bold text-sm text-slate-900 truncate">
                            {p.name}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {badges.map((b) => (
                            <span
                              key={b.key}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] border ${b.color}`}
                              title={b.label}
                            >
                              {b.icon}
                            </span>
                          ))}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

      {/* 필터 결과 없음 */}
      {!inventoryEmpty && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-slate-400 text-sm">
          검색 조건에 맞는 제품이 없습니다.
        </div>
      )}

      {/* 추가 모달 */}
      <Modal
        open={adding}
        onClose={() => {
          setAdding(false);
          setDraft(null);
        }}
        title="제품 추가"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setAdding(false);
                setDraft(null);
              }}
              className="px-4 h-10 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              취소
            </button>
            <button
              onClick={onSaveAdd}
              disabled={!formValid || saving}
              className="px-4 h-10 rounded-lg bg-brand-ink text-brand-accent text-sm font-bold disabled:opacity-60"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        }
      >
        <ProductForm onChange={setDraft} onValidity={setFormValid} />
      </Modal>

      {/* 수정 모달 */}
      <Modal
        open={!!editing}
        onClose={() => {
          setEditing(null);
          setDraft(null);
        }}
        title="제품 수정"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditing(null);
                setDraft(null);
              }}
              className="px-4 h-10 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              취소
            </button>
            <button
              onClick={onSaveEdit}
              disabled={!formValid || saving}
              className="px-4 h-10 rounded-lg bg-brand-ink text-brand-accent text-sm font-bold disabled:opacity-60"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        }
      >
        {editing && (
          <ProductForm
            initial={editing}
            onChange={setDraft}
            onValidity={setFormValid}
          />
        )}
      </Modal>

      {/* 상세 모달 */}
      <ProductDetailModal
        product={detail}
        onClose={() => setDetail(null)}
        onEdit={(p) => {
          setDetail(null);
          setEditing(p);
        }}
        onDelete={onDelete}
      />

      {/* AI 등록 모달 */}
      <AiRegisterModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onOpenProfile={() => {
          setAiOpen(false);
          onOpenProfile();
        }}
      />
    </div>
  );
}

function groupByStep(items: Product[]): Record<SkincareStep, Product[]> {
  const map: Record<SkincareStep, Product[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  };
  for (const it of items) if (map[it.step]) map[it.step].push(it);
  return map;
}

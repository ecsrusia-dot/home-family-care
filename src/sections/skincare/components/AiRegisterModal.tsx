import { useEffect, useRef, useState } from 'react';
import { Bot, Image as ImageIcon, Search, Sparkles, X } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import ProductForm, { type ProductDraft } from './ProductForm';
import {
  analyzeProduct,
  learnIngredients,
  readImageAsBase64,
  type AiAnalyzedProduct,
} from '../gemini';
import { useSkincare } from '../useSkincare';
import { newProductId } from '../utils';
import { canonicalizeBrand, uniqueBrands } from '../brand';
import type { Product } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** "프로필 열기"가 필요할 때 부모에서 호출 */
  onOpenProfile: () => void;
}

type Stage = 'input' | 'analyzing' | 'edit';

export default function AiRegisterModal({ open, onClose, onOpenProfile }: Props) {
  const { data, update } = useSkincare();
  const [stage, setStage] = useState<Stage>('input');
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiAnalyzedProduct | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [formValid, setFormValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 모달이 새로 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      setStage('input');
      setInput('');
      setImageBase64('');
      setImageMime('image/jpeg');
      setError(null);
      setAiResult(null);
      setDraft(null);
      setFormValid(false);
      setSaving(false);
    }
  }, [open]);

  const hasApiKey = !!data.profile.apiKey?.trim();

  const onPickImage = async (file: File) => {
    try {
      const { base64, mime } = await readImageAsBase64(file);
      setImageBase64(base64);
      setImageMime(mime);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 처리 실패');
    }
  };

  const onAnalyze = async () => {
    setError(null);
    if (!input.trim() && !imageBase64) {
      setError('제품명을 입력하거나 이미지를 첨부해주세요.');
      return;
    }
    if (!hasApiKey) {
      setError('AI API 키가 없습니다. [내 정보] 모달에서 Gemini 키를 입력해주세요.');
      return;
    }
    setStage('analyzing');
    try {
      const result = await analyzeProduct({
        input: input.trim(),
        imageBase64: imageBase64 || undefined,
        imageMime,
        apiKey: data.profile.apiKey,
        existingBrands: uniqueBrands(data.inventory),
      });
      // 안전망: AI가 혹시 다른 표기로 반환해도 우리 쪽에서 한 번 더 통일
      result.brand = canonicalizeBrand(result.brand, uniqueBrands(data.inventory));
      setAiResult(result);
      setStage('edit');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 분석 실패');
      setStage('input');
    }
  };

  const onSave = async () => {
    if (!draft || !formValid || !aiResult) return;
    setSaving(true);
    try {
      // 사용자가 폼에서 brand를 다시 손댔을 수도 있으므로 마지막에 한 번 더 정규화
      const canonicalBrand = canonicalizeBrand(
        draft.brand,
        uniqueBrands(data.inventory),
      );
      const product: Product = {
        id: newProductId(),
        createdAt: new Date().toISOString(),
        ...draft,
        brand: canonicalBrand,
        // AI가 준 추가 메타데이터도 함께 저장 (수동 편집 폼엔 노출 안 됨)
        time: aiResult.time,
        usage: aiResult.usage,
        precautions: aiResult.precautions,
      };
      await update({ inventory: [...data.inventory, product] });

      // 백그라운드 학습 — 실패해도 무시
      const allIngs = [
        ...(draft.keyIngredients ?? []),
        ...(draft.cautionIngredients ?? []),
      ];
      void learnIngredients({
        ingredients: allIngs,
        apiKey: data.profile.apiKey,
        existingLearned: data.learnedIngredients,
      }).then((newLearned) => {
        if (Object.keys(newLearned).length > 0) {
          void update({
            learnedIngredients: { ...data.learnedIngredients, ...newLearned },
          });
        }
      });

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const footer =
    stage === 'edit' ? (
      <div className="flex justify-between gap-2">
        <button
          onClick={() => setStage('input')}
          className="px-4 h-10 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          ← 다시 분석
        </button>
        <button
          onClick={onSave}
          disabled={!formValid || saving}
          className="px-4 h-10 rounded-lg bg-brand-ink text-brand-accent text-sm font-bold disabled:opacity-60"
        >
          {saving ? '저장 중…' : '등록'}
        </button>
      </div>
    ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AI 제품 스마트 등록"
      size="lg"
      footer={footer}
    >
      {/* 단계 1: 입력 */}
      {stage === 'input' && (
        <div className="grid gap-4">
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <Bot size={20} className="text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600 leading-relaxed">
              제품명을 입력하거나 사진을 첨부하면 AI가 브랜드·단계·성분을 자동으로
              채워줍니다. 결과는 등록 전에 직접 수정할 수 있어요.
            </div>
          </div>

          {!hasApiKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              ⚠️ AI API 키가 설정되지 않았습니다.{' '}
              <button
                onClick={onOpenProfile}
                className="underline font-bold"
              >
                내 정보에서 입력
              </button>
            </div>
          )}

          <label className="block">
            <div className="text-xs font-bold text-slate-700 mb-1">제품명</div>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: 에스트라 아토베리어 365 세럼"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAnalyze();
                }}
                className="w-full h-11 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
              />
            </div>
          </label>

          <div>
            <div className="text-xs font-bold text-slate-700 mb-1">
              제품 이미지 (선택)
            </div>
            {imageBase64 ? (
              <div className="relative inline-block">
                <img
                  src={`data:${imageMime};base64,${imageBase64}`}
                  alt="제품"
                  className="max-h-40 rounded-lg border border-slate-200"
                />
                <button
                  onClick={() => {
                    setImageBase64('');
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center"
                  aria-label="이미지 제거"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-400 text-sm flex flex-col items-center justify-center gap-1 transition"
              >
                <ImageIcon size={20} />
                <span>탭하여 사진 첨부</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickImage(f);
              }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 whitespace-pre-line">
              {error}
            </div>
          )}

          <button
            onClick={onAnalyze}
            disabled={(!input.trim() && !imageBase64) || !hasApiKey}
            className="w-full h-12 rounded-xl bg-brand-ink text-brand-accent font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Sparkles size={16} />
            AI 분석하기
          </button>
        </div>
      )}

      {/* 단계 2: 분석 중 */}
      {stage === 'analyzing' && (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-brand-ink rounded-full animate-spin" />
          <div className="text-sm font-medium">AI가 제품을 분석 중입니다…</div>
          <div className="text-xs text-slate-400">보통 5~15초 정도 걸립니다</div>
        </div>
      )}

      {/* 단계 3: 결과 편집 후 저장 */}
      {stage === 'edit' && aiResult && (
        <div className="grid gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-800">
            ✨ AI 분석 완료! 아래 내용을 확인하고 필요하면 수정한 후 [등록]을 누르세요.
          </div>
          {aiResult.usage && (
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
              <div className="text-xs font-bold text-yellow-800 mb-1">권장 사용법</div>
              <div className="text-sm text-yellow-900 leading-snug whitespace-pre-line">
                {aiResult.usage}
              </div>
            </div>
          )}
          {aiResult.precautions && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <div className="text-xs font-bold text-amber-700 mb-1">주의사항</div>
              <div className="text-sm text-amber-800 leading-snug">
                {aiResult.precautions}
              </div>
            </div>
          )}
          <ProductForm
            initial={aiResult}
            onChange={setDraft}
            onValidity={setFormValid}
          />
        </div>
      )}
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { useSkincare } from '../useSkincare';
import type { SkincareProfile } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SKIN_TYPES: SkincareProfile['skinType'][] = [
  '건성',
  '지성',
  '수부지',
  '복합성',
  '민감성',
  '중성',
];

const GENDERS: SkincareProfile['gender'][] = ['남성', '여성', '기타'];

export default function ProfileModal({ open, onClose }: Props) {
  const { data, update } = useSkincare();
  const [draft, setDraft] = useState<SkincareProfile>(data.profile);
  const [saving, setSaving] = useState(false);

  // 모달이 열릴 때마다 현재 프로필을 기준으로 초기화
  useEffect(() => {
    if (open) setDraft(data.profile);
  }, [open, data.profile]);

  const onSave = async () => {
    setSaving(true);
    try {
      await update({ profile: draft });
      onClose();
    } catch (e) {
      alert('저장 실패: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="내 정보"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={saving || !draft.nickname.trim()}
            className="px-4 h-10 rounded-lg bg-brand-ink text-brand-accent text-sm font-bold disabled:opacity-60"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <Field label="닉네임 *">
          <input
            value={draft.nickname}
            onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="성별">
            <div className="flex gap-1">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDraft({ ...draft, gender: g })}
                  className={`flex-1 h-10 rounded-lg text-xs font-medium ${
                    draft.gender === g
                      ? 'bg-brand-ink text-brand-accent'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>
          <Field label="나이">
            <input
              type="number"
              min={1}
              max={120}
              value={draft.age}
              onChange={(e) =>
                setDraft({ ...draft, age: parseInt(e.target.value || '0', 10) })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
            />
          </Field>
        </div>

        <Field label="피부 타입">
          <div className="grid grid-cols-3 gap-1.5">
            {SKIN_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDraft({ ...draft, skinType: t })}
                className={`py-2 rounded-lg text-xs font-bold ${
                  draft.skinType === t
                    ? 'bg-brand-ink text-brand-accent'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="AI API 키 (선택)"
          hint="향후 AI 분석 기능 사용 시 입력. 본인만 볼 수 있습니다."
        >
          <input
            type="password"
            value={draft.apiKey}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
          />
        </Field>
      </div>
    </Modal>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-slate-700 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
    </label>
  );
}

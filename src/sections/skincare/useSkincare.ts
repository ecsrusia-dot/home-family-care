/**
 * 스킨케어 데이터 훅
 *
 * Firestore 경로: users/{uid}/skincare/main (개인 전용)
 * - 로그인된 사용자 본인만 자기 데이터를 읽고 쓸 수 있다.
 * - 가족 그룹과 무관하게 사용자 ID에 종속.
 *
 * 사용법:
 *   const { data, loading, save, update } = useSkincare();
 *   await update({ inventory: [...] });
 *   await update({ history: [...newRecord, ...data.history] });
 */

import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import {
  EMPTY_SKINCARE_DOC,
  type SkincareDoc,
} from './types';

export interface UseSkincareResult {
  data: SkincareDoc;
  loading: boolean;
  /** 부분 업데이트 — 전달한 필드만 머지해서 저장 */
  update: (patch: Partial<SkincareDoc>) => Promise<void>;
  /** 전체 덮어쓰기 (백업 복원 등 특수 용도) */
  save: (next: SkincareDoc) => Promise<void>;
  /** 현재 로그인된 uid (저장 위치 표시용) */
  uid: string | null;
}

export function useSkincare(): UseSkincareResult {
  const { user } = useAuth();
  const [data, setData] = useState<SkincareDoc>(EMPTY_SKINCARE_DOC);
  const [loading, setLoading] = useState(true);

  // 실시간 구독: 같은 사용자가 다른 기기/탭에서 수정하면 즉시 반영
  useEffect(() => {
    if (!user) {
      setData(EMPTY_SKINCARE_DOC);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, 'users', user.uid, 'skincare', 'main');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const raw = snap.data() as Partial<SkincareDoc>;
          // 누락 필드를 기본값으로 채워서 안전하게 반환
          setData({
            ...EMPTY_SKINCARE_DOC,
            ...raw,
            profile: { ...EMPTY_SKINCARE_DOC.profile, ...(raw.profile ?? {}) },
            inventory: raw.inventory ?? [],
            history: raw.history ?? [],
            conditionHistory: raw.conditionHistory ?? [],
            learnedIngredients: raw.learnedIngredients ?? {},
            trash: raw.trash ?? [],
            historyTrash: raw.historyTrash ?? [],
            schemaVersion: raw.schemaVersion ?? 1,
          });
        } else {
          setData(EMPTY_SKINCARE_DOC);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[skincare] onSnapshot error:', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user?.uid]);

  const save = useCallback(
    async (next: SkincareDoc) => {
      if (!user) throw new Error('로그인이 필요합니다.');
      const ref = doc(db, 'users', user.uid, 'skincare', 'main');
      await setDoc(ref, next, { merge: false });
    },
    [user?.uid],
  );

  const update = useCallback(
    async (patch: Partial<SkincareDoc>) => {
      if (!user) throw new Error('로그인이 필요합니다.');
      const ref = doc(db, 'users', user.uid, 'skincare', 'main');
      await setDoc(ref, patch, { merge: true });
    },
    [user?.uid],
  );

  return { data, loading, save, update, uid: user?.uid ?? null };
}

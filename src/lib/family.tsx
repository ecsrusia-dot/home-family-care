import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';

export interface Family {
  id: string;
  ownerUid: string;
  members: string[];
  inviteCode: string;
  name?: string;
}

interface FamilyContextValue {
  family: Family | null;
  loading: boolean;
  /** 새 가족 그룹을 만들고 본인을 owner로 등록한다. */
  createFamily: (name?: string) => Promise<Family>;
  /** 6자리 초대 코드로 기존 가족 그룹에 합류한다. */
  joinByCode: (code: string) => Promise<Family>;
  refresh: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

const newCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');

async function loadUserFamily(uid: string): Promise<Family | null> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const familyId = userSnap.exists() ? (userSnap.data().familyId as string | undefined) : undefined;
  if (!familyId) return null;
  const famSnap = await getDoc(doc(db, 'families', familyId));
  if (!famSnap.exists()) return null;
  return { id: famSnap.id, ...(famSnap.data() as Omit<Family, 'id'>) };
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setFamily(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // users/{uid} 문서가 없으면 최소 정보로 생성
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName ?? '',
          email: user.email ?? '',
          photoURL: user.photoURL ?? '',
          createdAt: serverTimestamp(),
        });
      }
      setFamily(await loadUserFamily(user.uid));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, authLoading]);

  const createFamily = async (name?: string): Promise<Family> => {
    if (!user) throw new Error('로그인이 필요합니다.');
    const code = newCode();
    const famRef = doc(collection(db, 'families'));
    const data: Omit<Family, 'id'> = {
      ownerUid: user.uid,
      members: [user.uid],
      inviteCode: code,
      name: name ?? `${user.displayName ?? '나'}의 가족`,
    };
    await setDoc(famRef, { ...data, createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'users', user.uid), { familyId: famRef.id });
    const fam: Family = { id: famRef.id, ...data };
    setFamily(fam);
    return fam;
  };

  const joinByCode = async (code: string): Promise<Family> => {
    if (!user) throw new Error('로그인이 필요합니다.');
    const trimmed = code.trim().toUpperCase();
    const q = query(collection(db, 'families'), where('inviteCode', '==', trimmed));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('해당 초대 코드를 가진 가족 그룹을 찾을 수 없습니다.');
    const famDoc = snap.docs[0];
    await updateDoc(famDoc.ref, { members: arrayUnion(user.uid) });
    await updateDoc(doc(db, 'users', user.uid), { familyId: famDoc.id });
    const data = famDoc.data() as Omit<Family, 'id'>;
    const fam: Family = {
      id: famDoc.id,
      ...data,
      members: Array.from(new Set([...(data.members ?? []), user.uid])),
    };
    setFamily(fam);
    return fam;
  };

  return (
    <FamilyContext.Provider value={{ family, loading, createFamily, joinByCode, refresh }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used inside <FamilyProvider>');
  return ctx;
}

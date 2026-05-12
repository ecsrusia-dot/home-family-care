# 우리집·가족 종합 관리 앱 (home-family-care)

React + Vite 기반 PWA. 한 가족의 일상을 네 개 섹션으로 묶어 운영한다.

- **스킨케어** — 기존 단일 HTML 자산(`legacy/skincare.html`)을 흡수
- **우리가족 메모** — 일정 · 식사 · 위시리스트 · 메모
- **반려묘 케어** — 고양이 3마리 프로필 · 사료 · 병원 · 건강
- **우리집 관리** — 생필품 · 청소 · 주기관리 · 기록

자세한 설계는 [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) 참고.

## 빠른 시작

```bash
# (선택) 스캐폴딩 중 남은 빈 node_modules 디렉토리가 있으면 먼저 정리
rm -rf node_modules

# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (http://localhost:5173)
npm run dev

# 3. 프로덕션 빌드
npm run build

# 4. 빌드 결과 미리보기
npm run preview
```

## 환경 변수

새 Firebase 프로젝트(`home-family-care`)를 만들고 그 웹 앱 설정값을 `.env.local`에 채운다.

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=home-family-care.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=home-family-care
VITE_FIREBASE_STORAGE_BUCKET=home-family-care.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
```

기존 스킨케어 데이터는 별도의 `my-ai-skincare` 프로젝트와 `legacy/skincare.html`에 그대로 남아 있고, 새 통합 앱은 깨끗한 새 프로젝트에서 시작한다.

> Firebase 클라이언트 SDK 키는 공개되어도 무방하지만, **Firestore/Storage 보안 규칙**을 가족 멤버 단위로 반드시 잠가야 한다.

## 디렉토리

```
src/
├─ main.tsx           # 엔트리
├─ App.tsx            # 라우터 + 셸
├─ index.css          # Tailwind 베이스
├─ lib/
│  ├─ firebase.ts     # Firebase 초기화 + 오프라인 캐시
│  ├─ auth.tsx        # AuthContext (Google 로그인)
│  └─ family.tsx      # FamilyContext (가족 그룹)
├─ components/shell/  # TopBar · BottomTabs · AuthGate · FamilyGate
└─ sections/
   ├─ skincare/       # (Phase 2에서 legacy/skincare.html 이식)
   ├─ memo/
   ├─ cats/
   └─ home/
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 후 `gh-pages` 브랜치에 배포한다.

저장소 이름이 `home-family-care`가 아니면 `vite.config.ts`의 `BASE` 상수를 수정한다.

## 로드맵

진행 단계는 `IMPLEMENTATION_PLAN.md`의 “개발 로드맵” 섹션 참고.

- [x] Phase 1: 셸 & 인증 스캐폴딩
- [ ] Phase 2: 스킨케어 이식 (`legacy/skincare.html` → `sections/skincare/`)
- [ ] Phase 3: 우리가족 메모
- [ ] Phase 4: 반려묘 케어
- [ ] Phase 5: 우리집 관리 & 다듬기

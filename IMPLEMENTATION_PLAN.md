# 우리집·가족 종합 관리 앱 구현 계획

> 작성일: 2026-05-12  
> 목표: 뷰티/스킨케어 + 가족 메모 + 반려묘 케어 + 우리집 관리를 하나로 묶은 React PWA를 GitHub에 배포한다.

---

## 1. 프로젝트 개요

이 앱은 한 가구의 일상을 한 화면에서 운영하기 위한 “종합 콘솔”이다. 기존에 단독 웹앱으로 잘 쓰고 있는 스킨케어 시스템(`index.html`)을 한 섹션으로 흡수하고, 그와 동일한 톤·구조(슬레이트 다크 + 옐로우 액센트, 탭 기반, Firestore 동기화, 오프라인 캐시)를 다른 세 섹션에도 확장한다. 사용자는 본인(주 편집자)이며, 가족 구성원은 같은 데이터를 함께 보고 편집할 수 있다.

핵심 4개 섹션은 다음과 같다. 스킨케어는 기존 자산을 거의 그대로 옮기고, 나머지 세 섹션은 같은 디자인 언어로 새로 구축한다.

1. **스킨케어 관리** — 기존 시뮬레이터/트래커/인벤토리 그대로 이식.
2. **우리가족 메모** — 일정, 식사, 위시리스트, 자유 메모.
3. **반려묘 케어** — 3마리 개별 프로필, 사료, 병원, 건강, 메모.
4. **우리집 관리** — 생필품 재고, 청소 루틴, 주기 관리(필터·정수기·소모품), 가전·계약 기록.

---

## 2. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 빌드 | **Vite 5** | 빠른 dev 서버, 단순한 설정, SPA 정적 빌드 |
| 프레임워크 | **React 18 + TypeScript** | 기존 스킨케어 코드와 호환, 타입으로 데이터 모델 안정화 |
| 스타일 | **Tailwind CSS** | 기존 앱과 동일 톤 유지(slate-900 + yellow-400) |
| 라우팅 | **react-router-dom v6** | 4개 섹션 + 하위 페이지 |
| 상태 | **React Context + 로컬 useState** | 외부 상태관리 라이브러리 불필요한 규모 |
| 인증/DB | **Firebase Auth(Google) + Firestore** | 기존 `my-ai-skincare` 프로젝트 재사용 |
| 오프라인 | **Firestore IndexedDB persistence + vite-plugin-pwa** | 네트워크 끊겨도 읽기 가능, 설치형 PWA |
| 아이콘 | **lucide-react** | Font Awesome CDN 대신 트리쉐이킹되는 SVG |
| 폰트 | **Noto Sans KR** (Google Fonts) | 기존과 동일 |
| 배포 | **GitHub Pages + GitHub Actions** | 무료, 자동 배포 |

기존 스킨케어 HTML이 사용하던 `firebase-compat` SDK 대신, 새 프로젝트는 **모듈러 Firebase v10 SDK**를 쓴다. 마이그레이션 시 호출부만 바꾸면 되고 번들 크기와 트리쉐이킹에서 이득이 크다.

---

## 3. 디렉토리 구조

```
home-family-care/
├─ .github/workflows/deploy.yml        # GitHub Pages 자동 배포
├─ public/
│  ├─ manifest.webmanifest
│  ├─ icons/                            # 192/512 PWA 아이콘
│  └─ favicon.svg
├─ src/
│  ├─ main.tsx                          # 앱 엔트리
│  ├─ App.tsx                           # 라우터 + 셸(상단바, 하단 탭)
│  ├─ lib/
│  │  ├─ firebase.ts                    # Firebase 초기화 + 오프라인 캐시
│  │  ├─ auth.tsx                       # AuthContext, Google 로그인
│  │  └─ family.tsx                     # FamilyContext (현재 가족 그룹 ID)
│  ├─ components/
│  │  ├─ shell/                         # TopBar, BottomTabs, SectionHeader
│  │  └─ ui/                            # Button, Modal, Card, EmptyState...
│  ├─ sections/
│  │  ├─ skincare/                      # 기존 스킨케어 마이그레이션
│  │  │  ├─ SkincareSection.tsx
│  │  │  ├─ tabs/Simulator.tsx
│  │  │  ├─ tabs/Tracker.tsx
│  │  │  └─ tabs/Inventory.tsx
│  │  ├─ memo/                          # 우리가족 메모
│  │  │  ├─ MemoSection.tsx
│  │  │  ├─ Schedule.tsx
│  │  │  ├─ Meals.tsx
│  │  │  ├─ Wishlist.tsx
│  │  │  └─ Notes.tsx
│  │  ├─ cats/                          # 반려묘 케어
│  │  │  ├─ CatsSection.tsx
│  │  │  ├─ CatProfile.tsx
│  │  │  ├─ FoodLog.tsx
│  │  │  ├─ HospitalLog.tsx
│  │  │  └─ HealthLog.tsx
│  │  └─ home/                          # 우리집 관리
│  │     ├─ HomeSection.tsx
│  │     ├─ Supplies.tsx
│  │     ├─ Cleaning.tsx
│  │     ├─ Periodic.tsx
│  │     └─ Records.tsx
│  ├─ hooks/
│  │  ├─ useCollection.ts               # Firestore onSnapshot 헬퍼
│  │  └─ useDoc.ts
│  └─ types/                            # 도메인 타입(Cat, Memo, Supply...)
├─ index.html
├─ tailwind.config.ts
├─ vite.config.ts                       # vite-plugin-pwa 설정
├─ tsconfig.json
└─ package.json
```

---

## 4. 데이터 모델 (Firestore)

가족 공유를 위해 모든 데이터는 **개인 컬렉션이 아니라 가족 그룹(`families/{familyId}`) 하위**에 둔다. 그러면 같은 그룹 멤버가 모두 같은 문서를 읽고 쓸 수 있다.

```
users/{uid}
  - displayName, email, photoURL
  - familyId            # 현재 소속된 가족 그룹

families/{familyId}
  - ownerUid
  - members: [uid, ...]
  - inviteCode          # 가족 초대용 6자리 코드

families/{familyId}/skincare/{docId}     # 기존 스킨케어 데이터 그대로 흡수
  (inventory, history, conditionHistory, learnedIngredients, profile)

families/{familyId}/memos/{memoId}
  - type: 'schedule' | 'meal' | 'wish' | 'note'
  - title, body, date(ISO), tags[], authorUid, createdAt

families/{familyId}/cats/{catId}
  - name, birthDate, sex, photoURL, weightKg, notes

families/{familyId}/cats/{catId}/events/{eventId}
  - kind: 'food' | 'hospital' | 'health' | 'memo'
  - date, amount, vet, diagnosis, body, authorUid

families/{familyId}/supplies/{itemId}    # 생필품 재고
  - name, category, qty, unit, lowThreshold, lastBoughtAt

families/{familyId}/cleaning/{taskId}    # 청소 루틴
  - name, area, intervalDays, lastDoneAt, assigneeUid

families/{familyId}/periodic/{itemId}    # 주기 관리(필터, 정수기, 보일러 등)
  - name, intervalDays, lastChangedAt, vendor, note

families/{familyId}/records/{recordId}   # 가전·계약·서비스 기록
  - kind, name, purchasedAt, warrantyUntil, attachments[]
```

이 구조의 장점은 (1) 권한 규칙을 `families/{familyId}` 한 곳에만 걸면 모든 하위 컬렉션이 자동 보호되고, (2) 사용자가 가족을 옮기거나 추가 가족을 만들어도 데이터가 섞이지 않는다는 점이다.

---

## 5. 인증과 가족 그룹

첫 로그인은 Google OAuth 팝업으로 진행한다. 로그인이 끝나면 `users/{uid}` 문서를 확인하고, `familyId`가 없으면 두 갈래로 안내한다. 새 가족을 만들거나, 가족이 공유한 6자리 초대 코드를 입력해 기존 그룹에 합류한다. 초대 코드는 `families/{familyId}.inviteCode` 필드에서 무작위로 생성하고, 합류 시 `members` 배열에 `uid`를 추가한다.

Firestore 보안 규칙 핵심은 한 줄로 요약된다. “요청자의 `uid`가 그 문서가 속한 가족의 `members` 배열에 들어 있어야 한다.” 규칙 예시는 다음과 같다.

```
match /families/{familyId}/{document=**} {
  allow read, write: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.members;
}
```

---

## 6. 섹션별 설계

### 6-1. 스킨케어 (기존 자산 이식)

기존 `index.html`의 `App` 컴포넌트를 `SkincareSection.tsx`로 옮기고, 내부 3개 탭(루틴 시뮬레이터, 트래커 & 추천, 인벤토리)을 각각 파일로 분리한다. 분리는 기능 변경 없이 “복붙 → JSX/TS화 → Firebase v10 모듈러 API로 호출부 교체” 순으로 진행한다. 기존에 `users/{uid}` 루트에 저장하던 데이터는 일회성 마이그레이션 스크립트로 `families/{familyId}/skincare/*`로 옮긴다.

### 6-2. 우리가족 메모

상단에 일정/식사/위시/메모 4개 탭. 일정은 월간 캘린더 + 일자 클릭 시 상세 패널, 식사는 ‘오늘 뭐 먹지?’ 위주로 날짜별 아침·점심·저녁 텍스트 카드, 위시리스트는 항목·가격·우선순위·구매여부 토글, 메모는 자유 형식 + 태그. 모든 항목은 작성자(`authorUid`)와 작성 시각을 함께 저장해 누가 적었는지 표시한다.

### 6-3. 반려묘 케어

상단에 고양이 3마리 프로필 칩(사진 + 이름)을 배치하고, 칩을 누르면 그 아이의 사료/병원/건강/메모 타임라인이 표시된다. 사료는 “브랜드, 일일 급여량, 마지막 개봉일” 위주, 병원은 진료일·증상·진단·처방·다음 방문일, 건강은 체중·식욕·배변 등 정기 기록, 메모는 자유 노트. 체중은 라인 차트로 시각화(Recharts).

### 6-4. 우리집 관리

생필품은 “재고 임계치 이하” 자동 강조 + 장보기 리스트 자동 생성. 청소는 영역(거실/주방/욕실/침실) × 주기 매트릭스로 보여주고 “오늘 해야 할 청소”를 카드로 뽑아준다. 주기 관리는 필터·정수기·보일러·도어락 배터리 같은 항목을 D-day로 환산해 알림. 기록은 가전 보증서, 계약서, A/S 이력 등을 사진/PDF 첨부와 함께 보관(파일은 Firebase Storage).

---

## 7. UI/UX 디자인 시스템

기존 스킨케어 앱의 톤(밝은 회색 배경, 슬레이트-900 헤더/탭, 옐로우-400 강조, 카드 둥근 모서리 `rounded-2xl`, 그림자 `shadow-sm`, Noto Sans KR)을 그대로 디자인 토큰화한다. 셸은 모바일 우선으로 상단 가족명/로그인 정보 표시줄과 하단 4개 탭바(스킨케어·메모·고양이·집)를 둔다. 데스크톱에서는 하단 탭이 사이드바로 전환되도록 Tailwind의 `md:` 분기로 처리한다.

---

## 8. PWA 설정

`vite-plugin-pwa`로 manifest와 service worker를 자동 생성한다. 캐싱 전략은 셸(HTML/JS/CSS)은 precache, 폰트와 아이콘은 stale-while-revalidate, Firestore 응답은 SDK 자체의 IndexedDB persistence에 맡긴다. 홈 화면 추가 시 아이콘은 192·512 두 사이즈를 둔다.

---

## 9. GitHub 배포 파이프라인

저장소를 `home-family-care`로 만들고 `main` 브랜치에 push할 때마다 GitHub Actions가 `npm ci → npm run build → gh-pages` 순서로 배포한다. Firebase 설정 값(apiKey 등)은 클라이언트 SDK라 공개되어도 되지만, **반드시 Firestore 보안 규칙으로 보호**된 상태여야 한다. 워크플로 골격은 다음과 같다.

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

`vite.config.ts`에는 `base: '/home-family-care/'`를 지정해 GitHub Pages 하위 경로를 잡아준다(커스텀 도메인 쓰면 `/`로 되돌림).

---

## 10. 개발 로드맵 (단계별)

진행은 5단계로 나누고, 각 단계가 끝날 때마다 배포해 실사용으로 검증한다.

**Phase 1 — 셸 & 인증 (1주)**  
Vite 프로젝트 부트스트랩, Tailwind 설정, Firebase 초기화, Google 로그인, 가족 그룹 생성/합류 화면, 4개 섹션 빈 라우트, 하단 탭바, GitHub Pages 첫 배포까지.

**Phase 2 — 스킨케어 이식 (1주)**  
기존 `index.html`을 `SkincareSection`으로 옮기고 Firebase v10 모듈러 API로 교체, 데이터 경로를 `families/{familyId}/skincare/*`로 변경, 기존 데이터 이전 스크립트 작성·실행.

**Phase 3 — 우리가족 메모 (1주)**  
4개 탭(일정·식사·위시·메모) MVP, 작성자 표시, 가족 멤버 간 실시간 동기화 확인.

**Phase 4 — 반려묘 케어 (1주)**  
3마리 프로필, 4종 이벤트 로깅, 체중 차트, 사진 업로드(Firebase Storage).

**Phase 5 — 우리집 관리 & 다듬기 (1~2주)**  
생필품·청소·주기관리·기록 4탭, PWA 설치 배너, 알림(브라우저 Notification API), 디자인 통일, 접근성 점검.

---

## 11. 기존 스킨케어 데이터 처리 방침

**새 Firebase 프로젝트(`home-family-care`)를 사용하므로 마이그레이션은 하지 않는다.** 기존 `my-ai-skincare` 프로젝트와 `legacy/skincare.html`은 그대로 보존되며, 새 통합 앱은 빈 상태에서 시작한다. 그동안 쌓아둔 스킨케어 기록을 조회하고 싶을 때는 언제든 `legacy/skincare.html`을 브라우저로 열어 예전처럼 사용할 수 있다.

Phase 2에서는 기존 단일 HTML의 **UI와 로직만** 새 앱의 스킨케어 섹션으로 이식한다. 즉 화면과 기능은 같지만 데이터는 깨끗한 새 Firestore에서 시작한다. 만약 나중에 옛 기록을 새 앱으로 옮기고 싶어지면 그때 일회성 수동 입력 또는 별도 도구를 검토한다.

---

## 12. 보안·운영 체크리스트

배포 전에 다음 항목을 점검한다. Firestore 규칙으로 가족 멤버 외 접근 차단이 실제로 동작하는지(에뮬레이터 테스트), Storage 규칙도 동일하게 가족 단위로 잠갔는지, OAuth 승인 도메인에 `*.github.io` 또는 커스텀 도메인을 등록했는지, PWA manifest의 `start_url`과 `scope`가 `base` 경로와 일치하는지, Lighthouse PWA 점수, 모바일 Safari에서 오프라인 동작.

---

## 13. 다음 액션

1. GitHub에 `home-family-care` 빈 저장소 생성.
2. 로컬에서 `npm create vite@latest home-family-care -- --template react-ts` 후 위 디렉토리 구조로 초기화.
3. Phase 1을 시작해 첫 배포(빈 셸 + 로그인)까지 도달.

원하시면 바로 Phase 1 스캐폴딩(package.json, vite.config.ts, tailwind 설정, Firebase 초기화 코드, 빈 셸 컴포넌트, GitHub Actions 워크플로)을 이 폴더 안에 생성해 드릴 수 있습니다.

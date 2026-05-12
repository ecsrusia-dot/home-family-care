import SectionPlaceholder from '../../components/ui/SectionPlaceholder';

export default function SkincareSection() {
  return (
    <SectionPlaceholder
      title="스킨케어 관리"
      emoji="✨"
      phase="Phase 2 — 기존 스킨케어 단일 HTML 이식 예정"
      description={
        <>
          기존 <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">legacy/skincare.html</code>의
          루틴 시뮬레이터, 트래커 & 추천, 인벤토리 세 탭을 이 섹션 아래로 이식합니다. 데이터 경로는
          <code className="px-1 py-0.5 bg-slate-100 rounded text-xs ml-1">families/&#123;familyId&#125;/skincare/main</code>
          로 옮깁니다.
        </>
      }
      todo={[
        '루틴 시뮬레이터 (성분 + 단계별 추천)',
        '트래커 & 추천 (컨디션·이력)',
        '인벤토리 (보유 제품 + 학습된 성분)',
        '기존 users/{uid} 데이터 → families/{familyId}/skincare 일회성 마이그레이션',
      ]}
    />
  );
}

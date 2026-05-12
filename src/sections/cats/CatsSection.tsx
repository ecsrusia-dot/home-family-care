import SectionPlaceholder from '../../components/ui/SectionPlaceholder';

export default function CatsSection() {
  return (
    <SectionPlaceholder
      title="반려묘 케어"
      emoji="🐾"
      phase="Phase 4 — 곧 구현"
      description="우리 고양이 3마리를 각각의 프로필 카드로 두고, 사료·병원·건강·메모를 타임라인으로 기록합니다. 체중은 라인 차트로 시각화됩니다."
      todo={[
        '고양이 프로필 (사진·생일·성별·체중)',
        '사료 로그 (브랜드·일일 급여량·개봉일)',
        '병원 로그 (진료일·증상·진단·다음 방문)',
        '건강 로그 (체중·식욕·배변) + 차트',
        '자유 메모 + 사진 업로드',
      ]}
    />
  );
}

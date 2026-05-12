import SectionPlaceholder from '../../components/ui/SectionPlaceholder';

export default function HomeSection() {
  return (
    <SectionPlaceholder
      title="우리집 관리"
      emoji="🏠"
      phase="Phase 5 — 곧 구현"
      description="생필품 재고, 청소 루틴, 주기 관리(필터·정수기·소모품), 가전·계약 기록을 한 화면에서 운영합니다. 임계치 이하 품목은 자동으로 장보기 리스트에 올라옵니다."
      todo={[
        '생필품 재고 + 자동 장보기 리스트',
        '청소 루틴 매트릭스 (영역 × 주기)',
        '주기 관리 D-day (필터·정수기·배터리…)',
        '가전·계약 기록 + 사진/PDF 첨부',
      ]}
    />
  );
}

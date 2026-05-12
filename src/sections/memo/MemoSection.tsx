import SectionPlaceholder from '../../components/ui/SectionPlaceholder';

export default function MemoSection() {
  return (
    <SectionPlaceholder
      title="우리가족 메모"
      emoji="📝"
      phase="Phase 3 — 곧 구현"
      description="가족이 함께 보는 일정·식사·위시리스트·자유 메모를 한 곳에서 관리합니다. 모든 항목은 작성자(가족 멤버)와 작성 시각이 함께 기록됩니다."
      todo={[
        '일정 — 월간 캘린더 + 일자 상세',
        '식사 — 날짜별 아침/점심/저녁',
        '위시리스트 — 항목·가격·우선순위·구매여부',
        '자유 메모 — 태그 기반 검색',
      ]}
    />
  );
}

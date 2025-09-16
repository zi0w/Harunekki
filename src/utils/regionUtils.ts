/**
 * 장소명에서 지역명을 추출하는 유틸리티 함수
 */

const REGION_PATTERNS = [
  /제주|제주도/,
  /서울|서울시/,
  /부산|부산시/,
  /대구|대구시/,
  /인천|인천시/,
  /광주|광주시/,
  /대전|대전시/,
  /울산|울산시/,
  /경기|경기도/,
  /강원|강원도/,
  /충북|충청북도/,
  /충남|충청남도/,
  /전북|전라북도/,
  /전남|전라남도/,
  /경북|경상북도/,
  /경남|경상남도/,
  /세종|세종시/,
];

const SPECIAL_CITIES = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
];

/**
 * 장소명 배열에서 지역명을 추출합니다.
 * @param placeNames 장소명 배열
 * @returns 추출된 지역명 (추출 실패 시 '여행지' 반환)
 */
export function extractRegionName(placeNames: string[]): string {
  if (placeNames.length === 0) return '여행지';

  // 지역명 패턴 매칭
  for (const pattern of REGION_PATTERNS) {
    for (const placeName of placeNames) {
      const match = placeName.match(pattern);
      if (match) {
        const region = match[0];

        // 특별시/광역시는 그대로 반환
        if (SPECIAL_CITIES.includes(region)) {
          return region;
        }

        // 도 단위는 그대로 반환
        if (region.includes('도')) return region;

        // 시 단위는 그대로 반환
        if (region.includes('시')) return region;

        // 그 외에는 도 추가
        return region + '도';
      }
    }
  }

  // 패턴 매칭 실패 시 첫 번째 장소명에서 지역 추출 시도
  const firstPlace = placeNames[0];
  if (firstPlace) {
    // "지역명 + 장소명" 형태에서 지역명 추출
    const parts = firstPlace.split(' ');
    if (parts.length > 1) {
      return parts[0];
    }
  }

  return '여행지';
}

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
 * @returns 추출된 지역명 (여러 지역이 섞여있으면 '국내 여행' 반환)
 */
export function extractRegionName(placeNames: string[]): string {
  if (placeNames.length === 0) return '국내 여행';

  const foundRegions = new Set<string>();

  // 모든 장소에서 지역명 패턴 매칭
  for (const placeName of placeNames) {
    for (const pattern of REGION_PATTERNS) {
      const match = placeName.match(pattern);
      if (match) {
        const region = match[0];

        // 특별시/광역시는 그대로 저장
        if (SPECIAL_CITIES.includes(region)) {
          foundRegions.add(region);
          continue;
        }

        // 도 단위는 그대로 저장
        if (region.includes('도')) {
          foundRegions.add(region);
          continue;
        }

        // 시 단위는 그대로 저장
        if (region.includes('시')) {
          foundRegions.add(region);
          continue;
        }

        // 그 외에는 도 추가해서 저장
        foundRegions.add(region + '도');
      }
    }
  }

  // 지역이 하나도 발견되지 않으면 '국내 여행'
  if (foundRegions.size === 0) {
    return '국내 여행';
  }

  // 지역이 하나면 해당 지역 반환
  if (foundRegions.size === 1) {
    return Array.from(foundRegions)[0];
  }

  // 여러 지역이 섞여있으면 '국내 여행'
  return '국내 여행';
}

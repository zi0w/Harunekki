// 제철 음식용 타입
export type SeasonalCard = {
  id: string;
  title: string;
  location: string;
  img: string;
  description: string;
};

// 기본 이미지 URL (제철음식 썸네일)
import seasonalThumbnail from '@/assets/icons/seasonal/Thumbnail.webp';
export const DEFAULT_IMAGE_URL = seasonalThumbnail;

// XML을 JSON으로 변환하는 함수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseXmlToJson = (xmlText: string): any => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const result: any = {};
    const response = xmlDoc.querySelector('response');
    if (response) {
      result.response = {};
      const header = response.querySelector('header');
      if (header) {
        result.response.header = {};
        const resultCode = header.querySelector('resultCode')?.textContent;
        const resultMsg = header.querySelector('resultMsg')?.textContent;
        result.response.header.resultCode = resultCode;
        result.response.header.resultMsg = resultMsg;
      }
      const body = response.querySelector('body');
      if (body) {
        result.response.body = {};
        const items = body.querySelectorAll('item');
        if (items.length > 0) {
          result.response.body.items = Array.from(items).map((item) => {
            const itemData: any = {};
            Array.from(item.children).forEach((child) => {
              itemData[child.tagName] = child.textContent;
            });
            return itemData;
          });
        }
      }
    }
    return result;
  } catch (error) {
    console.error('XML 파싱 실패:', error);
    return {};
  }
};

// API 데이터에서 이미지 URL 추출
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getImageUrl = (item: any): string => {
  // rtnStreFileNm이 있고 빈 문자열이 아닌 경우
  if (item.rtnStreFileNm && item.rtnStreFileNm.trim() !== '') {
    const imageFile = item.rtnStreFileNm.split('|')[0];
    return `http://www.nongsaro.go.kr/cms_contents/789/${imageFile}`;
  }

  // 이미지가 없는 경우 기본 이미지 사용
  return DEFAULT_IMAGE_URL;
};

// 설명 개선을 위한 비동기 함수 (현재 사용하지 않음 - 개별 컴포넌트에서 처리)
// const enhanceDescriptionsAsync = async (cards: SeasonalCard[]) => {
//   try {
//     for (const card of cards) {
//       if (
//         card.description === '제철 음식에 대한 설명을 준비 중입니다.' ||
//         !card.description ||
//         card.description.trim() === ''
//       ) {
//         const result = await enhanceSeasonalFoodDescription({
//           title: card.title,
//           originalDescription: card.description,
//           location: card.location,
//         });

//         // 설명 업데이트 (실제로는 상태 관리가 필요하지만 여기서는 로그만)
//         console.log(
//           `설명 개선 완료 - ${card.title}:`,
//           result.enhancedDescription,
//         );
//       }
//     }
//   } catch (error) {
//     console.error('설명 개선 중 오류:', error);
//   }
//

// 농촌진흥청 시절식 API 호출 함수 (CORS 프록시 사용)
export const fetchSeasonalFoods = async (): Promise<SeasonalCard[]> => {
  try {
    const apiKey = import.meta.env.VITE_NONGSARO_API_KEY;
    if (!apiKey) {
      console.error('NONGSARO_API_KEY가 설정되지 않았습니다.');
      return [];
    }

    // CORS 프록시 사용 (codetabs)
    const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=';
    const targetUrl = `https://apis.data.go.kr/nongsaro/service/nvpcFdCkry/fdNmLst?apiKey=${apiKey}&apiType=json&pageNo=1&numOfRows=30&schType=B&tema_ctg01=TM003`;
    
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    if (data?.response?.body?.items) {
      const foodCards: SeasonalCard[] = data.response.body.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any, index: number) => ({
          id: `seasonal-${index}`,
          title: item.trditfdNm || '제철 음식',
          location: item.atptCodeNm || '제철 음식',
          img: getImageUrl(item),
          description:
            item.rtnImageDc || '제철 음식에 대한 설명을 준비 중입니다.',
        }),
      );

      // 사진이 있는 것부터 우선적으로 정렬
      const sortedCards = foodCards.sort((a, b) => {
        const aHasImage = a.img !== DEFAULT_IMAGE_URL;
        const bHasImage = b.img !== DEFAULT_IMAGE_URL;

        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;
        return 0;
      });

      return sortedCards;
    }

    return [];
  } catch (error) {
    console.error('시절식 API 호출 실패:', error);
    return [];
  }
};

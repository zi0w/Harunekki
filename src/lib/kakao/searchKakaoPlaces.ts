// src/lib/kakao/searchKakaoPlaces.ts
import axios from 'axios';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

export async function searchKakaoPlaces(keyword: string) {
  const url = 'https://dapi.kakao.com/v2/local/search/keyword.json';
  const { data } = await axios.get(url, {
    params: { query: keyword },
    headers: {
      Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
    },
  });

  return data.documents; // 배열
}

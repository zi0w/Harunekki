// src/lib/kakao/loadKakaoMap.ts
export function loadKakaoMapScript(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById('kakao-map-sdk')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Kakao Map SDK load failed'));
    document.head.appendChild(script);
  });
}

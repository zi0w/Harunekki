export const loadKakaoMapScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('kakao-map-sdk')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;

    script.onload = () => {
      window.kakao.maps.load(() => {
        resolve();
      });
    };

    script.onerror = () => {
      console.error('❌ Kakao SDK load failed');
      reject(new Error('Kakao Map SDK load failed'));
    };

    document.head.appendChild(script);
  });
};

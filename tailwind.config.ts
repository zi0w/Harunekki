import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        kakaoBig: ['KakaoBigSans', 'sans-serif'],
        kakaoSmall: ['KakaoSmallSans', 'sans-serif'],
        abeezee: ['AbeeZee', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

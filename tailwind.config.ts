import type { Config } from 'tailwindcss';
import scrollbarHide from 'tailwind-scrollbar-hide';
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
  plugins: [
    scrollbarHide,
    // Typography utilities (Headers + Body/S400)
    function ({ addComponents }) {
      addComponents({
        // Header / H0
        '.hdr-h0': {
          color: '#001B36',
          fontFamily: 'KakaoBigSans, sans-serif',
          fontSize: '2.75rem', // 44px
          fontWeight: '800',
          lineHeight: '3.96rem', // 144%
          letterSpacing: '-0.022rem',
          textAlign: 'center',
        },
        // Header / H1
        '.hdr-h1': {
          color: '#001B36',
          fontFamily: 'KakaoBigSans, sans-serif',
          fontSize: '2rem', // 32px
          fontWeight: '800',
          lineHeight: '3rem', // 150%
          letterSpacing: '-0.016rem',
          textAlign: 'center',
        },
        // Header / H2
        '.hdr-h2': {
          color: '#001B36',
          fontFamily: 'KakaoBigSans, sans-serif',
          fontSize: '1.75rem', // 28px
          fontWeight: '800',
          lineHeight: '2.73rem', // 156%
          letterSpacing: '-0.014rem',
          textAlign: 'center',
        },
        // Header / H3
        '.hdr-h3': {
          color: '#001B36',
          fontFamily: 'KakaoBigSans, sans-serif',
          fontSize: '1.5rem', // 24px
          fontWeight: '800',
          lineHeight: '2.25rem', // 150%
          letterSpacing: '-0.012rem',
          textAlign: 'center',
        },
        // Header / H4
        '.hdr-h4': {
          color: '#001B36',
          fontFamily: 'KakaoBigSans, sans-serif',
          fontSize: '1.25rem', // 20px
          fontWeight: '700',
          lineHeight: '2rem', // 160%
          letterSpacing: '-0.01rem',
          textAlign: 'center',
        },
        // Header / H5
        '.hdr-h5': {
          color: '#001B36',
          fontFamily: 'KakaoBigSans, sans-serif',
          fontSize: '1rem', // 16px
          fontWeight: '700',
          lineHeight: '1.5rem', // 150%
          letterSpacing: '-0.008rem',
          textAlign: 'center',
        },
        // Body / S400
        '.body-s400': {
          color: '#383D48',
          fontFamily: 'KakaoSmallSans, sans-serif',
          fontSize: '0.75rem', // 12px
          fontWeight: '400',
          lineHeight: '1.23rem', // 164%
          letterSpacing: '-0.015rem',
          textAlign: 'center',
        },
      });
    },
  ],
};

export default config;

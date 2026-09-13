/** @type {import('tailwindcss').Config} */
//
// "Screening room" — a warm, near-black interior lit by one champagne light.
// The couple's photographs are the only bright thing on screen; everything
// else recedes into hairlines, film grain and space.
//
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: { xs: '360px' },
      colors: {
        // Surfaces, warm rather than neutral — a cold grey reads like a
        // developer tool, and this is for a wedding.
        screen: '#0C0A09',
        surface: '#141110',
        'surface-2': '#1D1917',
        'surface-3': '#272120',
        hair: '#2B2523',
        'hair-2': '#3D3431',

        // Type
        text: '#F4EEE6',
        'text-2': '#B4A89B',
        'text-3': '#7B6F66',

        // The single accent: candlelight on champagne.
        gold: '#E8C08A',
        'gold-2': '#C99F63',
        'gold-3': '#8C6E3C',

        clay: '#D98368',
        sage: '#9FB39A',
      },
      fontFamily: {
        sans: ['Pretendard', 'Pretendard Variable', '-apple-system', 'BlinkMacSystemFont',
          'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
        display: ['PlayfairDisplay', 'Nanum Myeongjo', 'Apple SD Gothic Neo', 'Batang', 'serif'],
        wordmark: ['Cinzel', 'Nanum Myeongjo', 'serif'],
      },
      letterSpacing: {
        label: '0.09em',
        wordmark: '0.34em',
      },
      boxShadow: {
        lift: '0 24px 60px -30px rgba(0,0,0,0.9)',
        panel: '0 40px 90px -40px rgba(0,0,0,0.95)',
        frame: '0 40px 90px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)',
        // A candle behind the element rather than a drop shadow under it.
        glow: '0 0 0 1px rgba(232,192,138,0.35), 0 12px 40px -16px rgba(232,192,138,0.35)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        drawIn: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        flicker: {
          '0%,100%': { opacity: '1' },
          '45%': { opacity: '0.86' },
          '52%': { opacity: '1' },
        },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.22,1,0.36,1) both',
        flicker: 'flicker 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

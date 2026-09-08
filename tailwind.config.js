/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: { xs: '360px' },
      colors: {
        // Paper & ink — a printed-programme palette rather than a UI kit one.
        paper: '#F7F4EF',
        'paper-2': '#EFEAE1',
        card: '#FFFFFF',
        line: '#E3DCD0',
        'line-soft': '#EFE9DF',
        ink: '#211D18',
        'ink-2': '#514A40',
        'ink-3': '#8C8477',
        gold: '#A6813C',
        'gold-deep': '#8A6A2E',
        'gold-wash': '#F3EADA',
        clay: '#B0604A',
        // Editor stage
        stage: '#1B1917',
        'stage-2': '#26231F',
        'stage-line': '#37332E',
      },
      fontFamily: {
        // The UI leans on system faces; the heavy webfonts are for the canvas.
        sans: ['Pretendard', 'Pretendard Variable', '-apple-system', 'BlinkMacSystemFont',
          'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
        display: ['PlayfairDisplay', 'Apple SD Gothic Neo', 'Nanum Myeongjo', 'Batang', 'serif'],
      },
      letterSpacing: {
        label: '0.07em',
        wordmark: '0.32em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(33,29,24,0.04), 0 8px 24px -16px rgba(33,29,24,0.20)',
        lift: '0 2px 6px rgba(33,29,24,0.06), 0 18px 40px -24px rgba(33,29,24,0.35)',
        panel: '0 24px 60px -28px rgba(33,29,24,0.45)',
        frame: '0 30px 70px -30px rgba(0,0,0,0.75)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        sheen: { from: { transform: 'translateX(-120%)' }, to: { transform: 'translateX(220%)' } },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.22,1,0.36,1) both',
        sheen: 'sheen 1.6s cubic-bezier(0.4,0,0.2,1) infinite',
      },
    },
  },
  plugins: [],
};

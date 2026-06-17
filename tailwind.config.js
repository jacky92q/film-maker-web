/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: '#E07A3C',
        'primary-dark': '#C75E2A',
        accent: '#F2547B',
        // Light, modern surfaces
        bg: '#FBFAF8',
        surface: '#FFFFFF',
        'surface-2': '#F4F1EC',
        'text-dark': '#1E1B18',
        'text-mid': '#7A736B',
        line: '#ECE7DF',
        danger: '#EF5350',
        teal: '#16B8A6',
        violet: '#7C6CF0',
        gold: '#C9A84C',
        // Editor (light) palette
        'ed-bg': '#EEF0F4',
        'ed-surface': '#FFFFFF',
        'ed-surface-2': '#F3F4F7',
        'ed-line': '#E6E8EE',
        'ed-text': '#5B616E',
        'ed-text-dark': '#1E2230',
        // legacy dark tokens (preview / splash)
        cream: '#F5F0E8',
        'dark-bg': '#0D0D0D',
        'dark-surface': '#17171A',
        'dark-surface-2': '#232327',
        'dark-line': '#2A2A2F',
        'dark-text': '#B0A890',
      },
      fontFamily: {
        sans: ['Lato', 'NotoSansKR', 'system-ui', 'sans-serif'],
        serif: ['PlayfairDisplay', 'NotoSerifKR', 'serif'],
        display: ['Cinzel', 'BlackHanSans', 'serif'],
        script: ['DancingScript', 'Gaegu', 'cursive'],
        elegant: ['EBGaramond', 'GowunBatang', 'serif'],
        modern: ['Montserrat', 'DoHyeon', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 16px rgba(30,27,24,0.06)',
        elevated: '0 18px 50px -12px rgba(224,122,60,0.35)',
        soft: '0 2px 10px rgba(30,27,24,0.05)',
        glow: '0 0 40px rgba(242,84,123,0.35)',
      },
      borderRadius: { xl2: '24px', xl3: '32px' },
      backgroundImage: {
        brand: 'linear-gradient(135deg,#FF9A56 0%,#F2547B 55%,#A86CF0 100%)',
        'brand-warm': 'linear-gradient(135deg,#FFB155 0%,#E8526E 100%)',
      },
      keyframes: {
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.95)' },
        },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        gradient: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        blob: 'blob 14s ease-in-out infinite',
        floaty: 'floaty 5s ease-in-out infinite',
        gradient: 'gradient 8s ease infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm light palette (non-editor screens)
        primary: '#C07842',
        'primary-dark': '#8B5A2B',
        bg: '#FAF5ED',
        surface: '#FFFFFF',
        'surface-2': '#FFF8F2',
        'text-dark': '#2C1810',
        'text-mid': '#8B7355',
        line: '#ECE0D4',
        danger: '#E85D4A',
        teal: '#1AA38C',
        violet: '#6B5CE7',
        // Dark palette (editor / preview / export)
        gold: '#C9A84C',
        cream: '#F5F0E8',
        'dark-bg': '#0D0D0D',
        'dark-surface': '#1A1A1A',
        'dark-surface-2': '#242424',
        'dark-line': '#2A2A2A',
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
        card: '0 3px 10px rgba(0,0,0,0.05)',
        elevated: '0 8px 20px rgba(192,120,66,0.25)',
        soft: '0 2px 8px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        xl2: '22px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        floaty: 'floaty 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

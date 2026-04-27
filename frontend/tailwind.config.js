/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0f0f0f',
        surface:  '#1a1a1a',
        surface2: '#222222',
        surface3: '#2a2a2a',
        gold:     '#c8a96e',
        gold2:    '#e8c99a',
        muted:    '#888888',
        evgreen:  '#1D9E75',
        evamber:  '#BA7517',
        evred:    '#e24b4a',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(200,169,110,0.18)',
      },
    },
  },
  plugins: [],
}

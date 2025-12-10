/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        primary: 'var(--primary)',
        muted: 'var(--muted)',
        accent: 'var(--accent)'
      },
      spacing: {
        'layout': 'clamp(1rem, 2.5vw, 2rem)'
      },
      fontSize: {
        '2xs': ['0.625rem', {lineHeight: '0.75rem'}],
        'xs': ['0.75rem', {lineHeight: '0.875rem'}],
        'sm': ['0.875rem',{lineHeight:'1.125rem'}],
        'base': ['1rem',{lineHeight:'1.5rem'}],
        'lg': ['1.125rem',{lineHeight:'1.75rem'}],
        'xl': ['1.25rem',{lineHeight:'1.75rem'}],
        '2xl': ['1.5rem',{lineHeight:'2rem'}]
      }
    }
  },
  plugins: [],
}


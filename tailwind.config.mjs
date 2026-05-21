/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c4a265',
          foreground: '#fefcfa',
        },
        accent: {
          DEFAULT: '#c09556',
          foreground: '#fefcfa',
        },
        background: '#f9f5ef',
        foreground: '#3a3129',
        muted: {
          DEFAULT: '#f0ece4',
          foreground: '#7d7060',
        },
        card: {
          DEFAULT: '#fefcfa',
          foreground: '#3a3129',
        },
        border: '#e8e0d5',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

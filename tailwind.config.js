/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0050FF',
          50: '#E6EEFF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3385FF',
          500: '#0050FF',
          600: '#0047E6',
          700: '#003DB3',
          800: '#003380',
          900: '#00294D',
        },
        accent: {
          DEFAULT: '#00D9FF',
          50: '#E6F9FF',
          100: '#CCF3FF',
          200: '#99E7FF',
          300: '#66DBFF',
          400: '#33D0FF',
          500: '#00D9FF',
          600: '#00C2E6',
          700: '#00A3BF',
          800: '#008499',
          900: '#006573',
        },
      },
    },
  },
  plugins: [],
}

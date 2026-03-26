/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          100: '#B0E9F6',
          150: '#CCEBF6',
          300: '#63A3D8',
          400: '#0783BC',
          700: '#194B8E',
          800: '#0C1659',
          900: '#0D365F',
          950: '#03112E',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['Kitchakan', 'Roboto', 'sans-serif'],
        body: ['Montserrat', 'Roboto', 'sans-serif'],
      },
    },
  },
}

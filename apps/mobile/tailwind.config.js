/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/shared/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFB74D',
          foreground: '#000000',
        },
        background: '#FFFFFF',
        foreground: '#000000',
        card: '#FFFFFF',
        'card-foreground': '#000000',
        muted: '#F5F5F5',
        'muted-foreground': '#666666',
        border: '#E5E5E5',
        input: '#E5E5E5',
        accent: '#F5F5F5',
        'accent-foreground': '#000000',
      },
    },
  },
  plugins: [],
};

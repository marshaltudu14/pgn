/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
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

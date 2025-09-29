/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sk-red': '#dc2626',
        'sk-red-hover': '#b91c1c',
        'sk-gray': {
          DEFAULT: '#f3f4f6',
          hover: '#e5e7eb',
        },
      },
    },
  },
  plugins: [],
};

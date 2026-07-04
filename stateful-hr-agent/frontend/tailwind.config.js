/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#fafafa',
        elevated: '#f5f5f5',
        'b-subtle': '#f0f0f0',
        'b-default': '#e5e5e5',
        't-primary': '#000000',
        't-secondary': '#404040',
        't-muted': '#737373',
      },
    },
  },
  plugins: [],
}

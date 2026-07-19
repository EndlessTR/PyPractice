/** @type {import('tailwindcss').Config} */
export default { darkMode: 'class', content: ['./index.html', './src/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#172033', brand: { 50: '#eef9ff', 500: '#1689c7', 600: '#0875b3', 700: '#075d8f' } }, boxShadow: { card: '0 12px 36px -20px rgb(15 23 42 / .32)' } } }, plugins: [] }

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Geist Sans', 'sans-serif'],
                header: ['Syne', 'sans-serif'],
            },
            colors: {
                bg: '#050510',
                glass: 'rgba(255, 255, 255, 0.05)',
            },
        },
    },
    plugins: [],
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f2',
          100: '#e4ebe0',
          200: '#c8d7c0',
          300: '#a3b899',
          400: '#8aa47e',
          500: '#6d8a62',
          600: '#566e4e',
          700: '#445840',
          800: '#394836',
          900: '#303d2f',
        },
        lavender: {
          50: '#f5f3f8',
          100: '#ebe7f1',
          200: '#d8d0e4',
          300: '#c4b5d4',
          400: '#a890be',
          500: '#9175aa',
          600: '#7b5f94',
          700: '#664e7a',
          800: '#554165',
          900: '#483854',
        },
        cream: {
          50: '#fdfbf7',
          100: '#f9f5ed',
          200: '#f2e9d8',
          300: '#e8d9bf',
          400: '#dcc5a0',
          500: '#cfb185',
          600: '#b8956a',
          700: '#9a7a57',
          800: '#7e6449',
          900: '#68533e',
        },
      },
    },
  },
  plugins: [],
};
export default config;

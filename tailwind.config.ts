import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta discreta, tom "escritório jurídico" — azul-marinho profundo
        // e um acento âmbar/dourado (referência a selos/documentos oficiais),
        // não o roxo/lavanda-padrão de SaaS genérico.
        ink: {
          950: '#0f1720',
          900: '#16212e',
          800: '#1f2f40',
          700: '#2c4256',
        },
        parchment: {
          50: '#faf8f3',
          100: '#f3efe4',
        },
        gold: {
          600: '#a9772f',
          500: '#c08a3e',
        },
      },
      fontFamily: {
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

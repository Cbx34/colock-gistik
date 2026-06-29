import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        colock: '#F57C00',
        ink: '#27221f',
      },
    },
  },
  plugins: [],
};

export default config;

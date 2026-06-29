import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'rolling': 'rolling 5s linear infinite',
      },
      keyframes: {
        rolling: {
          '0%, 40%': { transform: 'translateY(0)' },
          '50%, 90%': { transform: 'translateY(-24px)' },
          '100%': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
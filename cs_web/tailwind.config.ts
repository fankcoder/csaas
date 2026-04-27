import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 14px 40px rgba(15, 23, 42, 0.08)",
        glow: "0 0 0 1px rgba(59, 130, 246, 0.12), 0 18px 50px rgba(30, 64, 175, 0.16)"
      },
      colors: {
        ink: {
          950: "#07111F"
        }
      }
    }
  },
  plugins: []
};

export default config;
